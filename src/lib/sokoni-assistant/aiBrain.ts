// AI brain for Sokoni Assistant.
// Streams replies from the sokoni-assistant edge function (Gemini 2.5 Flash Lite)
// and parses tool calls (search_marketplace, navigate, end_session).
//
// Returns the final assembled text + any tool action, plus token deltas via onDelta.

import { searchEverything } from "./dbSearch";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sokoni-assistant`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export type AiAction =
  | { type: "navigate"; path: string }
  | { type: "search"; query: string; data?: { listings?: any[]; shops?: any[] } }
  | { type: "end_session" };

export type AiResult = {
  reply: string;
  action?: AiAction;
};

type ToolCallAccum = {
  name: string;
  args: string;
};

export async function streamChat(opts: {
  messages: ChatMsg[];
  username?: string | null;
  isLoggedIn: boolean;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<AiResult> {
  const { messages, username, isLoggedIn, onDelta, signal } = opts;

  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
    },
    signal,
    body: JSON.stringify({
      action: "chat",
      data: { messages, username, isLoggedIn },
    }),
  });

  if (!resp.ok || !resp.body) {
    let errMsg = "AI request failed";
    try {
      const j = await resp.json();
      errMsg = j.error || errMsg;
    } catch { /* noop */ }
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
        // partial JSON across chunks — re-buffer
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Resolve tool call (use first one)
  const firstCall = Object.values(toolCalls)[0];
  let action: AiAction | undefined;
  let appendReply = "";

  if (firstCall && firstCall.name) {
    let args: any = {};
    try { args = firstCall.args ? JSON.parse(firstCall.args) : {}; } catch { /* noop */ }

    if (firstCall.name === "navigate" && typeof args.path === "string") {
      action = { type: "navigate", path: args.path };
      if (!assembled.trim()) appendReply = `Opening ${args.path} for you.`;
    } else if (firstCall.name === "search_marketplace" && typeof args.query === "string") {
      // Run real DB search client-side so we can show previews + summarise
      try {
        const result = await searchEverything(args.query, 5);
        action = {
          type: "search",
          query: result.parsed.text || args.query,
          data: { listings: result.listings, shops: result.shops },
        };
        if (!assembled.trim()) {
          if (result.listings.length || result.shops.length) {
            const top = result.listings[0];
            const priceTxt = top?.price ? ` at KES ${Number(top.price).toLocaleString()}` : "";
            const locTxt = top?.location ? ` in ${top.location}` : "";
            appendReply = result.listings.length
              ? `I found ${result.listings.length} match${result.listings.length > 1 ? "es" : ""}. Top pick: ${top.title}${priceTxt}${locTxt}. Opening the search page.`
              : `Found ${result.shops.length} shop${result.shops.length > 1 ? "s" : ""} matching that. Opening search now.`;
          } else {
            appendReply = `I couldn't find anything for "${args.query}". Want to try different keywords?`;
          }
        }
      } catch {
        action = { type: "search", query: args.query };
        if (!assembled.trim()) appendReply = `Searching for "${args.query}"…`;
      }
    } else if (firstCall.name === "end_session") {
      action = { type: "end_session" };
      if (!assembled.trim()) appendReply = "Goodbye! Have a great day on SokoniArena.";
    }
  }

  if (appendReply) {
    onDelta(appendReply);
    assembled += appendReply;
  }

  return { reply: assembled.trim() || "…", action };
}

export function welcomeMessage(ctx: { username?: string | null; isLoggedIn: boolean }): string {
  if (ctx.isLoggedIn && ctx.username) {
    return `Karibu tena, ${ctx.username}! 👋 I'm Sokoni Assistant. Ask me anything — how to post a listing, open a shop, find products, reset your password… I'll walk you through it.`;
  }
  return "Karibu! 👋 I'm Sokoni Assistant. Ask me anything about SokoniArena — how to do something, where to find it, or just tell me what you're looking for.";
}
