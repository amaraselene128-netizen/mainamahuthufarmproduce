import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listings/ListingCard";
import { supabase } from "@/integrations/supabase/untyped-client";
import { parseImages } from "@/lib/utils";
import { useSellerContacts } from "@/hooks/useSellerContacts";

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

function useCountdown(hours = 8) {
  const endRef = useRef(Date.now() + hours * 3600_000);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let diff = Math.max(0, endRef.current - now);
  if (diff === 0) {
    endRef.current = Date.now() + hours * 3600_000;
    diff = endRef.current - Date.now();
  }
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export const FlashSales = memo(function FlashSales() {
  const [listings, setListings] = useState<PromotedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { h, m, s } = useCountdown(8);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cols =
        "id, user_id, title, price, original_price, images, location, listing_type, is_sponsored, is_featured, is_free, favorites_count, event_date";

      // 1) Try sponsored listings (true "Flash" promotions)
      const sponsored = await supabase
        .from("listings_public")
        .select(cols)
        .eq("status", "available")
        .eq("is_sponsored", true)
        .order("created_at", { ascending: false })
        .limit(24);

      let pool = (sponsored.data || []) as PromotedListing[];

      // 2) Fall back to listings with a real discount (original_price > price)
      if (pool.length < 8) {
        const discounted = await supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .not("original_price", "is", null)
          .order("created_at", { ascending: false })
          .limit(40);
        const extra = ((discounted.data || []) as PromotedListing[]).filter(
          (l) => l.price && l.original_price && l.price < l.original_price
        );
        const seen = new Set(pool.map((p) => p.id));
        pool = pool.concat(extra.filter((l) => !seen.has(l.id)));
      }

      // 3) Final fallback — newest listings, so the section is never empty
      if (pool.length < 8) {
        const fresh = await supabase
          .from("listings_public")
          .select(cols)
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(24);
        const seen = new Set(pool.map((p) => p.id));
        pool = pool.concat(((fresh.data || []) as PromotedListing[]).filter((l) => !seen.has(l.id)));
      }

      if (cancelled) return;
      setListings(shuffle(pool).slice(0, 16));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userIds = useMemo(() => listings.map((l) => l.user_id).filter(Boolean), [listings]);
  const contacts = useSellerContacts(userIds);

  if (!loading && listings.length === 0) return null;

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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ends in:</span>
            <div className="flex items-center gap-1 font-mono">
              {[h, m, s].map((v, i) => (
                <span
                  key={i}
                  className="bg-foreground text-background text-sm font-bold px-2 py-1 rounded-md min-w-[34px] text-center"
                >
                  {v}
                </span>
              ))}
            </div>
            <Button variant="link" size="sm" asChild className="ml-2 hidden sm:inline-flex">
              <Link to="/products">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="listing-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map((l) => {
              const seller = contacts[l.user_id];
              return (
                <ListingCard
                  key={l.id}
                  id={l.id}
                  title={l.title}
                  price={l.price ?? undefined}
                  originalPrice={l.original_price ?? undefined}
                  image={parseImages(l.images)?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&q=80"}
                  location={l.location}
                  category={l.listing_type}
                  isSponsored={l.is_sponsored}
                  isFeatured={l.is_featured}
                  isFree={l.is_free}
                  rating={l.favorites_count ? Math.min(5, 4 + l.favorites_count * 0.1) : undefined}
                  eventDate={l.event_date ? format(new Date(l.event_date), "MMM d") : undefined}
                  sellerPhone={seller?.phone}
                  sellerWhatsapp={seller?.whatsapp}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
