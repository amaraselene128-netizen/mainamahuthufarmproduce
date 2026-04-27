// Sokoni Beast — predator memory.
// Tracks per-user behavior across sessions: viewed listings, last search,
// cart intent, preferred categories/locations, and last action.
// Local-first (instant) with optional cloud sync via `beast_memory` table.

import { supabase } from "@/integrations/supabase/untyped-client";

export type BeastMemorySnapshot = {
  viewedListings: string[];          // most-recent first, capped 30
  cartIntent: string[];              // listings user said they want to buy
  favoritedListings: string[];       // saved via beast
  preferredCategories: Record<string, number>; // category -> count
  preferredLocations: Record<string, number>;  // location -> count
  lastSearchQuery?: string;
  lastIntent?: { type: string; payload: any; at: number };
  lastShopId?: string;
  totalInteractions: number;
};

const KEY = (uid: string) => `sokoni-beast:memory:${uid || "anon"}`;

const empty = (): BeastMemorySnapshot => ({
  viewedListings: [],
  cartIntent: [],
  favoritedListings: [],
  preferredCategories: {},
  preferredLocations: {},
  totalInteractions: 0,
});

export function loadMemory(userId: string | null): BeastMemorySnapshot {
  try {
    const raw = localStorage.getItem(KEY(userId || "anon"));
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveMemory(userId: string | null, mem: BeastMemorySnapshot) {
  try {
    localStorage.setItem(KEY(userId || "anon"), JSON.stringify(mem));
  } catch { /* ignore quota */ }

  // Best-effort cloud sync every 5 interactions for logged-in users
  if (userId && mem.totalInteractions % 5 === 0) {
    supabase
      .from("beast_memory")
      .upsert({
        user_id: userId,
        viewed_listings: mem.viewedListings,
        cart_intent: mem.cartIntent,
        favorited_listings: mem.favoritedListings,
        preferred_categories: mem.preferredCategories,
        preferred_locations: mem.preferredLocations,
        last_search: mem.lastSearchQuery ?? null,
        last_intent: mem.lastIntent ?? null,
        last_shop_id: mem.lastShopId ?? null,
        total_interactions: mem.totalInteractions,
        updated_at: new Date().toISOString(),
      })
      .then(() => { /* ignore */ }, () => { /* ignore */ });
  }
}

export async function hydrateFromCloud(userId: string): Promise<BeastMemorySnapshot> {
  const local = loadMemory(userId);
  try {
    const { data } = await supabase
      .from("beast_memory")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return local;
    return {
      viewedListings: data.viewed_listings ?? local.viewedListings,
      cartIntent: data.cart_intent ?? local.cartIntent,
      favoritedListings: data.favorited_listings ?? local.favoritedListings,
      preferredCategories: data.preferred_categories ?? local.preferredCategories,
      preferredLocations: data.preferred_locations ?? local.preferredLocations,
      lastSearchQuery: data.last_search ?? local.lastSearchQuery,
      lastIntent: data.last_intent ?? local.lastIntent,
      lastShopId: data.last_shop_id ?? local.lastShopId,
      totalInteractions: Math.max(data.total_interactions ?? 0, local.totalInteractions),
    };
  } catch {
    return local;
  }
}

export function recordView(mem: BeastMemorySnapshot, listingId: string, category?: string, location?: string) {
  if (!listingId) return;
  mem.viewedListings = [listingId, ...mem.viewedListings.filter((i) => i !== listingId)].slice(0, 30);
  if (category) mem.preferredCategories[category] = (mem.preferredCategories[category] || 0) + 1;
  if (location) mem.preferredLocations[location] = (mem.preferredLocations[location] || 0) + 1;
  mem.totalInteractions++;
}

export function recordIntent(mem: BeastMemorySnapshot, type: string, payload: any) {
  mem.lastIntent = { type, payload, at: Date.now() };
  mem.totalInteractions++;
}

export function topPreferences(mem: BeastMemorySnapshot): { category?: string; location?: string } {
  const top = (m: Record<string, number>) =>
    Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
  return { category: top(mem.preferredCategories), location: top(mem.preferredLocations) };
}
