// Smart rule-based intent engine for Sokoni Arena assistant.
// 100% offline. Combines: 600+ phrase intent classifier, smart semantic
// search, every-page navigation, multi-turn yes/no flows, walkthrough,
// FAQs, feature guides and Swahili/Sheng coverage.

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
import { classify, type Intent } from "./intentEngine";

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
  }

  // ── 600+ phrase intent classifier ──
  const intent = classify(rawText);

  switch (intent.type) {
    case "BYE":
      return {
        reply: `Goodbye${ctx.username ? `, ${ctx.username}` : ""}! Have a great day on Sokoni Arena.`,
        action: { type: "end_session" },
      };

    case "GREET":
      return { reply: `Hey${ctx.username ? `, ${ctx.username}` : ""}! What can I help you with — search, navigate, or learn how something works?` };

    case "THANK":
      return { reply: "Karibu sana! Anything else?" };

    case "SMALLTALK":
      return { reply: `I'm doing great${ctx.username ? `, ${ctx.username}` : ""}! Ready to help — search, navigate, or guide you. What do you need?` };

    case "SELF":
      return { reply: "I'm the Sokoni Arena assistant — a 100% offline brain trained on the marketplace. I search products, services, shops and events; navigate every page; contact sellers; compare items; and walk you through any feature." };

    case "HELP":
      return { reply: "Try: 'find dining sets in Nairobi under 30k', 'open Fun Circle', 'how do I post a listing', 'I need a plumber near me', or 'compare iPhone 13 and Samsung S22'. I also handle Swahili & Sheng." };

    case "WALKTHROUGH":
      return { reply: WALKTHROUGH_STEPS[0], action: { type: "speak_steps", steps: WALKTHROUGH_STEPS } };

    case "ADVANTAGE":
      return { reply: "Sokoni Arena stands out: " + SOKONI_ADVANTAGES.slice(0, 5).join("; ") + ". Want a walkthrough?" };

    case "ACK":
      return { reply: "👍 What next?" };

    case "NEGATION":
      return { reply: "No problem — tell me what you'd like instead." };

    case "CORRECTION":
      // Re-route the corrected query as a fresh search.
      return await runSearch(intent.query || rawText);

    case "NAVIGATE": {
      if (!intent.navTarget) break;
      const requiresAuth = SITE_PAGES.some(p => p.path === intent.navTarget && p.requiresAuth);
      if (requiresAuth && !ctx.isLoggedIn) {
        return { reply: "That page needs sign-in. Taking you to login.", action: { type: "navigate", path: "/login" } };
      }
      const path = intent.navSection ? `${intent.navTarget}#${intent.navSection}` : intent.navTarget;
      const label = SITE_PAGES.find(p => p.path === intent.navTarget)?.names[0] || "page";
      return { reply: `Opening ${label}.`, action: { type: "navigate", path } };
    }

    case "QUESTION_HOWTO":
    case "QUESTION_WHAT":
    case "QUESTION_WHY": {
      // Try feature guides + FAQs first.
      const feat = matchFeature(text);
      if (feat) {
        return {
          reply: `${feat.title}: ${feat.steps.join(". ")}.`,
          action: feat.cta ? { type: "navigate", path: feat.cta.path } : undefined,
        };
      }
      const faq = matchFaq(text);
      if (faq) return { reply: faq.answer };
      // Try kicking off a flow ("what is fun circle")
      const flow = findFlow(text);
      if (flow) {
        const adv = startFlow(flow, { isLoggedIn: ctx.isLoggedIn });
        if (adv.type === "reply") {
          return { reply: adv.reply, action: adv.navigate ? { type: "navigate", path: adv.navigate } : undefined, flowState: adv.ended ? undefined : adv.state };
        }
      }
      // Fallback: give a helpful answer + offer to search.
      return { reply: `I don't have a canned answer for that yet. Want me to search the marketplace for "${intent.query || rawText}"?`, action: { type: "navigate", path: `/search?q=${encodeURIComponent(intent.query || rawText)}` } };
    }

    case "QUESTION_PRICE":
      return await runSearch(intent.query || rawText);

    case "QUESTION_LOCATION": {
      const navHit = matchPage(text);
      if (navHit) return { reply: `Here's ${navHit.names[0]}.`, action: { type: "navigate", path: navHit.path } };
      return await runSearch(intent.query || rawText);
    }

    case "QUESTION_TIME": {
      // Events page is the best answer for time-based queries.
      return { reply: "Opening the Events page so you can see schedules.", action: { type: "navigate", path: "/events" } };
    }

    case "PURCHASE":
    case "SEARCH":
    case "MODIFY":
      return await runSearch(intent.query || rawText, intent);

    case "SORT":
      return { reply: `Got it — sorting by ${intent.sort}. Opening results.`, action: { type: "navigate", path: `/search?sort=${intent.sort}` } };

    case "SELL":
      if (!ctx.isLoggedIn) return { reply: "To list something, sign in first.", action: { type: "navigate", path: "/login" } };
      return { reply: "Opening the new listing form.", action: { type: "navigate", path: "/dashboard?action=new-listing" } };

    case "SAVE":
      if (!ctx.isLoggedIn) return { reply: "Sign in to save items.", action: { type: "navigate", path: "/login" } };
      return { reply: "Tap the heart on any listing to save it. Opening your favorites.", action: { type: "navigate", path: "/favorites" } };

    case "UNSAVE":
      if (!ctx.isLoggedIn) return { reply: "Sign in to manage favorites.", action: { type: "navigate", path: "/login" } };
      return { reply: "Open your favorites and tap the heart again to remove an item.", action: { type: "navigate", path: "/favorites" } };

    case "CONTACT": {
      const method = intent.contactMethod || "MESSAGE";
      return { reply: `Open any listing and tap ${method === "WHATSAPP" ? "WhatsApp" : method === "CALL" ? "Call" : method === "EMAIL" ? "Email" : "Message"} on the seller card.` };
    }

    case "SERVICE_REQUEST": {
      const q = intent.query || intent.serviceCategory || rawText;
      const r = await smartSearch(q, { limit: 8, type: "service" });
      const reply = describeResult(r);
      return { reply, action: { type: "navigate", path: bestNavigation(r) }, data: { listings: r.listings, shops: r.shops } };
    }

    case "COMPARE":
      return { reply: `Searching listings to compare: "${intent.query || rawText}"…`, action: { type: "navigate", path: `/search?q=${encodeURIComponent(intent.query || rawText)}` } };

    case "CANCEL":
      return { reply: "Cancelled. What would you like to do next?" };

    default:
      // Fallback to a search anyway — better than dead air.
      return await runSearch(rawText);
  }

  return { reply: "I'm not sure how to help with that. Try asking me to search, navigate, or guide you." };
}

async function runSearch(raw: string, _intent?: Intent): Promise<IntentResult> {
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
