// Sokoni BEAST brain.
// Streams replies from the sokoni-assistant edge function (Lovable AI Gateway)
// and dispatches the LLM's tool calls to client-side fang executors.
//
// Returns the final assembled text + the resolved action(s), plus token deltas via onDelta.

import {
  execSearch, execNavigate, execContactSeller, execFavorite,
  execMarketAnalysis, execShopAction, execStartListing,
  execWalkthrough, execEndSession, execOpenListing,
  type BeastToolResult,
} from "./beastTools";
import { cleanShengInput, withStarter } from "./beastPersonality";
import {
  loadMemory, saveMemory, recordIntent, topPreferences,
  type BeastMemorySnapshot,
} from "./beastMemory";

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
};

type ToolCallAccum = { name: string; args: string };

export async function streamChat(opts: {
  messages: ChatMsg[];
  username?: string | null;
  isLoggedIn: boolean;
  userId?: string | null;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<BeastResult> {
  const { messages, username, isLoggedIn, userId, onDelta, signal } = opts;

  // Pre-clean the latest user message (Sheng → English)
  const enriched = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user"
      ? { ...m, content: cleanShengInput(m.content) }
      : m,
  );

  // Inject memory context as a system note so the LLM uses it
  const mem = loadMemory(userId || null);
  const prefs = topPreferences(mem);
  const memoryNote: ChatMsg = {
    role: "system",
    content:
      `USER MEMORY (use to personalize): ` +
      `recent_views=${mem.viewedListings.slice(0, 5).join(",") || "none"}; ` +
      `cart_intent=${mem.cartIntent.slice(0, 3).join(",") || "none"}; ` +
      `top_category=${prefs.category || "unknown"}; ` +
      `top_location=${prefs.location || "unknown"}; ` +
      `total_interactions=${mem.totalInteractions}.`,
  };

  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
    signal,
    body: JSON.stringify({
      action: "chat",
      data: { messages: [memoryNote, ...enriched], username, isLoggedIn },
    }),
  });

  if (!resp.ok || !resp.body) {
    let errMsg = "AI request failed";
    try { errMsg = (await resp.json())?.error || errMsg; } catch { /* noop */ }
    if (resp.status === 429) errMsg = "I'm getting a lot of requests right now. Please try again in a moment.";
    if (resp.status === 402) errMsg = "AI credits are exhausted. Please add credits in Lovable workspace settings.";
    throw new Error(errMsg);
  }

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

  // Resolve first tool call
  const firstCall = Object.values(toolCalls)[0];
  let action: BeastAction | undefined;
  let toolReply = "";

  if (firstCall && firstCall.name) {
    let args: any = {};
    try { args = firstCall.args ? JSON.parse(firstCall.args) : {}; } catch { /* noop */ }
    const result = await dispatchTool(firstCall.name, args, userId || null);
    if (result) {
      action = {
        navigate: result.navigate,
        external: result.external,
        endSession: result.endSession,
        data: result.data,
        toolName: firstCall.name,
      };
      toolReply = result.message;
      // Update memory
      recordIntent(mem, firstCall.name, args);
      saveMemory(userId || null, mem);
    }
  }

  // Decide final reply: prefer model text if any; otherwise use tool message.
  let finalReply = assembled.trim();
  if (toolReply) {
    if (!finalReply) {
      finalReply = withStarter(toolReply);
      onDelta(finalReply);
    } else {
      // Append tool action confirmation only if model didn't already mention it
      finalReply = `${finalReply}\n\n${toolReply}`;
      onDelta(`\n\n${toolReply}`);
    }
  }

  return { reply: finalReply || "…", action };
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
    return `Karibu tena, ${ctx.username}! I'm Sokoni Beast 🦁 — your marketplace predator. I can search, navigate, contact sellers, save favorites, analyze prices, follow shops or help you sell. Tap the mic or just type — twende!`;
  }
  return "Karibu! I'm Sokoni Beast 🦁 — your AI marketplace predator. I can hunt down products, services, shops or events, contact sellers via Call/WhatsApp, analyze market prices and guide you through SokoniArena. Sign in for personalised power, or just talk to me.";
}
