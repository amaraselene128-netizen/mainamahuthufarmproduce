import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopCard } from "@/components/shops/ShopCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useShops } from "@/hooks/useShops";
import "@/styles/featured-shops.css";

const marqueeText =
  "🏪 Create your own branded shop on SokoniArena — it's FREE! " +
  "✅ Get a unique shop URL & custom storefront " +
  "✅ Showcase all your products, services & events in one place " +
  "✅ Build followers & grow your customer base " +
  "✅ Get verified for extra trust & visibility " +
  "✅ Promote your shop to reach thousands of buyers " +
  "🚀 Start selling today — Go to Dashboard → My Shop → Create Shop " +
  "⭐ Join thousands of trusted sellers already thriving on SokoniArena! ";

export const FeaturedShops = memo(function FeaturedShops() {
  const { shops, isLoading } = useShops(8);

  if (!isLoading && shops.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/90 px-2 py-0.5 rounded-full border border-gold/40 bg-gold/5">
                Premium
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Elite Storefronts
              </h2>
            </div>
            <p className="text-muted-foreground text-lg">
              Hand-picked premium shops trusted by thousands of buyers
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/shops">
              View All Shops
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Marquee ad banner */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              New
            </span>
            <div className="overflow-hidden flex-1">
              <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                {marqueeText}
                {marqueeText}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {shops.map((shop) => (
              <div key={shop.id} className="featured-shop-card">
                {/* Scrolling welcome banner at top of each card */}
                <div className="overflow-hidden bg-foreground/5 rounded-t-xl">
                  <div className="featured-shops-welcome whitespace-nowrap text-[10px] sm:text-xs font-medium text-primary py-1 px-2">
                    <span>
                      ✨ Welcome to {shop.name}! {shop.description ? `— ${shop.description}` : "Explore amazing products & services"} ✨
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      ✨ Welcome to {shop.name}! {shop.description ? `— ${shop.description}` : "Explore amazing products & services"} ✨
                    </span>
                  </div>
                </div>
                <ShopCard shop={shop} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
