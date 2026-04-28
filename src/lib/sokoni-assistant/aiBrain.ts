// Sokoni BEAST brain — Lovable-free.
// Cascade: edge function (Groq → Gemini → OpenAI) → rule-based fallback.
// If no AI key is configured on the backend, the edge function returns
// {fallback:"rules"} and we transparently route to detectIntent (free).

import {
  execSearch, execNavigate, execContactSeller, execFavorite,
  execMarketAnalysis, execShopAction, execStartListing,
  execWalkthrough, execEndSession, execOpenListing,
  type BeastToolResult,
} from "./beastTools";
import { cleanShengInput, withStarter } from "./beastPersonality";
import {
  loadMemory, saveMemory, recordIntent, topPreferences,
} from "./beastMemory";
import { detectIntent } from "./intents";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sokoni-assistant`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export type BeastAction = {
  navigate?: string;
  external?: string;
  endSession?: boolean;
  data?: any;
  toolName?: string;
};

export type BeastResult = {
  reply: string;
  action?: BeastAction;
  /** Active multi-turn flow state to pass back on the next turn. */
  flowState?: import("./conversation").FlowState | null;
};

type ToolCallAccum = { name: string; args: string };

export async function streamChat(opts: {
  messages: ChatMsg[];
  username?: string | null;
  isLoggedIn: boolean;
  userId?: string | null;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  flowState?: import("./conversation").FlowState | null;
}): Promise<BeastResult> {
  const { messages, username, isLoggedIn, userId, onDelta, signal, flowState } = opts;

  const enriched = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user"
      ? { ...m, content: cleanShengInput(m.content) }
      : m,
  );

  const mem = loadMemory(userId || null);
  const prefs = topPreferences(mem);
  const memoryNote: ChatMsg = {
    role: "system",
    content:
      `USER MEMORY: recent_views=${mem.viewedListings.slice(0, 5).join(",") || "none"}; ` +
      `cart_intent=${mem.cartIntent.slice(0, 3).join(",") || "none"}; ` +
      `top_category=${prefs.category || "unknown"}; ` +
      `top_location=${prefs.location || "unknown"}; ` +
      `total_interactions=${mem.totalInteractions}.`,
  };

  // If a multi-turn flow is active, drive it through the rule engine — the
  // LLM has no context for our yes/no state machine.
  if (flowState) {
    return await runRuleFallback(messages, username, isLoggedIn, onDelta, mem, userId, flowState);
  }

  let resp: Response;
  try {
    resp = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
      signal,
      body: JSON.stringify({
        action: "chat",
        data: { messages: [memoryNote, ...enriched], username, isLoggedIn },
      }),
    });
  } catch {
    return await runRuleFallback(messages, username, isLoggedIn, onDelta, mem, userId);
  }

  // Backend signalled "no AI configured" or "all providers failed" → use rules.
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const j = await resp.json();
      if (j?.fallback === "rules") {
        return await runRuleFallback(messages, username, isLoggedIn, onDelta, mem, userId);
      }
      if (j?.error) {
        if (resp.status === 429) throw new Error("Too many requests. Try again in a moment.");
        throw new Error(j.error);
      }
    } catch (e: any) {
      if (e?.message) throw e;
    }
  }

  if (!resp.ok || !resp.body) {
    // Network/server error — degrade gracefully to rules.
    return await runRuleFallback(messages, username, isLoggedIn, onDelta, mem, userId);
  }

  // ---- Stream OpenAI-compatible SSE from the AI provider ----
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";
  const toolCalls: Record<number, ToolCallAccum> = {};
  let done = false;

  while (!done) {
    const { value, done: rDone } = await reader.read();
    if (rDone) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;
        if (typeof delta.content === "string" && delta.content) {
          assembled += delta.content;
          onDelta(delta.content);
        }
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCalls[idx]) toolCalls[idx] = { name: "", args: "" };
            if (tc.function?.name) toolCalls[idx].name += tc.function.name;
            if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
          }
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  const firstCall = Object.values(toolCalls)[0];
  let action: BeastAction | undefined;
  let toolReply = "";

  if (firstCall && firstCall.name) {
    let args: any = {};
    try { args = firstCall.args ? JSON.parse(firstCall.args) : {}; } catch { /* noop */ }
    const result = await dispatchTool(firstCall.name, args, userId || null);
    if (result) {
      action = {
        navigate: result.navigate, external: result.external,
        endSession: result.endSession, data: result.data, toolName: firstCall.name,
      };
      toolReply = result.message;
      recordIntent(mem, firstCall.name, args);
      saveMemory(userId || null, mem);
    }
  }

  let finalReply = assembled.trim();
  if (toolReply) {
    if (!finalReply) {
      finalReply = withStarter(toolReply);
      onDelta(finalReply);
    } else {
      finalReply = `${finalReply}\n\n${toolReply}`;
      onDelta(`\n\n${toolReply}`);
    }
  }

  // If we got nothing at all from the AI, fall back to rules instead of "…".
  if (!finalReply) {
    return await runRuleFallback(messages, username, isLoggedIn, onDelta, mem, userId);
  }

  return { reply: finalReply, action };
}

// ---- Rule-based fallback (100% free, no external calls) ----
async function runRuleFallback(
  messages: ChatMsg[],
  username: string | null | undefined,
  isLoggedIn: boolean,
  onDelta: (chunk: string) => void,
  mem: ReturnType<typeof loadMemory>,
  userId?: string | null,
  flowState?: import("./conversation").FlowState | null,
): Promise<BeastResult> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const userText = last?.content?.trim() || "";
  if (!userText) {
    const msg = "I didn't catch that. Could you say it again?";
    onDelta(msg);
    return { reply: msg };
  }

  const intent = await detectIntent(userText, {
    username: username || null,
    isLoggedIn,
    walkthroughStep: 0,
    flowState: flowState ?? null,
  });

  const reply = withStarter(intent.reply);
  onDelta(reply);

  let action: BeastAction | undefined;
  if (intent.action) {
    switch (intent.action.type) {
      case "navigate":     action = { navigate: intent.action.path }; break;
      case "external":     action = { external: intent.action.url }; break;
      case "end_session":  action = { endSession: true }; break;
      case "speak_steps":  /* handled by the UI if needed */ break;
    }
  }

  // Memory bookkeeping
  recordIntent(mem, "rules_fallback", { text: userText });
  saveMemory(userId || null, mem);

  return { reply, action, flowState: intent.flowState ?? null };
}

async function dispatchTool(name: string, args: any, userId: string | null): Promise<BeastToolResult | null> {
  switch (name) {
    case "search_marketplace": return execSearch(args);
    case "navigate":           return execNavigate(args);
    case "open_listing":       return execOpenListing(args);
    case "contact_seller":     return execContactSeller(args);
    case "save_favorite":      return execFavorite(args, userId);
    case "market_analysis":    return execMarketAnalysis(args);
    case "shop_action":        return execShopAction(args, userId);
    case "start_listing":      return execStartListing(args, userId);
    case "walkthrough":        return execWalkthrough();
    case "end_session":        return execEndSession();
    default:                   return null;
  }
}

export function welcomeMessage(ctx: { username?: string | null; isLoggedIn: boolean }): string {
  if (ctx.isLoggedIn && ctx.username) {
    return `Karibu tena, ${ctx.username}! I'm the Sokoni Arena assistant. Ask me to find anything, open any page, or guide you step by step — and I'll handle it.`;
  }
  return "Karibu! I'm the Sokoni Arena assistant. I can hunt down products, services, shops or events, take you to any page, contact sellers and walk you through every feature. Just ask.";
}
