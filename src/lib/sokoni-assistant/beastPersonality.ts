// Sokoni Beast personality — the "helpful predator" voice.
// Sprinkles Swahili/Sheng for warmth without overdoing it.

const STARTERS = ["Sawa!", "Poa!", "Nimekusikia.", "Got it.", "On it!", "Aki sawa,", "Twende!"];

const SWAHILI_REPLACEMENTS: [RegExp, string][] = [
  [/\bhello\b/gi, "Jambo"],
  [/\bthanks\b/gi, "asante"],
  [/\byou'?re welcome\b/gi, "karibu"],
  [/\bwelcome\b/gi, "karibu"],
];

export function spice(text: string): string {
  let out = text.trim();
  for (const [re, rep] of SWAHILI_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

export function withStarter(text: string): string {
  const s = STARTERS[Math.floor(Math.random() * STARTERS.length)];
  return `${s} ${spice(text)}`;
}

// Clean Sheng/Swahili user input into English for better LLM understanding.
const SHENG_MAP: Record<string, string> = {
  "niko na budget ya": "I have a budget of",
  "niko na": "I have",
  "nipe": "give me",
  "tafuta": "search",
  "tafutia": "search for",
  "bei gani": "what is the price",
  "iko wapi": "where is it",
  "sawa": "okay",
  "poa": "cool",
  "ngapi": "how many",
  "kitu": "item",
  "vitu": "items",
  "bidhaa": "product",
  "duka": "shop",
  "maduka": "shops",
  "fundi": "expert",
  "boda": "motorcycle",
  "matatu": "minibus",
  "huduma": "service",
  "matukio": "events",
  "samani": "furniture",
  "viatu": "shoes",
  "nguo": "clothes",
  "simu": "phone",
  "kompyuta": "laptop",
  "gari": "car",
  "pikipiki": "motorcycle",
  "ksh": "KES",
  "k sh": "KES",
};

export function cleanShengInput(raw: string): string {
  let s = ` ${raw.toLowerCase()} `;
  for (const [k, v] of Object.entries(SHENG_MAP)) {
    s = s.replace(new RegExp(`\\b${k}\\b`, "gi"), v);
  }
  return s.trim();
}
