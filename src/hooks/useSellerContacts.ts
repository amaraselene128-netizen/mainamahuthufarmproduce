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
      const next: Record<string, SellerContact> = { ...initial };

      const [{ data: shopRows }, { data: profileRows }, { data: profilesTable }] = await Promise.all([
        supabase
          .from("shops")
          .select("user_id, name, phone, whatsapp, is_active")
          .in("user_id", missing)
          .eq("is_active", true),
        supabase
          .from("seller_contacts_public")
          .select("user_id, username, phone, whatsapp")
          .in("user_id", missing),
        supabase
          .from("profiles")
          .select("user_id, username, full_name, phone")
          .in("user_id", missing),
      ]);

      if (cancelled) return;

      // Fallback layer 1: profiles table (richest source for phone)
      for (const row of (profilesTable as any[]) || []) {
        const phone = row.phone ?? null;
        if (!phone) continue;
        const contact: SellerContact = {
          user_id: row.user_id,
          username: row.username ?? row.full_name ?? null,
          phone,
          whatsapp: phone,
        };
        cache.set(row.user_id, contact);
        next[row.user_id] = contact;
      }

      // Layer 2: seller_contacts_public view (overrides if has explicit whatsapp)
      for (const row of (profileRows as any[]) || []) {
        const phone = row.phone ?? next[row.user_id]?.phone ?? null;
        const whatsapp = row.whatsapp ?? row.phone ?? next[row.user_id]?.whatsapp ?? null;
        if (!phone && !whatsapp) continue;

        const contact: SellerContact = {
          user_id: row.user_id,
          username: row.username ?? next[row.user_id]?.username ?? null,
          phone,
          whatsapp,
        };

        cache.set(row.user_id, contact);
        next[row.user_id] = contact;
      }

      // Layer 3: shop record (highest priority — shop's listed contact wins)
      for (const row of (shopRows as any[]) || []) {
        const phone = row.phone ?? next[row.user_id]?.phone ?? null;
        const whatsapp = row.whatsapp ?? row.phone ?? next[row.user_id]?.whatsapp ?? null;
        if (!phone && !whatsapp) continue;

        const contact: SellerContact = {
          user_id: row.user_id,
          username: row.name ?? next[row.user_id]?.username ?? null,
          phone,
          whatsapp,
        };

        cache.set(row.user_id, contact);
        next[row.user_id] = contact;
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
