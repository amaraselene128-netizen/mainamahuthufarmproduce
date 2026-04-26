import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
// Public listing type
type Listing = any;
type ListingType = "product" | "service" | "event";

interface UseListingsOptions {
  type?: ListingType;
  category?: string;
  searchQuery?: string;
  sortBy?: string;
  limit?: number;
  /** When set, results are shuffled client-side; changing the value triggers reshuffle. */
  shuffleSeed?: number | string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useListings(options: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(options.searchQuery || "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query inline to avoid hook ordering issues
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(options.searchQuery || "");
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [options.searchQuery]);

  // Memoize query params to prevent unnecessary refetches
  const queryKey = useMemo(() =>
    JSON.stringify({
      type: options.type,
      category: options.category,
      search: debouncedSearch,
      sortBy: options.sortBy,
      limit: options.limit,
      shuffleSeed: options.shuffleSeed,
    }),
    [options.type, options.category, debouncedSearch, options.sortBy, options.limit, options.shuffleSeed]
  );

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const shouldShuffle = options.shuffleSeed !== undefined;

    let query = supabase
      .from("listings_public")
      .select("*")
      .eq("status", "available")
      .eq("is_sponsored", false);

    if (options.type) {
      query = query.eq("listing_type", options.type);
    }

    if (options.category && options.category !== "All Categories" && options.category !== "All Events") {
      query = query.ilike("category", options.category);
    }

    if (debouncedSearch) {
      query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
    }

    switch (options.sortBy) {
      case "price-low":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "price-high":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "popular":
        query = query.order("views_count", { ascending: false });
        break;
      case "date":
        query = query.order("event_date", { ascending: true, nullsFirst: false });
        break;
      case "rating":
        query = query.order("favorites_count", { ascending: false });
        break;
      default:
        if (!shouldShuffle) {
          query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        }
    }

    // When shuffling, fetch a wider pool then trim after shuffle so results
    // genuinely vary instead of just reordering the same N rows each cycle.
    const pool = shouldShuffle && options.limit ? Math.max(options.limit * 4, 60) : options.limit;
    if (pool) {
      query = query.limit(pool);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setListings([]);
    } else {
      let result = data || [];
      if (shouldShuffle) {
        result = shuffleArray(result);
        if (options.limit) result = result.slice(0, options.limit);
      }
      setListings(result);
    }

    setIsLoading(false);
  }, [queryKey]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, isLoading, error, refetch: fetchListings };
}
