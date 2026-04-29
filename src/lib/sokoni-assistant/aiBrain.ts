// Sokoni BEAST brain — 100% offline, no third-party LLM.
// Every message is classified by the local intent engine and answered
// from the in-app rule layer + DB search. Average response < 200 ms.
//
// Public surface stays unchanged so SokoniAssistant.tsx works as-is.

import { cleanShengInput, withStarter } from "./beastPersonality";
import { loadMemory, saveMemory, recordIntent } from "./beastMemory";
import { detectIntent } from "./intents";
import type { FlowState } from "./conversation";

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
  flowState?: FlowState | null;
};

export async function streamChat(opts: {
  messages: ChatMsg[];
  username?: string | null;
  isLoggedIn: boolean;
  userId?: string | null;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  flowState?: FlowState | null;
}): Promise<BeastResult> {
  const { messages, username, isLoggedIn, userId, onDelta, flowState } = opts;

  const last = [...messages].reverse().find((m) => m.role === "user");
  const userText = cleanShengInput(last?.content?.trim() || "");
  if (!userText) {
    const msg = "I didn't catch that. Could you say it again?";
    onDelta(msg);
    return { reply: msg };
  }

  const mem = loadMemory(userId || null);

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
      case "navigate":    action = { navigate: intent.action.path }; break;
      case "external":    action = { external: intent.action.url }; break;
      case "end_session": action = { endSession: true }; break;
      case "speak_steps": /* handled by UI if needed */ break;
    }
  }

  recordIntent(mem, "rules", { text: userText });
  saveMemory(userId || null, mem);

  return { reply, action, flowState: intent.flowState ?? null };
}

export function welcomeMessage(ctx: { username?: string | null; isLoggedIn: boolean }): string {
  if (ctx.isLoggedIn && ctx.username) {
    return `Karibu tena, ${ctx.username}! I'm the Sokoni Arena assistant. Ask me to find anything, open any page, or guide you step by step — and I'll handle it.`;
  }
  return "Karibu! I'm the Sokoni Arena assistant. I can hunt down products, services, shops or events, take you to any page, contact sellers and walk you through every feature. Just ask.";
}
