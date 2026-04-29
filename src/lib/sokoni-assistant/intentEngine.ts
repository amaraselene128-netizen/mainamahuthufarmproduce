// =====================================================================
// Sokoni Arena — Intent Engine (offline brain, no third-party LLM).
// 600+ phrases mapped to structured intents. English + Swahili + Sheng.
//
// Returns a typed Intent the rule layer can dispatch deterministically:
//   NAVIGATE, SEARCH, PURCHASE, SELL, SAVE, CONTACT, SERVICE_REQUEST,
//   COMPARE, MODIFY, CANCEL, QUESTION, GREET, THANK, BYE, HELP, SELF,
//   NEGATION, CORRECTION, ACK, SMALLTALK, UNKNOWN.
//
// Designed for speed: precompiled regexes, single-pass matching, ~O(n)
// over a small fixed dictionary. Average classification < 1ms.
// =====================================================================

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
export type IntentType =
  | "NAVIGATE" | "SEARCH" | "PURCHASE" | "SELL" | "SAVE" | "UNSAVE"
  | "CONTACT" | "SERVICE_REQUEST" | "COMPARE" | "MODIFY" | "SORT"
  | "CANCEL" | "QUESTION_HOWTO" | "QUESTION_WHAT" | "QUESTION_WHY"
  | "QUESTION_PRICE" | "QUESTION_LOCATION" | "QUESTION_TIME"
  | "GREET" | "THANK" | "BYE" | "HELP" | "SELF" | "NEGATION"
  | "CORRECTION" | "ACK" | "SMALLTALK" | "WALKTHROUGH" | "ADVANTAGE"
  | "UNKNOWN";

export type ContactMethod = "WHATSAPP" | "CALL" | "MESSAGE" | "EMAIL" | "ANY";

export type SortMode =
  | "PRICE_ASC" | "PRICE_DESC" | "DATE_DESC" | "DATE_ASC"
  | "RATING_DESC" | "POPULARITY" | "DISTANCE";

export type SearchFilters = {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string;
  condition?: "new" | "used";
  urgent?: boolean;
  quantity?: number;
};

export type Intent = {
  type: IntentType;
  confidence: number;       // 0..1
  /** Free-text query for SEARCH / SERVICE_REQUEST / QUESTION_* */
  query?: string;
  /** Page key for NAVIGATE (matched against SITE_PAGES synonyms). */
  navTarget?: string;
  /** Section anchor for NAVIGATE inside the homepage. */
  navSection?: string;
  filters?: SearchFilters;
  contactMethod?: ContactMethod;
  sort?: SortMode;
  /** True when the user said "today / urgent / asap". */
  urgent?: boolean;
  /** Detected service category for SERVICE_REQUEST. */
  serviceCategory?: string;
  raw: string;
};

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const norm = (s: string) =>
  s.toLowerCase()
   .replace(/[’`]/g, "'")
   .replace(/[^\p{L}\p{N}\s+\-./?!,'"]/gu, " ")
   .replace(/\s+/g, " ")
   .trim();

function any(text: string, patterns: RegExp[]): RegExp | null {
  for (const re of patterns) if (re.test(text)) return re;
  return null;
}

// ---------------------------------------------------------------------
// 1. Navigation phrases & page-name dictionary (Section 1)
// ---------------------------------------------------------------------
const NAV_VERBS = [
  "take me to", "kindly take me to", "please open", "let'?s go to",
  "can you take me to", "i (?:want|need|would like) to go to",
  "i'?m trying to reach", "my destination is",
  "go to", "open", "show me", "navigate to", "bring me to",
  "direct me to", "lead me to", "move me to", "switch to", "change to",
  "head to", "proceed to", "transport me to", "visit", "jump to",
  "scroll to", "back to", "return to",
  // Swahili / Sheng
  "nipeleke", "fungua", "rudi", "elekea", "nenda",
];
const NAV_RE = new RegExp("\\b(?:" + NAV_VERBS.join("|") + ")\\b", "i");

/** name → page key (matched later against SITE_PAGES). Order matters: longer first. */
const PAGE_TARGETS: { keys: string[]; target: string; section?: string }[] = [
  { keys: ["my listings", "my ads", "my posts", "things i'?m selling"], target: "/dashboard" },
  { keys: ["my shop", "my store", "my business", "seller dashboard"], target: "/dashboard?tab=shop" },
  { keys: ["my cart", "shopping cart", "the cart", "cart", "basket", "my bag", "bag"], target: "/dashboard?tab=cart" },
  { keys: ["my orders", "orders"], target: "/dashboard" },
  { keys: ["my favorites", "my favourites", "favorites", "favourites", "wishlist", "saved items", "liked items", "bookmarks", "saved listings"], target: "/favorites" },
  { keys: ["my profile", "edit profile", "profile editor"], target: "/dashboard?tab=profile" },
  { keys: ["dashboard", "my account", "account", "my area"], target: "/dashboard" },
  { keys: ["messages", "chats", "inbox", "conversations", "ujumbe", "dms"], target: "/messages" },
  { keys: ["fun circle notifications", "social notifications"], target: "/fun-circle/notifications" },
  { keys: ["fun circle", "funcircle", "social", "stories", "timeline", "friends area", "community"], target: "/fun-circle" },
  { keys: ["checkout", "pay", "payment", "complete purchase"], target: "/dashboard?tab=cart" },
  { keys: ["sign in", "log in", "login", "ingia"], target: "/login" },
  { keys: ["sign up", "register", "create account", "join", "become a member", "jisajili"], target: "/register" },
  { keys: ["forgot password", "reset password", "password reset"], target: "/forgot-password" },
  { keys: ["help center", "help", "support", "assistance", "faq", "customer care"], target: "/help" },
  { keys: ["terms of service", "terms", "tos", "rules"], target: "/terms" },
  { keys: ["privacy policy", "data policy", "privacy"], target: "/privacy" },
  { keys: ["how it works", "how to use", "walkthrough", "tutorial", "onboarding", "guide"], target: "/how-it-works" },
  { keys: ["settings", "preferences", "options", "configurations"], target: "/dashboard?tab=profile" },
  { keys: ["all shops", "shops", "stores", "maduka", "vendors", "sellers", "businesses", "merchants"], target: "/shops" },
  { keys: ["events", "matukio", "happenings", "occasions", "functions", "galas"], target: "/events" },
  { keys: ["services", "huduma", "service providers", "professionals", "experts"], target: "/services" },
  { keys: ["products", "items", "bidhaa", "merchandise", "things for sale", "goods"], target: "/products" },
  { keys: ["search page", "search"], target: "/search" },
  { keys: ["admin panel", "admin"], target: "/admin" },
  { keys: ["home", "homepage", "main page", "front page", "landing", "dashboard home", "start page"], target: "/" },
];

const HOME_SECTION_KEYS: { keys: string[]; section: string }[] = [
  { keys: ["flash sales", "today'?s deals", "deals", "promoted"], section: "flash-sales" },
  { keys: ["featured shops"], section: "featured-shops" },
  { keys: ["premium shops"], section: "premium-shops" },
  { keys: ["top shops"], section: "top-shops" },
  { keys: ["featured listings", "trending listings"], section: "featured-listings" },
  { keys: ["recommendations", "for you", "you might also like"], section: "you-might-like" },
  { keys: ["categories"], section: "categories" },
];

// ---------------------------------------------------------------------
// 2. Search phrases (Section 2)
// ---------------------------------------------------------------------
const SEARCH_VERBS = [
  "search for", "find me", "look for", "show me", "i'?m looking for",
  "i (?:need|want|would like|am after)", "get me", "where can i find",
  "do you have", "got any", "any", "help me find", "can you find",
  "locate", "hunt for", "seek", "track down", "source me",
  "procure", "acquire",
  // Swahili / Sheng
  "natafuta", "tafuta", "nipe", "tafutia",
];
const SEARCH_RE = new RegExp("\\b(?:" + SEARCH_VERBS.join("|") + ")\\b", "i");

const PRICE_NUM = "(?:ksh\\s*)?(?:kshs?\\s*)?\\$?\\d[\\d,.]*\\s*k?";
const MAX_PRICE_RE = new RegExp(`\\b(?:under|below|less than|not more than|max(?:imum)?|up to|within)\\s+(${PRICE_NUM})\\b`, "i");
const MIN_PRICE_RE = new RegExp(`\\b(?:over|above|more than|at least|min(?:imum)?|from|starting at)\\s+(${PRICE_NUM})\\b`, "i");
const RANGE_RE = new RegExp(`\\b(?:between|from)\\s+(${PRICE_NUM})\\s+(?:and|to|-)\\s+(${PRICE_NUM})\\b`, "i");
const LOCATION_RE = /\b(?:in|near|around|close to|kwenye|jiji la|mji wa)\s+([A-Za-z][A-Za-z\s\-']{1,30})\b/i;
const NEW_RE = /\b(brand\s*new|new condition|new)\b/i;
const USED_RE = /\b(used|second\s*hand|second-hand|preowned|pre-owned|refurbished)\b/i;
const URGENT_RE = /\b(urgent(?:ly)?|asap|as soon as possible|right now|immediately|today|quickly|fast|rush|express)\b/i;

function parsePrice(token: string): number | undefined {
  if (!token) return undefined;
  let t = token.toLowerCase().replace(/ksh|kshs|\$|,/g, "").trim();
  let mult = 1;
  if (/k$/.test(t)) { mult = 1000; t = t.slice(0, -1); }
  const n = parseFloat(t);
  if (Number.isFinite(n)) return n * mult;
  return undefined;
}

function extractFilters(text: string): SearchFilters {
  const f: SearchFilters = {};
  const range = text.match(RANGE_RE);
  if (range) {
    const a = parsePrice(range[1]);
    const b = parsePrice(range[2]);
    if (a !== undefined && b !== undefined) {
      f.minPrice = Math.min(a, b);
      f.maxPrice = Math.max(a, b);
    }
  } else {
    const mx = text.match(MAX_PRICE_RE);
    if (mx) f.maxPrice = parsePrice(mx[1]);
    const mn = text.match(MIN_PRICE_RE);
    if (mn) f.minPrice = parsePrice(mn[1]);
  }
  const loc = text.match(LOCATION_RE);
  if (loc) f.location = loc[1].trim();
  if (NEW_RE.test(text) && !USED_RE.test(text)) f.condition = "new";
  else if (USED_RE.test(text)) f.condition = "used";
  if (URGENT_RE.test(text)) f.urgent = true;
  const QTY: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, dozen: 12, "a pair": 2 };
  for (const [w, n] of Object.entries(QTY)) {
    if (new RegExp(`\\b${w}\\b`, "i").test(text)) { f.quantity = n; break; }
  }
  return f;
}

function stripFilterPhrases(text: string): string {
  return text
    .replace(RANGE_RE, " ")
    .replace(MAX_PRICE_RE, " ")
    .replace(MIN_PRICE_RE, " ")
    .replace(LOCATION_RE, " ")
    .replace(URGENT_RE, " ")
    .replace(/\b(only|please|kindly|just|tu)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------
// 3. Purchase / Sell / Save / Contact / Cancel (Sections 4-7, 11)
// ---------------------------------------------------------------------
const PURCHASE_RE = /\b(buy|purchase|order|add to (?:cart|basket)|i'?ll take|i want to buy|i'?m buying|i'?d like to purchase|put in my cart|pay for|proceed to pay|complete purchase|make payment for|i'?m ready to buy|chukua|nunulia|nataka kununua)\b/i;

const SELL_RE = /\b(sell|list|post|advertise|offer for sale|put up for sale|get rid of|dispose of|offload|i want to sell|i'?m selling|looking to sell|need to sell|how (?:to|do i) sell|steps to sell|can i sell|is it easy to sell|nataka kuuza|niuze)\b/i;

const SAVE_RE = /\b(save|favorite|favourite|bookmark|heart|like|add to wishlist|add to favorites?|save for later|keep|remember this|mark|star|pin|i like this|interested in this|nimependa)\b/i;
const UNSAVE_RE = /\b(remove from favorites?|unlike|unheart|remove saved|delete from wishlist|take off favorites?)\b/i;

const CONTACT_RE = /\b(contact|message|chat with|talk to|reach|call|whats?app|text|dm|send (?:a )?message|get in touch with|communicate with|inquire with|reach out to|piga simu|mtumie ujumbe)\b/i;
const WHATSAPP_RE = /\bwhats?app\b/i;
const CALL_RE = /\b(call|phone|piga simu|ringo)\b/i;
const EMAIL_RE = /\b(email|e-mail|tuma email)\b/i;

const CANCEL_RE = /\b(cancel|undo|reverse|take back|remove|delete|discard|abandon|forget(?: it)?|never mind|scratch that|disregard|ignore|wacha|achana)\b/i;

// ---------------------------------------------------------------------
// 4. Service request (Section 8)
// ---------------------------------------------------------------------
const SERVICE_INTRO_RE = /\b(i need a|find me a|get me a|looking for a|need help from|someone who can|expert who|professional to|specialist in|fundi wa|tafuta fundi|nipe fundi)\b/i;
const SERVICE_MAP: { keys: RegExp; cat: string }[] = [
  { keys: /\b(plumber|fundi wa bomba|pipe repair|leakage)\b/i, cat: "PLUMBING" },
  { keys: /\b(electrician|fundi wa stima|wireman|electric)\b/i, cat: "ELECTRICAL" },
  { keys: /\b(carpenter|fundi wa mbao|joiner|wood ?work)\b/i, cat: "CARPENTRY" },
  { keys: /\b(mechanic|fundi wa gari|car repair|auto)\b/i, cat: "AUTO_MECHANIC" },
  { keys: /\b(painter|fundi wa rangi|painting)\b/i, cat: "PAINTING" },
  { keys: /\b(mason|fundi wa ujenzi|builder|construction)\b/i, cat: "CONSTRUCTION" },
  { keys: /\b(cleaner|house cleaning|mop|cleaning service)\b/i, cat: "CLEANING" },
  { keys: /\b(gardener|landscaper|fundi wa maua|gardening)\b/i, cat: "GARDENING" },
  { keys: /\b(hairdresser|barber|salon|braids|stylist)\b/i, cat: "BEAUTY" },
  { keys: /\b(makeup artist|mua|nails|manicure|pedicure)\b/i, cat: "BEAUTY" },
  { keys: /\b(photographer|cameraman|photography|videographer|video|filming)\b/i, cat: "PHOTOGRAPHY" },
  { keys: /\b(event planner|wedding planner|planner|organizer)\b/i, cat: "EVENT_PLANNING" },
  { keys: /\b(dj|disc jockey|mc|master of ceremonies)\b/i, cat: "ENTERTAINMENT" },
  { keys: /\b(caterer|catering|chakula|food service)\b/i, cat: "CATERING" },
  { keys: /\b(decorator|decoration|decor)\b/i, cat: "DECORATION" },
  { keys: /\b(driver|taxi|uber|bolt|chauffeur)\b/i, cat: "TRANSPORT" },
  { keys: /\b(tutor|teacher|instructor|coach|mwalimu)\b/i, cat: "EDUCATION" },
];

// ---------------------------------------------------------------------
// 5. Comparison + Modify/Sort (Sections 9-10)
// ---------------------------------------------------------------------
const COMPARE_RE = /\b(compare|versus|\bvs\.?\b|difference between|which is (?:better|cheaper|faster|stronger)|better between|best between|pros and cons of|advantages? of|disadvantages? of|which one should i get|help me decide|side by side)\b/i;
const FILTER_RE = /\b(filter by|narrow down to|limit to|only show|show only|just|exclude|remove)\b/i;
const SORT_PHRASES: { re: RegExp; sort: SortMode }[] = [
  { re: /\b(cheapest first|price low to high|ascending price|low.*high.*price)\b/i, sort: "PRICE_ASC" },
  { re: /\b(most expensive first|price high to low|descending price|high.*low.*price)\b/i, sort: "PRICE_DESC" },
  { re: /\b(newest first|latest|most recent|new arrivals|brand new first)\b/i, sort: "DATE_DESC" },
  { re: /\b(oldest first|most established)\b/i, sort: "DATE_ASC" },
  { re: /\b(best rated|highest rated|top rated)\b/i, sort: "RATING_DESC" },
  { re: /\b(most popular|best selling|trending)\b/i, sort: "POPULARITY" },
  { re: /\b(nearest|closest|nearby first)\b/i, sort: "DISTANCE" },
];

// ---------------------------------------------------------------------
// 6. Questions (Section 3)
// ---------------------------------------------------------------------
const HOWTO_RE = /\b(how do i|how can i|how to|what'?s the way to|steps to|process to|guide me to|teach me how to|show me how to|explain how to|what'?s the procedure for|methodology for)\b/i;
const WHAT_RE = /\b(what is|what are|what'?s|tell me about|define|describe|explain|elaborate on|clarify|what does .+ mean)\b/i;
const WHY_RE = /\bwhy (?:is|are|does|do|did|would|should)\b/i;
const PRICE_Q_RE = /\b(how much (?:is|does|for)|what (?:is|'?s) the (?:price|cost) of|price of|cost of|what does .+ cost|how many shillings|going rate for|current market price of|bei (?:gani|ya)|unauza kiasi gani)\b/i;
const LOCATION_Q_RE = /\b(where (?:is|can i|do i|to)|location of|directions to|how to get to|nearest|closest|nearby|iko wapi)\b/i;
const TIME_Q_RE = /\b(when (?:is|does|will)|what time|what day|schedule of|date of|timing for|opening hours?|closing time)\b/i;

// ---------------------------------------------------------------------
// 7. Social / negation / correction (Sections 12-13)
// ---------------------------------------------------------------------
const GREET_RE = /^\s*(hi|hello|hey|hola|jambo|habari|mambo|niaje|sasa|vipi|sup|yo|howdy|greetings|good (?:morning|afternoon|evening))\b/i;
const BYE_RE = /\b(bye|goodbye|kwaheri|see you(?: later)?|later|peace out|adios|bye bye|take care|until next time|i'?m done|that'?s all|end session|stop)\b/i;
const THANK_RE = /\b(thank you|thanks|asante(?: sana)?|thanks a lot|thx|much appreciated|i appreciate it|grateful)\b/i;
const ACK_RE = /^\s*(okay|ok|alright|sure|fine|got it|understood|i see|makes sense|roger that|copy that|10-4|word|bet|cool|nice|great|awesome|perfect|sawa|poa|safi)\b/i;
const SMALLTALK_RE = /\b(how are you|how'?s it going|how you doing|what'?s up|what'?s good|how'?s your day|you good|how'?s everything)\b/i;
const NEGATION_RE = /\b(not that|not this|not what i meant|no thanks|negative|not interested|pass|skip|next|not what i'?m looking for)\b/i;
const CORRECTION_RE = /\b(i meant|actually|correction|sorry i meant|let me rephrase|what i meant was|i said)\b/i;
const HELP_RE = /\b(what can you do|help me|capabilities|commands|menu|nisaidie)\b/i;
const SELF_RE = /\b(who are you|what are you|your name|introduce yourself|jina lako)\b/i;
const WALK_RE = /\b(walk ?through|tour|guide me|show me around|how does (?:this|the site) work|onboarding|introduce me)\b/i;
const ADVANTAGE_RE = /\b(why|advantage|benefit|outstanding|special|different|unique|features?).{0,20}\b(sokoni|arena|this site|marketplace|app)\b/i;

// ---------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------
export function classify(rawInput: string): Intent {
  const raw = rawInput || "";
  const text = norm(raw);
  if (!text) return { type: "UNKNOWN", confidence: 0, raw };

  // Order matters — more specific intents win first.
  if (BYE_RE.test(text)) return { type: "BYE", confidence: 0.97, raw };
  if (THANK_RE.test(text) && !SEARCH_RE.test(text)) return { type: "THANK", confidence: 0.95, raw };
  if (GREET_RE.test(text) && text.split(/\s+/).length <= 4) return { type: "GREET", confidence: 0.95, raw };
  if (SMALLTALK_RE.test(text)) return { type: "SMALLTALK", confidence: 0.9, raw };
  if (SELF_RE.test(text)) return { type: "SELF", confidence: 0.95, raw };
  if (HELP_RE.test(text) && !SEARCH_RE.test(text)) return { type: "HELP", confidence: 0.92, raw };
  if (WALK_RE.test(text)) return { type: "WALKTHROUGH", confidence: 0.95, raw };
  if (ADVANTAGE_RE.test(text)) return { type: "ADVANTAGE", confidence: 0.9, raw };
  if (CORRECTION_RE.test(text)) return { type: "CORRECTION", confidence: 0.85, raw, query: text };
  if (NEGATION_RE.test(text)) return { type: "NEGATION", confidence: 0.85, raw };
  if (ACK_RE.test(text) && text.split(/\s+/).length <= 4) return { type: "ACK", confidence: 0.85, raw };

  // Sort directives (often piggy-back on a search but sometimes alone)
  let sortMode: SortMode | undefined;
  for (const sp of SORT_PHRASES) if (sp.re.test(text)) { sortMode = sp.sort; break; }

  // Service request
  if (SERVICE_INTRO_RE.test(text) || /\bfundi\b/i.test(text)) {
    let cat: string | undefined;
    for (const m of SERVICE_MAP) if (m.keys.test(text)) { cat = m.cat; break; }
    return {
      type: "SERVICE_REQUEST",
      confidence: cat ? 0.95 : 0.78,
      query: stripFilterPhrases(text),
      filters: extractFilters(text),
      serviceCategory: cat,
      raw,
    };
  }
  // Service category match without intro phrase ("plumber near me")
  for (const m of SERVICE_MAP) {
    if (m.keys.test(text)) {
      return {
        type: "SERVICE_REQUEST",
        confidence: 0.88,
        query: stripFilterPhrases(text),
        filters: extractFilters(text),
        serviceCategory: m.cat,
        raw,
      };
    }
  }

  // Comparison
  if (COMPARE_RE.test(text)) {
    return { type: "COMPARE", confidence: 0.92, query: stripFilterPhrases(text), raw };
  }

  // Cancel
  if (CANCEL_RE.test(text) && !SAVE_RE.test(text) && !SEARCH_RE.test(text)) {
    return { type: "CANCEL", confidence: 0.85, query: text, raw };
  }

  // Save / Unsave
  if (UNSAVE_RE.test(text)) return { type: "UNSAVE", confidence: 0.92, raw };
  if (SAVE_RE.test(text) && !SEARCH_RE.test(text) && !PURCHASE_RE.test(text)) {
    return { type: "SAVE", confidence: 0.88, raw };
  }

  // Contact
  if (CONTACT_RE.test(text)) {
    let method: ContactMethod = "ANY";
    if (WHATSAPP_RE.test(text)) method = "WHATSAPP";
    else if (CALL_RE.test(text)) method = "CALL";
    else if (EMAIL_RE.test(text)) method = "EMAIL";
    else method = "MESSAGE";
    return { type: "CONTACT", confidence: 0.92, contactMethod: method, raw };
  }

  // Sell
  if (SELL_RE.test(text)) {
    return { type: "SELL", confidence: 0.93, query: stripFilterPhrases(text), raw };
  }

  // Purchase
  if (PURCHASE_RE.test(text)) {
    return { type: "PURCHASE", confidence: 0.95, query: stripFilterPhrases(text), filters: extractFilters(text), urgent: URGENT_RE.test(text), raw };
  }

  // Questions — price/location/time first (more specific), then how/what/why
  if (PRICE_Q_RE.test(text)) return { type: "QUESTION_PRICE", confidence: 0.93, query: stripFilterPhrases(text), raw };
  if (LOCATION_Q_RE.test(text)) return { type: "QUESTION_LOCATION", confidence: 0.9, query: stripFilterPhrases(text), raw };
  if (TIME_Q_RE.test(text)) return { type: "QUESTION_TIME", confidence: 0.9, query: stripFilterPhrases(text), raw };
  if (HOWTO_RE.test(text)) return { type: "QUESTION_HOWTO", confidence: 0.93, query: stripFilterPhrases(text), raw };
  if (WHY_RE.test(text)) return { type: "QUESTION_WHY", confidence: 0.88, query: stripFilterPhrases(text), raw };
  if (WHAT_RE.test(text)) return { type: "QUESTION_WHAT", confidence: 0.88, query: stripFilterPhrases(text), raw };

  // Navigation — explicit verb OR just a page name like "shops"
  const navHit = matchPageTarget(text);
  if (NAV_RE.test(text) && navHit) {
    return { type: "NAVIGATE", confidence: 0.96, navTarget: navHit.target, navSection: navHit.section, raw };
  }
  if (navHit && text.split(/\s+/).length <= 4) {
    return { type: "NAVIGATE", confidence: 0.85, navTarget: navHit.target, navSection: navHit.section, raw };
  }
  // Home section anchor without page name (e.g. "scroll to flash sales")
  for (const sec of HOME_SECTION_KEYS) {
    for (const k of sec.keys) {
      if (new RegExp(`\\b${k}\\b`, "i").test(text)) {
        return { type: "NAVIGATE", confidence: 0.9, navTarget: "/", navSection: sec.section, raw };
      }
    }
  }

  // Modify / Sort
  if (sortMode) return { type: "SORT", confidence: 0.9, sort: sortMode, raw };
  if (FILTER_RE.test(text)) return { type: "MODIFY", confidence: 0.82, filters: extractFilters(text), query: stripFilterPhrases(text), raw };

  // Search — explicit phrase OR an unmatched short noun phrase ("iPhone 13")
  const filters = extractFilters(text);
  const hasFilter = !!(filters.minPrice || filters.maxPrice || filters.location || filters.condition);
  if (SEARCH_RE.test(text) || hasFilter) {
    const cleaned = stripFilterPhrases(text.replace(SEARCH_RE, " ").replace(/^\s*for\s+/i, "")).trim();
    return { type: "SEARCH", confidence: SEARCH_RE.test(text) ? 0.94 : 0.82, query: cleaned || text, filters, raw };
  }

  // Implicit search fallback when message looks like a noun phrase
  if (text.split(/\s+/).length <= 8 && /[a-z]/i.test(text)) {
    return { type: "SEARCH", confidence: 0.6, query: stripFilterPhrases(text), filters, raw };
  }

  return { type: "UNKNOWN", confidence: 0.3, raw };
}

function matchPageTarget(text: string): { target: string; section?: string } | null {
  for (const p of PAGE_TARGETS) {
    for (const k of p.keys) {
      if (new RegExp(`\\b${k}\\b`, "i").test(text)) return { target: p.target, section: p.section };
    }
  }
  return null;
}

// Convenience exports for callers that want raw dictionaries.
export const _internals = { PAGE_TARGETS, HOME_SECTION_KEYS, SERVICE_MAP, NAV_RE, SEARCH_RE };
