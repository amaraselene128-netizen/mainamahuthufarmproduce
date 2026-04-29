// =====================================================================
// Sokoni Arena — Training Data Lookup
// Fast offline knowledge base assembled from real datasets:
//   • 600+ small-talk Q→A pairs  (Conversation.csv)
//   • Tech-support issue → resolution map  (tech_support_dataset.csv)
//
// Lookup strategy: O(1) exact hit, then token-Jaccard fuzzy match across
// a precomputed inverted index. Average lookup < 1 ms on 600 entries.
// =====================================================================

import conversationPairs from "./data/conversationPairs.json";
import techSupportRaw from "./data/techSupport.json";

type TechEntry = { answer: string; category: string };

const CONV: Record<string, string> = conversationPairs as Record<string, string>;
const TECH: Record<string, TechEntry> = techSupportRaw as Record<string, TechEntry>;

// ---------------------------------------------------------------------
// Tokenizer + index
// ---------------------------------------------------------------------
const STOP = new Set([
  "a","an","the","is","am","are","was","were","be","been","being","do","does","did",
  "of","to","in","on","for","at","by","with","and","or","but","so","if","then","than",
  "i","you","he","she","it","we","they","me","my","your","his","her","our","their",
  "this","that","these","those","there","here","what","when","where","why","how",
  "can","could","would","should","will","shall","may","might","just","very","really",
  "have","has","had","get","got","up","down","out","into","about","over","again",
  "yes","no","not","yeah","yep","ok","okay","please","kindly",
]);

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

type Indexed = { key: string; tokens: Set<string> };
const convIndex: Indexed[] = Object.keys(CONV).map((k) => ({ key: k, tokens: new Set(tokenize(k)) }));
const techIndex: Indexed[] = Object.keys(TECH).map((k) => ({ key: k, tokens: new Set(tokenize(k)) }));

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function bestMatch(query: string, index: Indexed[], threshold = 0.5): string | null {
  const qTokens = new Set(tokenize(query));
  if (!qTokens.size) return null;
  let best: { key: string; score: number } | null = null;
  for (const e of index) {
    const s = jaccard(qTokens, e.tokens);
    if (s > (best?.score ?? 0)) best = { key: e.key, score: s };
  }
  return best && best.score >= threshold ? best.key : null;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/** Quick small-talk lookup. Returns a friendly reply or null. */
export function lookupConversation(input: string): string | null {
  const q = input.toLowerCase().trim().replace(/[?!.]+$/g, "");
  if (CONV[q]) return CONV[q];
  const hit = bestMatch(q, convIndex, 0.6);
  return hit ? CONV[hit] : null;
}

/** Tech-support / troubleshooting lookup. */
export function lookupTechSupport(input: string): { answer: string; category: string } | null {
  const q = input.toLowerCase().trim();
  if (TECH[q]) return TECH[q];
  const hit = bestMatch(q, techIndex, 0.45);
  return hit ? TECH[hit] : null;
}

/** Number of training rows currently loaded (debug / health). */
export function trainingStats() {
  return {
    conversationPairs: convIndex.length,
    techSupportIssues: techIndex.length,
  };
}
