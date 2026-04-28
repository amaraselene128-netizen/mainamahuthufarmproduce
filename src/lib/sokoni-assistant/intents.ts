// Smart rule-based intent engine for Sokoni Arena assistant.
// 100% free. Combines: smart semantic search, every-page navigation,
// multi-turn yes/no flows, walkthrough, FAQs and feature guides.

import {
  SITE_PAGES,
  HOME_SECTIONS,
  FEATURE_GUIDES,
  FAQS,
  SOKONI_ADVANTAGES,
  WALKTHROUGH_STEPS,
} from "./siteKnowledge";
import { smartSearch, describeResult, bestNavigation, type SmartSearchResult } from "./smartSearch";
import {
  findFlow, startFlow, continueFlow, type FlowState, type FlowAdvance,
} from "./conversation";

export type AssistantAction =
  | { type: "navigate"; path: string }
  | { type: "external"; url: string }
  | { type: "speak_steps"; steps: string[] }
  | { type: "end_session" };

export type IntentResult = {
  reply: string;
  action?: AssistantAction;
  data?: { listings?: any[]; shops?: any[] };
  /** When set, the next user turn should continue this flow. */
  flowState?: FlowState;
};

export type AssistantContext = {
  username?: string | null;
  isLoggedIn: boolean;
  walkthroughStep: number;
  /** Active multi-turn flow state, if any. */
  flowState?: FlowState | null;
};

const norm = (s: string) => s.toLowerCase().trim();

function matchPage(text: string) {
  for (const p of SITE_PAGES) {
    for (const n of p.names) {
      const re = new RegExp(`\\b${n.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (re.test(text)) return p;
    }
  }
  return null;
}

function matchHomeSection(text: string) {
  for (const s of HOME_SECTIONS) {
    for (const n of s.names) {
      if (text.includes(n)) return s;
    }
  }
  return null;
}

function matchFeature(text: string) {
  for (const f of FEATURE_GUIDES) {
    if (f.keys.some((k) => text.includes(k))) return f;
  }
  return null;
}

function matchFaq(text: string) {
  for (const f of FAQS) {
    if (f.keys.some((k) => text.includes(k))) return f;
  }
  return null;
}

const GREETING_RE = /^\s*(hi|hello|hey|habari|mambo|niaje|sasa|jambo|good (morning|afternoon|evening))\b/i;
const THANKS_RE = /\b(thank you|thanks|asante|thx|appreciate it)\b/i;
const BYE_RE = /\b(bye|goodbye|kwaheri|stop|end session|that('?s)? all|i'?m done)\b/i;
const SEARCH_RE = /\b(search|find|look for|show me|i (?:want|need|am looking for)|nipe|tafuta|do you have|any|got)\b/i;
const NAV_RE = /\b(open|go to|take me to|navigate to|show|visit|jump to|scroll to)\b/i;
const WALK_RE = /\b(walk ?through|tour|guide me|show me around|how does (this|the site) work|onboarding|introduce)\b/i;
const ADVANTAGE_RE = /\b(why|advantage|benefit|outstanding|special|different|unique|features?)\b.*\b(sokoni|arena|this site|marketplace|app)\b/i;
const HELP_RE = /\b(what can you do|help|commands|menu|capabilities)\b/i;
const SELF_RE = /\b(who are you|what are you|your name|introduce yourself)\b/i;
const FUNCIRCLE_Q_RE = /\bwhat\s+is\s+(?:sokoni\s+)?fun\s*circle\b/i;

export async function detectIntent(rawText: string, ctx: AssistantContext): Promise<IntentResult> {
  const text = norm(rawText);
  if (!text) return { reply: "I didn't catch that. Could you say it again?" };

  // ── Continue an active multi-turn flow first ──
  if (ctx.flowState) {
    const adv: FlowAdvance = continueFlow(ctx.flowState, rawText, { isLoggedIn: ctx.isLoggedIn });
    if (adv.type === "reply") {
      return {
        reply: adv.reply,
        action: adv.navigate ? { type: "navigate", path: adv.navigate } : undefined,
        flowState: adv.ended ? undefined : adv.state,
      };
    }
    // fall through to normal intent if flow yielded nothing
  }

  // ── End session ──
  if (BYE_RE.test(text)) {
    return {
      reply: `Goodbye${ctx.username ? `, ${ctx.username}` : ""}! Have a great day on Sokoni Arena.`,
      action: { type: "end_session" },
    };
  }

  // ── Greetings / small talk ──
  if (GREETING_RE.test(text)) {
    return { reply: `Hey${ctx.username ? `, ${ctx.username}` : ""}! What can I help you with — search, navigate, or learn how something works?` };
  }
  if (THANKS_RE.test(text)) return { reply: "Karibu! Anything else?" };
  if (SELF_RE.test(text)) {
    return { reply: "I'm the Sokoni Arena assistant — your free guide for the marketplace. I can search products, services, shops and events, navigate every page and section, contact sellers and walk you through any feature step by step." };
  }
  if (HELP_RE.test(text)) {
    return { reply: "I can search ('find dining sets in Nairobi'), navigate ('open Fun Circle' or 'take me to my dashboard'), explain features step by step ('how do I open a shop'), give a walkthrough, and answer FAQs about safety, payments and pricing. Just ask." };
  }

  // ── Walkthrough ──
  if (WALK_RE.test(text)) {
    return { reply: WALKTHROUGH_STEPS[0], action: { type: "speak_steps", steps: WALKTHROUGH_STEPS } };
  }

  // ── Why Sokoni Arena ──
  if (ADVANTAGE_RE.test(text)) {
    return { reply: "Sokoni Arena stands out: " + SOKONI_ADVANTAGES.slice(0, 5).join("; ") + ". Want a walkthrough?" };
  }

  // ── Multi-turn flow: kick off if user asks about something we have a flow for ──
  const flow = findFlow(text);
  if (flow) {
    const adv = startFlow(flow, { isLoggedIn: ctx.isLoggedIn });
    if (adv.type === "reply") {
      return {
        reply: adv.reply,
        action: adv.navigate ? { type: "navigate", path: adv.navigate } : undefined,
        flowState: adv.ended ? undefined : adv.state,
      };
    }
  }

  // Direct "what is fun circle" → flow
  if (FUNCIRCLE_Q_RE.test(text)) {
    const f = findFlow("fun circle")!;
    const adv = startFlow(f, { isLoggedIn: ctx.isLoggedIn });
    if (adv.type === "reply") {
      return { reply: adv.reply, flowState: adv.ended ? undefined : adv.state };
    }
  }

  // ── FAQ ──
  const faq = matchFaq(text);
  if (faq && !SEARCH_RE.test(text) && !NAV_RE.test(text)) {
    return { reply: faq.answer };
  }

  // ── Feature guides (how-to) ──
  const feat = matchFeature(text);
  if (feat) {
    const reply = `${feat.title}: ${feat.steps.join(". ")}.`;
    return { reply, action: feat.cta ? { type: "navigate", path: feat.cta.path } : undefined };
  }

  // ── Home section deep-link (e.g. "scroll to flash sales") ──
  const homeSec = matchHomeSection(text);
  if (homeSec && (NAV_RE.test(text) || /\b(flash sales|featured shops|top shops|premium shops)\b/i.test(text))) {
    return { reply: `Opening ${homeSec.label} on the homepage.`, action: { type: "navigate", path: `/#${homeSec.id}` } };
  }

  // ── Direct page navigation ──
  if (NAV_RE.test(text)) {
    const page = matchPage(text);
    if (page) {
      if (page.requiresAuth && !ctx.isLoggedIn) {
        return { reply: `${page.names[0]} needs sign-in. Taking you to login.`, action: { type: "navigate", path: "/login" } };
      }
      return { reply: `Opening ${page.names[0]}.`, action: { type: "navigate", path: page.path } };
    }
  }
  // Plain page reference like "shops" or "favorites"
  const pageOnly = matchPage(text);
  if (pageOnly && text.split(/\s+/).length <= 5) {
    if (pageOnly.requiresAuth && !ctx.isLoggedIn) {
      return { reply: `${pageOnly.names[0]} needs sign-in.`, action: { type: "navigate", path: "/login" } };
    }
    return { reply: `Opening ${pageOnly.names[0]}.`, action: { type: "navigate", path: pageOnly.path } };
  }

  // ── Personal account shortcuts ──
  if (/\b(my (listings|ads|shop|cart|orders|favorites?|profile))\b/i.test(text)) {
    if (!ctx.isLoggedIn) {
      return { reply: "Sign in first to access your account. Opening login.", action: { type: "navigate", path: "/login" } };
    }
    if (/favorite/.test(text)) return { reply: "Opening your favorites.", action: { type: "navigate", path: "/favorites" } };
    return { reply: "Opening your dashboard.", action: { type: "navigate", path: "/dashboard" } };
  }

  // ── Search (explicit OR fallback) ──
  const stripped = SEARCH_RE.test(text)
    ? text.replace(SEARCH_RE, " ").replace(/^\s*for\s+/i, "").trim()
    : rawText;
  return await runSearch(stripped || rawText);
}

async function runSearch(raw: string): Promise<IntentResult> {
  try {
    const result: SmartSearchResult = await smartSearch(raw, { limit: 8 });
    const reply = describeResult(result);
    const path = bestNavigation(result);
    return {
      reply,
      action: { type: "navigate", path },
      data: { listings: result.listings, shops: result.shops },
    };
  } catch {
    return {
      reply: `Searching for "${raw}"…`,
      action: { type: "navigate", path: `/search?q=${encodeURIComponent(raw)}` },
    };
  }
}

export function welcomeMessage(ctx: AssistantContext): string {
  if (ctx.isLoggedIn && ctx.username) {
    return `Karibu tena, ${ctx.username}! I'm the Sokoni Arena assistant. Tell me what to find or where to go and I'll handle it.`;
  }
  return "Karibu! I'm the Sokoni Arena assistant. I can hunt down products, navigate any page, or guide you step by step. Just ask.";
}
