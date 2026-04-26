import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Store } from "lucide-react";
import { useShops } from "@/hooks/useShops";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * "Top Shops" — horizontal row of round shop avatars + name + category.
 * Matches the SokoniArena reference design.
 */
export const TopShops = memo(function TopShops() {
  const { shops, isLoading } = useShops(14);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!isLoading && shops.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl font-bold">Top Shops</h2>
          </div>
          <Link
            to="/shops"
            className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:underline"
          >
            View All Shops <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative">
          {/* Right-edge nav button (matches the reference) */}
          <button
            type="button"
            aria-label="Scroll shops left"
            onClick={() => scroll("left")}
            className="hidden md:inline-flex absolute -left-3 top-[40%] -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-card border border-border shadow-md items-center justify-center hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll shops right"
            onClick={() => scroll("right")}
            className="hidden md:inline-flex absolute -right-3 top-[40%] -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-card border border-border shadow-md items-center justify-center hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-1 snap-x"
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-[120px] sm:w-[140px] flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card"
                  >
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                ))
              : shops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug}`}
                    className="snap-start shrink-0 w-[120px] sm:w-[140px] flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 ring-2 ring-primary/10 flex items-center justify-center">
                      {shop.logo_url ? (
                        <img
                          src={shop.logo_url}
                          alt={shop.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-primary text-lg">
                          {shop.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-center leading-tight line-clamp-2">
                      {shop.name}
                    </p>
                    {shop.category && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground -mt-1 line-clamp-1">
                        {shop.category}
                      </p>
                    )}
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
});
