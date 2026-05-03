import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/untyped-client";
import { parseImages } from "@/lib/utils";


interface PromotedListing {
  id: string;
  user_id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  images: any;
  location: string;
  listing_type: "product" | "service" | "event";
  is_sponsored: boolean;
  is_featured: boolean;
  is_free: boolean;
  favorites_count: number | null;
  event_date: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const FlashSales = memo(function FlashSales() {
  const [pool, setPool] = useState<PromotedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffleTick, setShuffleTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cols =
        "id, user_id, title, price, original_price, images, location, listing_type, is_sponsored, is_featured, is_free, favorites_count, event_date";

      // 1) Promoted (sponsored or featured) listings first
      const promoted = await supabase
        .from("listings_public")
        .select(cols)
        .eq("status", "available")
        .or("is_sponsored.eq.true,is_featured.eq.true")
        .order("created_at", { ascending: false })
        .limit(60);

      let acc = (promoted.data || []) as PromotedListing[];

      // 2) Fill with discounted
      if (acc.length < 30) {
        const discounted = await supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .not("original_price", "is", null)
          .order("created_at", { ascending: false })
          .limit(60);
        const seen = new Set(acc.map((p) => p.id));
        acc = acc.concat(((discounted.data || []) as PromotedListing[]).filter((l) => !seen.has(l.id)));
      }

      // 3) Final fallback — newest
      if (acc.length < 30) {
        const fresh = await supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(60);
        const seen = new Set(acc.map((p) => p.id));
        acc = acc.concat(((fresh.data || []) as PromotedListing[]).filter((l) => !seen.has(l.id)));
      }

      if (cancelled) return;
      setPool(acc);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reshuffle every 3 minutes to avoid overload
  useEffect(() => {
    const t = setInterval(() => setShuffleTick((n) => n + 1), 3 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => shuffle(pool).slice(0, 30), [pool, shuffleTick]);

  if (!loading && visible.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent fill-accent" />
              <h2 className="font-display text-2xl md:text-3xl font-bold">Flash Deals</h2>
            </div>
            <span className="text-sm text-muted-foreground">Limited time offers — Don't miss out!</span>
          </div>

          {/* Animated Hot Deals Badge - replaces timer */}
          <div className="flex items-center gap-2">
            <div className="relative animate-pulse">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-70 animate-ping"></div>
              <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                <Flame className="h-4 w-4 animate-pulse" />
                <span>HOT DEALS</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">🔥</span>
              </div>
            </div>
            <Button variant="link" size="sm" asChild className="ml-2 hidden sm:inline-flex">
              <Link to="/products">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
            {visible.map((l) => {
              const img =
                parseImages(l.images)?.[0] ||
                "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=70";
              const path =
                l.listing_type === "product" ? "products" : l.listing_type === "service" ? "services" : "events";
              const discount =
                l.original_price && l.price && l.price < l.original_price
                  ? Math.round(((l.original_price - l.price) / l.original_price) * 100)
                  : null;
              return (
                <Link
                  key={l.id}
                  to={`/${path}/${l.id}`}
                  className="group relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={l.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount !== null && (
                      <span className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <p className="text-[11px] font-medium line-clamp-1 text-foreground">{l.title}</p>
                    {l.price != null && (
                      <p className="text-[11px] font-bold text-primary">
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
