import { useEffect } from "react";

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

export function getViewHistory(): ViewHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function recordView(item: Omit<ViewHistoryItem, "viewed_at">) {
  if (!item?.id) return;
  try {
    const list = getViewHistory().filter((v) => v.id !== item.id);
    list.unshift({ ...item, viewed_at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

/** React helper — call inside ListingDetail after fetching listing. */
export function useRecordView(item: Omit<ViewHistoryItem, "viewed_at"> | null) {
  useEffect(() => {
    if (item) recordView(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);
}
