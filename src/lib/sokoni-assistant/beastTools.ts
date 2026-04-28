// Sokoni Beast — fangs (client-side tool executors).
// Each function corresponds to a tool the LLM can call.
// They run in the browser so navigation, dialer, WhatsApp, favorites,
// cart and shop actions are instant.

import { supabase } from "@/integrations/supabase/untyped-client";
import { parseQuery } from "./dbSearch";
import { smartSearch, describeResult, bestNavigation } from "./smartSearch";
import type { BeastMemorySnapshot } from "./beastMemory";

export type BeastToolResult = {
  message: string;                 // human-readable summary spoken/shown
  navigate?: string;               // path to navigate to after a brief delay
  external?: string;               // open in new tab (whatsapp/tel)
  data?: any;                      // structured payload for UI cards
  endSession?: boolean;
};

// ---------------- SEARCH (products/services/events/shops) ----------------
// Uses semantic expansion so we never return zero results, and navigates
// straight to the listing detail page when we have a confident match.
export async function execSearch(args: { query: string; type?: "product" | "service" | "event" | "shop" }): Promise<BeastToolResult> {
  const type = args.type === "shop" ? undefined : args.type;
  const result = await smartSearch(args.query, { limit: 8, type });
  return {
    message: describeResult(result),
    navigate: bestNavigation(result),
    data: { listings: result.listings, shops: result.shops, matchKind: result.matchKind },
  };
}

// ---------------- NAVIGATE ----------------
export async function execNavigate(args: { path: string }): Promise<BeastToolResult> {
  const path = args.path.startsWith("/") ? args.path : `/${args.path}`;
  return { message: `Going to ${path}. Fast like a cheetah!`, navigate: path };
}

// ---------------- OPEN A LISTING ----------------
export async function execOpenListing(args: { listing_id?: string; title?: string }): Promise<BeastToolResult> {
  let id = args.listing_id;
  let row: any = null;
  if (!id && args.title) {
    const { data } = await supabase
      .from("listings_public")
      .select("id, title, listing_type")
      .ilike("title", `%${args.title}%`)
      .limit(1);
    row = data?.[0];
    id = row?.id;
  }
  if (!id) return { message: `I couldn't find that listing. Want me to search for it?` };
  const type = row?.listing_type || "products";
  const seg = type === "service" ? "services" : type === "event" ? "events" : "products";
  return {
    message: row ? `Opening ${row.title}.` : `Opening listing.`,
    navigate: `/${seg}/${id}`,
    data: { listing: row },
  };
}

// ---------------- CONTACT SELLER ----------------
export async function execContactSeller(args: {
  listing_id?: string;
  shop_id?: string;
  method: "whatsapp" | "call" | "message";
}): Promise<BeastToolResult> {
  // Resolve seller phone/whatsapp from listing or shop
  let phone: string | null = null;
  let whatsapp: string | null = null;
  let title = "the seller";

  if (args.shop_id) {
    const { data } = await supabase
      .from("shops")
      .select("name, phone, whatsapp")
      .eq("id", args.shop_id)
      .maybeSingle();
    phone = data?.phone ?? null;
    whatsapp = data?.whatsapp ?? null;
    title = data?.name ?? title;
  } else if (args.listing_id) {
    const { data: listing } = await supabase
      .from("listings_public")
      .select("title, user_id, shop_id")
      .eq("id", args.listing_id)
      .maybeSingle();
    title = listing?.title ?? title;
    if (listing?.shop_id) {
      const { data: shop } = await supabase
        .from("shops")
        .select("phone, whatsapp")
        .eq("id", listing.shop_id)
        .maybeSingle();
      phone = shop?.phone ?? null;
      whatsapp = shop?.whatsapp ?? null;
    }
    if ((!phone || !whatsapp) && listing?.user_id) {
      const { data: profile } = await supabase
        .from("profiles_public")
        .select("phone, whatsapp")
        .eq("user_id", listing.user_id)
        .maybeSingle();
      phone = phone || (profile as any)?.phone || null;
      whatsapp = whatsapp || (profile as any)?.whatsapp || null;
    }
  }

  if (args.method === "whatsapp") {
    if (!whatsapp && !phone) return { message: `${title} hasn't shared a WhatsApp number. Try in-app message instead.` };
    const num = (whatsapp || phone)!.replace(/[^\d]/g, "");
    return {
      message: `Opening WhatsApp chat with ${title}.`,
      external: `https://wa.me/${num}?text=${encodeURIComponent(`Hi! I'm interested in your listing on SokoniArena.`)}`,
    };
  }
  if (args.method === "call") {
    if (!phone) return { message: `${title} hasn't shared a phone number.` };
    return {
      message: `Calling ${title} now.`,
      external: `tel:${phone.replace(/\s+/g, "")}`,
    };
  }
  // in-app message
  return {
    message: `Opening your messages with ${title}.`,
    navigate: `/messages${args.shop_id ? `?shop=${args.shop_id}` : args.listing_id ? `?listing=${args.listing_id}` : ""}`,
  };
}

// ---------------- SAVE TO FAVORITES ----------------
export async function execFavorite(args: { listing_id: string }, userId: string | null): Promise<BeastToolResult> {
  if (!userId) return { message: `Sign in first to save favorites.`, navigate: `/login` };
  if (!args.listing_id) return { message: `I need to know which listing to save.` };
  try {
    await supabase.from("favorites").upsert({ user_id: userId, listing_id: args.listing_id });
    return { message: `Saved to your wishlist! View anytime in Favorites.`, navigate: `/favorites` };
  } catch (e: any) {
    return { message: `Couldn't save right now. ${e?.message ?? ""}`.trim() };
  }
}

// ---------------- ANALYZE PRICE / MARKET ----------------
export async function execMarketAnalysis(args: { query: string }): Promise<BeastToolResult> {
  const parsed = parseQuery(args.query);
  let q = supabase.from("listings_public").select("price, title, id, location").eq("status", "available");
  if (parsed.text) q = q.or(`title.ilike.%${parsed.text}%,description.ilike.%${parsed.text}%,category.ilike.%${parsed.text}%`);
  if (parsed.location) q = q.ilike("location", `%${parsed.location}%`);
  const { data } = await q.limit(50);
  const prices = (data || []).map((r: any) => Number(r.price)).filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return { message: `I couldn't find market data for "${args.query}". Try a more common search term.` };
  prices.sort((a, b) => a - b);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  return {
    message: `Market price for "${args.query}" ranges KES ${min.toLocaleString()} – ${max.toLocaleString()}. Median KES ${median.toLocaleString()}, average KES ${avg.toLocaleString()}. Best deals come from verified shops with good ratings.`,
    data: { min, max, median, avg, count: prices.length },
    navigate: `/search?q=${encodeURIComponent(args.query)}`,
  };
}

// ---------------- VISIT / FOLLOW SHOP ----------------
export async function execShopAction(args: { shop_id?: string; shop_name?: string; action: "visit" | "follow" | "promote" }, userId: string | null): Promise<BeastToolResult> {
  let id = args.shop_id;
  let slug: string | null = null;
  let name = args.shop_name;
  if (!id && args.shop_name) {
    const { data } = await supabase
      .from("shops")
      .select("id, slug, name")
      .ilike("name", `%${args.shop_name}%`)
      .limit(1);
    id = data?.[0]?.id;
    slug = data?.[0]?.slug ?? null;
    name = data?.[0]?.name ?? name;
  } else if (id) {
    const { data } = await supabase.from("shops").select("slug, name").eq("id", id).maybeSingle();
    slug = data?.slug ?? null;
    name = data?.name ?? name;
  }
  if (args.action === "visit") {
    if (!slug && !id) return { message: `I couldn't find that shop. Want me to search shops?`, navigate: `/shops` };
    return { message: `Opening ${name || "the shop"}.`, navigate: `/shop/${slug || id}` };
  }
  if (args.action === "follow") {
    if (!userId) return { message: `Sign in first to follow shops.`, navigate: `/login` };
    if (!id) return { message: `I couldn't find that shop to follow.` };
    try {
      await supabase.from("shop_followers").upsert({ user_id: userId, shop_id: id });
      return { message: `You're now following ${name || "this shop"}.`, navigate: slug ? `/shop/${slug}` : undefined };
    } catch (e: any) {
      return { message: `Couldn't follow right now. ${e?.message ?? ""}`.trim() };
    }
  }
  // promote
  return { message: `Opening shop promotion in your dashboard.`, navigate: `/dashboard?tab=shop&action=promote` };
}

// ---------------- START NEW LISTING ----------------
export async function execStartListing(args: { title?: string; price?: number; category?: string; type?: string }, userId: string | null): Promise<BeastToolResult> {
  if (!userId) return { message: `Sign in to post a listing.`, navigate: `/login` };
  try {
    sessionStorage.setItem("beast:draftListing", JSON.stringify(args));
  } catch { /* ignore */ }
  return { message: `Opening the listing form with your draft pre-filled.`, navigate: `/dashboard?action=new-listing` };
}

// ---------------- WALKTHROUGH / GUIDE ----------------
export async function execWalkthrough(): Promise<BeastToolResult> {
  return {
    message: `Karibu! Here's how SokoniArena works: 1) Browse Products, Services, Events or Shops from the home page. 2) Tap any listing for photos, price and contact buttons. 3) Heart it to save, or use Call/WhatsApp/Message to reach the seller. 4) Sign in to post your own listings or open a shop from your Dashboard. 5) Need anything? Just ask me.`,
  };
}

// ---------------- END SESSION ----------------
export async function execEndSession(): Promise<BeastToolResult> {
  return { message: `Kwaheri! I'll be here when you need me.`, endSession: true };
}
