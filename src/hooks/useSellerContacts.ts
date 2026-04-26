import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";

export type SellerContact = {
  user_id: string;
  username: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const cache = new Map<string, SellerContact>();

/**
 * Fetch seller phone/whatsapp for a list of user_ids in a single query.
 * Results are memoized in-process to avoid duplicate fetches across pages.
 */
export function useSellerContacts(userIds: string[]) {
  const [contacts, setContacts] = useState<Record<string, SellerContact>>({});

  useEffect(() => {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (unique.length === 0) {
      setContacts({});
      return;
    }

    // Seed from cache
    const initial: Record<string, SellerContact> = {};
    const missing: string[] = [];
    for (const id of unique) {
      const c = cache.get(id);
      if (c) initial[id] = c;
      else missing.push(id);
    }
    setContacts(initial);

    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, phone, whatsapp")
        .in("user_id", missing);

      if (cancelled || error || !data) return;
      const next: Record<string, SellerContact> = { ...initial };
      for (const row of data as SellerContact[]) {
        cache.set(row.user_id, row);
        next[row.user_id] = row;
      }
      setContacts(next);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(",")]);

  return contacts;
}
