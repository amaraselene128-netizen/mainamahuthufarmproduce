import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";

const KEY = "sokoni_view_history";
const MAX = 30;

export interface ViewHistoryItem {
  id: string;
  listing_type: "product" | "service" | "event";
  section?: string | null;
  category?: string | null;
  subcategory?: string | null;
  viewed_at: number;
}

function readLocal(): ViewHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocal(items: ViewHistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

/** Fetch view history — prefers Supabase for signed-in users, falls back to localStorage. */
export async function fetchViewHistory(): Promise<ViewHistoryItem[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user) {
      const { data, error } = await supabase
        .from("view_history")
        .select("listing_id, listing_type, section, category, subcategory, viewed_at")
        .order("viewed_at", { ascending: false })
        .limit(MAX);
      if (!error && data) {
        const remote: ViewHistoryItem[] = (data as any[]).map((r) => ({
          id: r.listing_id,
          listing_type: r.listing_type,
          section: r.section,
          category: r.category,
          subcategory: r.subcategory,
          viewed_at: new Date(r.viewed_at).getTime(),
        }));
        // Merge with local (in case guest viewed items before signing in)
        const local = readLocal();
        const merged = [...remote];
        const seen = new Set(remote.map((r) => r.id));
        for (const l of local) if (!seen.has(l.id)) merged.push(l);
        merged.sort((a, b) => b.viewed_at - a.viewed_at);
        return merged.slice(0, MAX);
      }
    }
  } catch {
    /* fall through to local */
  }
  return readLocal();
}

/** Synchronous local-only read — used for "do we have any history?" checks. */
export function getViewHistory(): ViewHistoryItem[] {
  return readLocal();
}

export async function recordView(item: Omit<ViewHistoryItem, "viewed_at">) {
  if (!item?.id) return;

  // Always update local cache immediately for snappy UX & guest support
  const list = readLocal().filter((v) => v.id !== item.id);
  list.unshift({ ...item, viewed_at: Date.now() });
  writeLocal(list);

  // Best-effort server sync for signed-in users
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    await supabase.rpc("record_view", {
      _listing_id: item.id,
      _listing_type: item.listing_type,
      _section: item.section ?? null,
      _category: item.category ?? null,
      _subcategory: item.subcategory ?? null,
    });
  } catch {
    /* ignore — local cache is the fallback */
  }
}

/** React helper — call inside ListingDetail after fetching listing. */
export function useRecordView(item: Omit<ViewHistoryItem, "viewed_at"> | null) {
  useEffect(() => {
    if (item) recordView(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);
}
