import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/untyped-client";
import { parseImages } from "@/lib/utils";
import { getViewHistory } from "@/hooks/useViewHistory";

interface RecListing {
  id: string;
  title: string;
  price: number | null;
  images: any;
  location: string;
  listing_type: "product" | "service" | "event";
  section: string | null;
  category: string | null;
  subcategory: string | null;
}

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ITEMS = 12;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const YouMightAlsoLike = memo(function YouMightAlsoLike() {
  const [items, setItems] = useState<RecListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const history = getViewHistory();
      const cols =
        "id, title, price, images, location, listing_type, section, category, subcategory";

      const excludeIds = history.map((h) => h.id);
      const sections = Array.from(new Set(history.map((h) => h.section).filter(Boolean) as string[]));
      const categories = Array.from(new Set(history.map((h) => h.category).filter(Boolean) as string[]));

      let pool: RecListing[] = [];

      // 1) Try matching by category first
      if (categories.length) {
        let q = supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .in("category", categories)
          .limit(40);
        if (excludeIds.length) q = q.not("id", "in", `(${excludeIds.map((i) => `"${i}"`).join(",")})`);
        const { data } = await q;
        pool = (data || []) as RecListing[];
      }

      // 2) Fall back to section
      if (pool.length < MAX_ITEMS && sections.length) {
        let q = supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .in("section", sections)
          .limit(40);
        if (excludeIds.length) q = q.not("id", "in", `(${excludeIds.map((i) => `"${i}"`).join(",")})`);
        const { data } = await q;
        const seen = new Set(pool.map((p) => p.id));
        pool = pool.concat(((data || []) as RecListing[]).filter((l) => !seen.has(l.id)));
      }

      // 3) Final fallback — popular listings
      if (pool.length < MAX_ITEMS) {
        const { data } = await supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .order("views_count", { ascending: false, nullsFirst: false })
          .limit(40);
        const seen = new Set(pool.map((p) => p.id));
        pool = pool.concat(((data || []) as RecListing[]).filter((l) => !seen.has(l.id)));
      }

      if (cancelled) return;
      setItems(shuffle(pool).slice(0, MAX_ITEMS));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const hasHistory = useMemo(() => getViewHistory().length > 0, [tick]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                {hasHistory ? "You Might Also Like" : "Picked For You"}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {hasHistory
                ? "Inspired by what you've been viewing"
                : "Trending picks across SokoniArena"}
            </span>
          </div>
          <Button variant="link" size="sm" asChild>
            <Link to="/products">
              See more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((l) => {
              const img =
                parseImages(l.images)?.[0] ||
                "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=70";
              const path =
                l.listing_type === "product"
                  ? "products"
                  : l.listing_type === "service"
                  ? "services"
                  : "events";
              return (
                <Link
                  key={l.id}
                  to={`/${path}/${l.id}`}
                  className="group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={l.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs sm:text-sm font-medium line-clamp-2 text-foreground leading-tight">
                      {l.title}
                    </p>
                    {l.price != null && (
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        KES {l.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
