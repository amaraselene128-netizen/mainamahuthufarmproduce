// Smarter rule-based intent engine for Sokoni Assistant.
// Combines: navigation, live DB search, walkthrough, FAQs, feature guides.
// 100% free — runs in the browser.

import {
  SITE_PAGES,
  FEATURE_GUIDES,
  FAQS,
  SOKONI_ADVANTAGES,
  WALKTHROUGH_STEPS,
} from "./siteKnowledge";
import { searchEverything, summariseResults, parseQuery } from "./dbSearch";

export type AssistantAction =
  | { type: "navigate"; path: string }
  | { type: "search"; query: string }
  | { type: "external"; url: string }
  | { type: "speak_steps"; steps: string[] }
  | { type: "end_session" };

export type IntentResult = {
  reply: string;
  action?: AssistantAction;
  // Optional structured payload for the UI (e.g. listing previews)
  data?: { listings?: any[]; shops?: any[] };
};

export type AssistantContext = {
  username?: string | null;
  isLoggedIn: boolean;
  walkthroughStep: number;
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
const SEARCH_RE = /\b(search|find|look for|show me|i (?:want|need|am looking for)|nipe|tafuta|do you have|any)\b/i;
const NAV_RE = /\b(open|go to|take me to|navigate to|show|visit)\b/i;
const WALK_RE = /\b(walk ?through|tour|guide me|show me around|how does (this|the site) work|onboarding|introduce)\b/i;
const ADVANTAGE_RE = /\b(why|advantage|benefit|outstanding|special|different|unique|features?)\b.*\b(sokoni|arena|this site|marketplace|app)\b/i;
const HELP_RE = /\b(what can you do|help|commands|menu|capabilities)\b/i;
const SELF_RE = /\b(who are you|what are you|your name|introduce yourself)\b/i;

export async function detectIntent(rawText: string, ctx: AssistantContext): Promise<IntentResult> {
  const text = norm(rawText);
  if (!text) return { reply: "I didn't catch that. Could you say it again?" };

  // --- End session ---
  if (BYE_RE.test(text)) {
    return {
      reply: `Goodbye${ctx.username ? `, ${ctx.username}` : ""}! Have a great day on SokoniArena.`,
      action: { type: "end_session" },
    };
  }

  // --- Greetings ---
  if (GREETING_RE.test(text)) {
    const name = ctx.username ? `, ${ctx.username}` : "";
    return {
      reply: `Hey${name}! What can I help you with — search, navigate, or learn how something works?`,
    };
  }

  if (THANKS_RE.test(text)) {
    return { reply: "You're welcome! Anything else?" };
  }

  if (SELF_RE.test(text)) {
    return {
      reply:
        "I'm Sokoni Assistant — your free voice guide for SokoniArena. I can search products, services, shops and events, navigate the site, and explain every feature.",
    };
  }

  if (HELP_RE.test(text)) {
    return {
      reply:
        "I can: search ('find iPhones under 30k in Nairobi'), navigate ('open shops'), explain features ('how do I open a shop'), give a walkthrough ('show me around'), and answer FAQs about safety, payments and pricing. Just talk to me.",
    };
  }

  // --- Walkthrough ---
  if (WALK_RE.test(text)) {
    return {
      reply: WALKTHROUGH_STEPS[0],
      action: { type: "speak_steps", steps: WALKTHROUGH_STEPS },
    };
  }

  // --- Why SokoniArena ---
  if (ADVANTAGE_RE.test(text)) {
    return {
      reply:
        "SokoniArena stands out because: " +
        SOKONI_ADVANTAGES.slice(0, 5).join("; ") +
        ". Want me to walk you through it?",
    };
  }

  // --- FAQ ---
  const faq = matchFaq(text);
  if (faq && !SEARCH_RE.test(text) && !NAV_RE.test(text)) {
    return { reply: faq.answer };
  }

  // --- Feature guides (how-to) ---
  const feat = matchFeature(text);
  if (feat) {
    const reply = `${feat.title}: ${feat.steps.join(". ")}.`;
    return {
      reply,
      action: feat.cta ? { type: "navigate", path: feat.cta.path } : undefined,
    };
  }

  // --- Navigation ---
  if (NAV_RE.test(text)) {
    const page = matchPage(text);
    if (page) {
      return {
        reply: `Opening ${page.names[0]} for you.`,
        action: { type: "navigate", path: page.path },
      };
    }
  }
  // Plain page reference like "shops" or "favorites"
  const pageOnly = matchPage(text);
  if (pageOnly && (NAV_RE.test(text) || text.split(/\s+/).length <= 4)) {
    return {
      reply: `Opening ${pageOnly.names[0]}.`,
      action: { type: "navigate", path: pageOnly.path },
    };
  }

  // --- Personal account shortcuts ---
  if (/\b(my (listings|ads|shop|cart|orders|favorites?))\b/i.test(text)) {
    if (!ctx.isLoggedIn) {
      return {
        reply: "You'll need to sign in first to access your account. Taking you to login.",
        action: { type: "navigate", path: "/login" },
      };
    }
    if (/favorite/.test(text)) return { reply: "Opening your favorites.", action: { type: "navigate", path: "/favorites" } };
    return { reply: "Opening your dashboard.", action: { type: "navigate", path: "/dashboard" } };
  }

  // --- Search (explicit) ---
  if (SEARCH_RE.test(text)) {
    const stripped = text.replace(SEARCH_RE, " ").replace(/^\s*for\s+/i, "").trim();
    return await runSearch(stripped || rawText);
  }

  // --- Fallback: treat as search ---
  return await runSearch(rawText);
}

async function runSearch(raw: string): Promise<IntentResult> {
  try {
    const result = await searchEverything(raw, 5);
    const reply = summariseResults(result);
    return {
      reply,
      action: { type: "search", query: result.parsed.text || raw },
      data: { listings: result.listings, shops: result.shops },
    };
  } catch {
    const parsed = parseQuery(raw);
    return {
      reply: `Searching for "${parsed.text}"…`,
      action: { type: "search", query: parsed.text },
    };
  }
}

export function welcomeMessage(ctx: AssistantContext): string {
  if (ctx.isLoggedIn && ctx.username) {
    return `Welcome back, ${ctx.username}! I'm Sokoni Assistant. Tap the mic and tell me what you'd like to find or do — I'll listen until you end the session.`;
  }
  return "Karibu! I'm Sokoni Assistant — your free voice guide to SokoniArena. Sign in to get personalised help, or just tap the mic and ask me anything: search, navigate, or learn how the site works.";
}
