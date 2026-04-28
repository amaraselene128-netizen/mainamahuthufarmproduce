// Sokoni Arena — smart search.
// Cascade: exact term → expanded OR query → category bucket → newest fallback.
// Guarantees we ALWAYS return at least a few related listings.

import { supabase } from "@/integrations/supabase/untyped-client";
import { expandQuery, loadBrainFromDb, type ExpandedQuery } from "./semanticNetwork";

export type SmartListing = {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  category: string | null;
  subcategory: string | null;
  section: string | null;
  listing_type: "product" | "service" | "event";
  images?: any;
};

export type SmartShop = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  category: string | null;
  followers_count: number | null;
};

export type SmartSearchResult = {
  expanded: ExpandedQuery;
  listings: SmartListing[];
  shops: SmartShop[];
  /** "exact" — direct hit; "expanded" — semantic; "category" — broad; "trending" — last-resort. */
  matchKind: "exact" | "expanded" | "category" | "trending";
  topListing?: SmartListing;
  /** True when we widened beyond the literal query. */
  broadened: boolean;
};

const PRODUCT_FIELDS = "id, title, price, location, category, subcategory, section, listing_type, images, is_featured, is_sponsored, views_count, created_at";

/** Build an OR-string for ilike against multiple fields & terms. */
function buildOrFilter(terms: string[], fields: string[]): string {
  const safe = terms
    .map((t) => t.replace(/[%,()]/g, " ").trim())
    .filter((t) => t.length >= 2)
    .slice(0, 12);            // PostgREST OR has a length limit
  const parts: string[] = [];
  for (const f of fields) {
    for (const t of safe) parts.push(`${f}.ilike.%${t}%`);
  }
  return parts.join(",");
}

export async function smartSearch(raw: string, opts: { limit?: number; type?: "product" | "service" | "event" } = {}): Promise<SmartSearchResult> {
  await loadBrainFromDb();
  const limit = opts.limit ?? 8;
  const expanded = expandQuery(raw);
  const baseFilters = (q: any) => {
    let qq = q.eq("status", "available");
    if (opts.type) qq = qq.eq("listing_type", opts.type);
    if (expanded.maxPrice !== undefined) qq = qq.lte("price", expanded.maxPrice);
    if (expanded.minPrice !== undefined) qq = qq.gte("price", expanded.minPrice);
    if (expanded.location) qq = qq.ilike("location", `%${expanded.location}%`);
    return qq;
  };
  const order = (q: any) => q
    .order("is_sponsored", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("views_count", { ascending: false })
    .order("created_at", { ascending: false });

  // ── 1. EXACT match on the cleaned core text ──
  const core = expanded.cleaned;
  let listings: SmartListing[] = [];
  let matchKind: SmartSearchResult["matchKind"] = "exact";
  let broadened = false;

  if (core) {
    const orFilter = buildOrFilter([core], ["title", "description", "category", "subcategory"]);
    const { data } = await order(baseFilters(supabase.from("listings_public").select(PRODUCT_FIELDS)).or(orFilter)).limit(limit);
    listings = (data || []) as SmartListing[];
  }

  // ── 2. EXPANDED semantic match (sibling keywords) ──
  if (!listings.length) {
    const terms = expanded.terms.map((t) => t.term).filter(Boolean);
    if (terms.length) {
      const orFilter = buildOrFilter(terms.slice(0, 8), ["title", "description", "category", "subcategory"]);
      const { data } = await order(baseFilters(supabase.from("listings_public").select(PRODUCT_FIELDS)).or(orFilter)).limit(limit);
      listings = (data || []) as SmartListing[];
      if (listings.length) { matchKind = "expanded"; broadened = true; }
    }
  }

  // ── 3. CATEGORY bucket fallback (e.g. "benz" → all cars) ──
  if (!listings.length && expanded.rootCategory) {
    // Map our cluster id → likely category labels in DB.
    const categoryHints = guessCategoryLabels(expanded.rootCategory, expanded.rootSubcategory);
    if (categoryHints.length) {
      const orFilter = categoryHints
        .map((c) => `category.ilike.%${c}%`)
        .concat(categoryHints.map((c) => `section.ilike.%${c}%`))
        .join(",");
      const { data } = await order(baseFilters(supabase.from("listings_public").select(PRODUCT_FIELDS)).or(orFilter)).limit(limit);
      listings = (data || []) as SmartListing[];
      if (listings.length) { matchKind = "category"; broadened = true; }
    }
  }

  // ── 4. Last-resort: trending newest ──
  if (!listings.length) {
    const { data } = await order(baseFilters(supabase.from("listings_public").select(PRODUCT_FIELDS))).limit(limit);
    listings = (data || []) as SmartListing[];
    matchKind = "trending";
    broadened = true;
  }

  // Shops (best-effort, doesn't block)
  let shops: SmartShop[] = [];
  if (core) {
    const { data: shopData } = await supabase
      .from("shops")
      .select("id, name, slug, location, category, followers_count")
      .eq("is_active", true)
      .or(buildOrFilter([core], ["name", "description", "category"]))
      .order("followers_count", { ascending: false })
      .limit(4);
    shops = (shopData || []) as SmartShop[];
  }

  return {
    expanded,
    listings,
    shops,
    matchKind,
    topListing: listings[0],
    broadened,
  };
}

function guessCategoryLabels(root: string, sub?: string): string[] {
  // Map cluster IDs to known taxonomy labels in `categories.ts`.
  const map: Record<string, string[]> = {
    vehicles: ["Cars", "Motorcycles", "Vehicle Parts", "Vehicles"],
    electronics: ["Phones", "Laptops", "Tablets", "TV", "Audio", "Cameras", "Gaming", "Electronics"],
    fashion: ["Men", "Women", "Shoes", "Watches", "Jewelry", "Clothing", "Fashion"],
    home: ["Furniture", "Kitchen", "Appliances", "Decor", "Bedding", "Home"],
    property: ["Houses", "Apartments", "Land", "Plots", "Rentals", "Property"],
    services: ["Services"],
    events: ["Events"],
    baby: ["Baby", "Kids", "Children"],
    beauty: ["Beauty", "Health", "Cosmetics"],
    pets: ["Pets"],
    agriculture: ["Agriculture", "Farming", "Livestock"],
  };
  const out = new Set<string>(map[root] || []);
  if (sub) {
    if (sub === "phones") ["Phones", "Mobile Phones"].forEach((s) => out.add(s));
    if (sub === "laptops") ["Laptops", "Computers"].forEach((s) => out.add(s));
    if (sub === "seating") ["Furniture", "Sofas", "Chairs"].forEach((s) => out.add(s));
    if (sub === "tables") ["Furniture", "Tables"].forEach((s) => out.add(s));
    if (sub === "cars") ["Cars"].forEach((s) => out.add(s));
    if (sub === "motorcycles") ["Motorcycles"].forEach((s) => out.add(s));
  }
  return [...out];
}

/** Build a friendly summary for the assistant to speak. */
export function describeResult(r: SmartSearchResult): string {
  const top = r.topListing;
  const term = r.expanded.original;
  if (!top) return `Pole, sijapata kitu about "${term}". Want me to broaden the search?`;
  const priceTxt = top.price ? ` — KES ${Number(top.price).toLocaleString()}` : "";
  const locTxt = top.location ? `, ${top.location}` : "";
  const more = r.listings.length > 1 ? ` Plus ${r.listings.length - 1} more similar listings.` : "";
  if (r.matchKind === "exact") {
    return `Nimepata "${top.title}"${priceTxt}${locTxt}.${more} Opening it now.`;
  }
  if (r.matchKind === "expanded") {
    return `Sijapata "${term}" exactly, but here's what's close: "${top.title}"${priceTxt}${locTxt}.${more} Opening it now.`;
  }
  if (r.matchKind === "category") {
    return `No exact "${term}" listed yet, but in the same category I found "${top.title}"${priceTxt}${locTxt}.${more} Opening it.`;
  }
  return `Nothing matched "${term}" directly, so here's what's trending: "${top.title}"${priceTxt}${locTxt}.${more}`;
}

/** Pick the best path: detail page if confident, search page otherwise. */
export function bestNavigation(r: SmartSearchResult): string {
  const top = r.topListing;
  if (top && (r.matchKind === "exact" || r.matchKind === "expanded")) {
    const seg = top.listing_type === "service" ? "services" : top.listing_type === "event" ? "events" : "products";
    return `/${seg}/${top.id}`;
  }
  // Otherwise show the search results page filtered by an expanded keyword.
  const q = r.expanded.cleaned || r.expanded.original;
  return `/search?q=${encodeURIComponent(q)}`;
}
