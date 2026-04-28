// Sokoni Arena — Semantic Network (the Brain)
// Hierarchical keyword expansion so search "never returns zero results".
// Bundled offline, free, instant. Optionally augmented from `assistant_brain` table.

import { supabase } from "@/integrations/supabase/untyped-client";

export type ExpansionHit = {
  term: string;          // expanded keyword to search for
  weight: number;        // 1.0 exact, lower = looser relation
  category?: string;     // canonical bucket (e.g. "vehicles", "furniture")
};

export type ExpandedQuery = {
  original: string;
  cleaned: string;
  terms: ExpansionHit[];          // unique expanded terms (incl. original)
  rootCategory?: string;          // best-guess parent bucket
  rootSubcategory?: string;       // narrower bucket
  location?: string;
  minPrice?: number;
  maxPrice?: number;
};

// ─── Canonical clusters: parent bucket → child keywords ────────────────────
// Each cluster lists every word that should ALSO be searched when the
// user mentions the parent OR any child. Bidirectional.
const CLUSTERS: { id: string; words: string[] }[] = [
  // ── Vehicles ──
  { id: "vehicles:cars", words: [
    "car","cars","vehicle","auto","automobile","motor","ride","gari","sedan","suv","hatchback",
    "pickup","van","wagon","coupe","convertible","minivan","mpv","crossover","saloon",
    "toyota","honda","nissan","mazda","subaru","mitsubishi","suzuki","daihatsu","isuzu","lexus",
    "mercedes","mercedes-benz","benz","bmw","audi","volkswagen","vw","volvo","peugeot","renault",
    "land rover","range rover","jaguar","porsche","ford","chevrolet","jeep",
    "hyundai","kia","chery","gwm","haval","byd","geely","baic","changan",
    "axio","premio","allion","corolla","camry","vitz","passo","fielder","fit","civic",
    "rav4","harrier","prado","land cruiser","x-trail","forester","outlander","cx-5",
    "hilux","navara","ranger","d-max","l200",
  ]},
  { id: "vehicles:motorcycles", words: [
    "motorcycle","motorbike","bike","boda","boda boda","scooter","moped","cycle","pikipiki",
    "boxer","tvs","bajaj","hero","yamaha","suzuki bike","honda dream","ninja","r1","cbr",
  ]},
  { id: "vehicles:parts", words: [
    "spare part","spare parts","spares","tyre","tire","tires","tyres","battery","headlight",
    "engine","brake","brakes","suspension","clutch","gearbox","alternator","radiator",
    "rim","alloy","mat","car mat","seat cover","stereo","dashcam","gps tracker","wipers",
  ]},
  { id: "vehicles:services", words: [
    "mechanic","car wash","panel beater","auto electrician","tire fitter","oil change",
    "wheel alignment","car service","detailing","car towing",
  ]},

  // ── Electronics ──
  { id: "electronics:phones", words: [
    "phone","phones","smartphone","smart phone","mobile","cellphone","handset","simu","device",
    "iphone","apple","samsung","galaxy","tecno","infinix","itel","nokia","huawei","xiaomi","redmi","poco",
    "oppo","vivo","realme","oneplus","google pixel","pixel","sony xperia","spark","camon","pova","note",
    "feature phone","basic phone","foldable","fold","flip",
  ]},
  { id: "electronics:laptops", words: [
    "laptop","laptops","computer","pc","notebook","desktop","macbook","mac","chromebook",
    "dell","hp","lenovo","thinkpad","ideapad","acer","aspire","asus","vivobook","zenbook","rog","tuf",
    "msi","razer","alienware","omen","predator","legion","surface","spectre","envy","pavilion","latitude","elitebook",
    "ultrabook","gaming laptop","business laptop","student laptop","convertible laptop","2 in 1",
  ]},
  { id: "electronics:tablets", words: [
    "tablet","tablets","ipad","samsung tab","huawei matepad","lenovo tab","amazon fire","xiaomi pad",
  ]},
  { id: "electronics:audio", words: [
    "headphones","headsets","earphones","earbuds","airpods","iems","bluetooth speaker","speaker","speakers",
    "soundbar","home theatre","home theater","jbl","bose","sony headphones","beats",
  ]},
  { id: "electronics:tv", words: [
    "tv","television","led tv","smart tv","oled","qled","4k tv","8k tv","samsung tv","lg tv","sony tv",
    "tcl","hisense","vitron","syinix","skyworth",
  ]},
  { id: "electronics:cameras", words: [
    "camera","cameras","dslr","mirrorless","gopro","action camera","drone","cctv","security camera","webcam",
    "canon","nikon","sony alpha","fujifilm",
  ]},
  { id: "electronics:gaming", words: [
    "gaming","playstation","ps5","ps4","xbox","nintendo","switch","gaming pc","console","controller",
    "joystick","steering wheel gaming",
  ]},
  { id: "electronics:accessories", words: [
    "charger","chargers","power bank","powerbank","cable","adapter","screen protector","tempered glass",
    "phone case","laptop bag","mouse","keyboard","docking station","usb hub","ssd","hard drive","ram",
  ]},

  // ── Fashion ──
  { id: "fashion:mens", words: [
    "shirt","shirts","t-shirt","tee","polo","trouser","trousers","pants","jeans","shorts","suit","blazer",
    "jacket","hoodie","sweater","kanzu","kitenge","ankara",
  ]},
  { id: "fashion:womens", words: [
    "dress","dresses","skirt","blouse","top","jumpsuit","leggings","cardigan","abaya","hijab","kitenge dress",
    "ankara dress","gown","frock","maxi","mini",
  ]},
  { id: "fashion:shoes", words: [
    "shoe","shoes","viatu","sneakers","sandals","heels","boots","loafers","trainers","kicks","footwear",
    "sports shoes","school shoes","formal shoes","nike","adidas","puma","bata",
  ]},
  { id: "fashion:accessories", words: [
    "watch","watches","timepiece","wristwatch","smartwatch","jewelry","jewellery","necklace","earring","ring",
    "bracelet","handbag","wallet","belt","hat","cap","sunglasses","tie","scarf",
  ]},

  // ── Home & Living: Furniture (the chair / sofa / table cluster) ──
  { id: "home:seating", words: [
    "chair","chairs","seat","seating","stool","bench","sofa","couch","settee","loveseat","sectional",
    "l-shaped","u-shaped","3-seater","2-seater","4-seater","5-seater","seater","recliner","armchair",
    "wingback","accent chair","barrel chair","rocking chair","gaming chair","office chair","bean bag",
    "throne","futon","sofa bed","sleeper sofa","chaise","daybed","ottoman",
  ]},
  { id: "home:tables", words: [
    "table","tables","desk","workstation","coffee table","dining table","dining set","dinning set","dining",
    "side table","bedside table","nightstand","console table","study table","kitchen table","bar table",
    "tv stand","tv unit",
  ]},
  { id: "home:beds", words: [
    "bed","beds","mattress","bunk","bunk bed","cot","headboard","king bed","queen bed","double bed","single bed",
    "memory foam","spring mattress","orthopedic","sheet","duvet","pillow","blanket","comforter","bedding",
  ]},
  { id: "home:storage", words: [
    "wardrobe","closet","cupboard","cabinet","drawer","dresser","chest of drawers","bookshelf","shelf","shelves",
    "shoe rack","tv cabinet","sideboard","credenza","armoire",
  ]},
  { id: "home:kitchen", words: [
    "fridge","refrigerator","freezer","microwave","oven","cooker","gas cooker","stove","blender","kettle",
    "toaster","air fryer","mixer","utensils","cookware","crockery","cutlery","sufuria","jiko","pressure cooker",
  ]},
  { id: "home:appliances", words: [
    "washing machine","dryer","iron","vacuum cleaner","ac","air conditioner","fan","heater","water heater",
    "water dispenser","dispenser","generator","inverter","solar","solar panel",
  ]},
  { id: "home:decor", words: [
    "curtain","curtains","rug","carpet","wall art","mirror","lamp","vase","clock","cushion","throw pillow",
    "artificial plant","wallpaper",
  ]},

  // ── Property ──
  { id: "property", words: [
    "house","home","apartment","flat","bedsitter","studio","plot","land","shamba","commercial space",
    "office space","godown","warehouse","airbnb","short stay","rental","for rent","for sale","nyumba",
  ]},

  // ── Services ──
  { id: "services:home", words: [
    "plumber","electrician","carpenter","painter","mason","fundi","handyman","cleaner","cleaning",
    "gardener","pool cleaner","pest control","movers","moving",
  ]},
  { id: "services:beauty", words: [
    "hairdresser","barber","makeup artist","mua","manicure","pedicure","massage","facial","salon","spa",
    "nail tech","braids","weave","wig",
  ]},
  { id: "services:tech", words: [
    "phone repair","laptop repair","software developer","web designer","graphic designer","it support",
    "data entry","website","app developer","seo","digital marketing","social media manager",
  ]},
  { id: "services:professional", words: [
    "accountant","lawyer","consultant","photographer","videographer","event planner","wedding planner",
    "tutor","driving instructor","translator",
  ]},

  // ── Events ──
  { id: "events", words: [
    "event","events","matukio","concert","festival","party","wedding","graduation","funeral","burial",
    "harambee","fundraiser","conference","seminar","workshop","training","trade fair","launch","crusade",
    "service","prayer","sports","tournament","match","marathon","race",
  ]},

  // ── Baby & Kids ──
  { id: "baby", words: [
    "baby","kids","children","toddler","infant","stroller","pram","car seat","baby cot","diaper","nappy",
    "baby food","formula","toy","toys","school","school uniform","school shoes","school bag","stationery",
  ]},

  // ── Beauty / Health ──
  { id: "beauty:products", words: [
    "perfume","cologne","oud","attar","makeup","lipstick","foundation","mascara","eyeliner","skincare",
    "moisturizer","sunscreen","serum","shampoo","conditioner","body lotion","cream","oil","supplement",
  ]},

  // ── Pets ──
  { id: "pets", words: [
    "pet","pets","dog","puppy","cat","kitten","rabbit","bird","fish","aquarium","pet food","dog food",
    "cat food","pet accessories","leash","collar","cage",
  ]},

  // ── Agriculture ──
  { id: "agriculture", words: [
    "farm","farming","tractor","plough","seedling","seeds","fertilizer","pesticide","livestock","cow","goat",
    "sheep","chicken","poultry","dairy","manure","greenhouse","irrigation",
  ]},
];

// ─── Synonym pairs that bridge across clusters ─────────────────────────────
const SYNONYMS: [string, string][] = [
  ["ksh","kes"], ["k sh","kes"], ["shillings","kes"],
  ["near","in"], ["around","in"],
  ["dinning","dining"],
];

// Build reverse index: token → cluster ids it belongs to
const TOKEN_INDEX = new Map<string, Set<string>>();
const CLUSTER_BY_ID = new Map<string, string[]>();
for (const c of CLUSTERS) {
  CLUSTER_BY_ID.set(c.id, c.words);
  for (const w of c.words) {
    const k = w.toLowerCase();
    if (!TOKEN_INDEX.has(k)) TOKEN_INDEX.set(k, new Set());
    TOKEN_INDEX.get(k)!.add(c.id);
  }
}

const KENYAN_TOWNS = [
  "nairobi","mombasa","kisumu","nakuru","eldoret","thika","machakos","naivasha","nyeri","kakamega",
  "kisii","meru","kitale","kilifi","diani","malindi","garissa","kericho","embu","ruiru","kiambu",
  "westlands","karen","kilimani","ngong","rongai","kahawa","cbd","langata","kasarani","nyali","bamburi",
];

const STOPWORDS = new Set([
  "a","an","the","of","for","to","with","and","or","but","please","kindly","me","my","i","you",
  "is","are","do","does","have","has","want","need","get","find","search","look","show","take",
  "any","some","this","that","there","here","what","which","near","in","on","at","near","around",
  "from","by","like","also","just","now","today","please","kindly","kenya","ya",
]);

const PRICE_RE_BETWEEN = /between\s+([\d.,]+\s*[km]?)\s+(?:and|to)\s+([\d.,]+\s*[km]?)/i;
const PRICE_RE_UNDER = /(?:under|below|less than|cheaper than|max(?:imum)?|up to)\s+([\d.,]+\s*[km]?)/i;
const PRICE_RE_OVER  = /(?:over|above|more than|at least|min(?:imum)?|from)\s+([\d.,]+\s*[km]?)/i;

function priceNum(s: string): number | undefined {
  let n = parseFloat(s.replace(/[, ]/g, ""));
  if (/k$/i.test(s)) n *= 1000;
  if (/m$/i.test(s)) n *= 1_000_000;
  return Number.isFinite(n) ? n : undefined;
}

function tokenize(s: string): string[] {
  // normalise synonyms first
  let t = ` ${s.toLowerCase()} `;
  for (const [a, b] of SYNONYMS) t = t.replace(new RegExp(`\\b${a}\\b`, "g"), b);
  return t.split(/[^a-z0-9]+/i).filter((w) => w && !STOPWORDS.has(w));
}

/** Scan tokens & multi-word phrases against cluster index. */
function findHitClusters(text: string): Set<string> {
  const hits = new Set<string>();
  const lower = ` ${text.toLowerCase()} `;
  // multi-word match first (loops cluster words)
  for (const [word, ids] of TOKEN_INDEX) {
    if (word.includes(" ") && lower.includes(` ${word} `)) {
      ids.forEach((id) => hits.add(id));
    }
  }
  // single-token match
  for (const tok of tokenize(text)) {
    const ids = TOKEN_INDEX.get(tok);
    if (ids) ids.forEach((id) => hits.add(id));
  }
  return hits;
}

/** Expand a free-text query into many related terms + filters. */
export function expandQuery(raw: string): ExpandedQuery {
  const original = raw.trim();
  const lower = " " + original.toLowerCase() + " ";

  // price
  let minPrice: number | undefined; let maxPrice: number | undefined;
  const between = lower.match(PRICE_RE_BETWEEN);
  if (between) {
    const a = priceNum(between[1]); const b = priceNum(between[2]);
    if (a && b) { minPrice = Math.min(a, b); maxPrice = Math.max(a, b); }
  } else {
    const u = lower.match(PRICE_RE_UNDER); if (u) maxPrice = priceNum(u[1]);
    const o = lower.match(PRICE_RE_OVER);  if (o) minPrice = priceNum(o[1]);
  }

  // location
  let location: string | undefined;
  for (const town of KENYAN_TOWNS) {
    const re = new RegExp(`\\b${town}\\b`, "i");
    if (re.test(lower)) { location = town; break; }
  }

  // strip filler so the "core" search text is clean
  const cleaned = original
    .replace(/\b(under|below|over|above|less than|more than|cheaper than|between|please|kindly|for me|show me|find|search|look for|i (?:want|need|am looking for)|nipe|tafuta)\b/gi, " ")
    .replace(/\b\d[\d.,]*\s*[km]?\b/gi, " ")
    .replace(new RegExp(`\\b(${KENYAN_TOWNS.join("|")})\\b`, "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();

  // expand via clusters
  const clusters = findHitClusters(cleaned || original);
  const terms = new Map<string, ExpansionHit>();

  // always include original tokens at full weight
  for (const tok of tokenize(cleaned || original)) {
    terms.set(tok, { term: tok, weight: 1, category: undefined });
  }
  // add cluster siblings at lower weight
  let rootCategory: string | undefined;
  let rootSub: string | undefined;
  for (const id of clusters) {
    const [cat, sub] = id.split(":");
    if (!rootCategory) { rootCategory = cat; rootSub = sub; }
    const words = CLUSTER_BY_ID.get(id) || [];
    for (const w of words) {
      const k = w.toLowerCase();
      if (terms.has(k)) continue;
      // longer/multi-word terms get a lower weight
      const weight = w.includes(" ") ? 0.5 : 0.6;
      terms.set(k, { term: w, weight, category: cat });
    }
  }

  return {
    original,
    cleaned: cleaned || original,
    terms: [...terms.values()].sort((a, b) => b.weight - a.weight).slice(0, 60),
    rootCategory,
    rootSubcategory: rootSub,
    location,
    minPrice,
    maxPrice,
  };
}

// ─── Optional augmentation from DB (assistant_brain table) ─────────────────
// The Brain can grow over time via SQL inserts. Pulled once per session.
let augmented = false;
export async function loadBrainFromDb(): Promise<void> {
  if (augmented) return;
  augmented = true;
  try {
    const { data } = await supabase
      .from("assistant_brain")
      .select("cluster_id, words")
      .limit(2000);
    if (!Array.isArray(data)) return;
    for (const row of data as any[]) {
      const id = String(row.cluster_id || "").trim();
      const words: string[] = Array.isArray(row.words) ? row.words : [];
      if (!id || !words.length) continue;
      const existing = CLUSTER_BY_ID.get(id) || [];
      const merged = Array.from(new Set([...existing, ...words.map((w) => String(w).toLowerCase())]));
      CLUSTER_BY_ID.set(id, merged);
      for (const w of merged) {
        const key = w.toLowerCase();
        if (!TOKEN_INDEX.has(key)) TOKEN_INDEX.set(key, new Set());
        TOKEN_INDEX.get(key)!.add(id);
      }
    }
  } catch { /* table may not exist yet — ignore */ }
}
