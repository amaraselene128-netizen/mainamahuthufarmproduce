import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Store, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePromotedShops } from "@/hooks/useShops";
import "@/styles/featured-shops.css";

export const PremiumShops = memo(function PremiumShops() {
  const { shops, isLoading } = usePromotedShops(10);

  if (!isLoading && shops.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-gold" />
              <Badge variant="outline" className="border-gold text-gold font-semibold">Premium</Badge>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                Featured Shops
              </h2>
            </div>
            <p className="text-muted-foreground">
              Premium shops trusted by thousands of buyers
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/shops">
              View All Shops
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shops.map((shop) => (
              <div key={shop.id} className="featured-shop-card">
                {/* Scrolling welcome banner */}
                <div className="overflow-hidden bg-foreground/5 rounded-t-xl relative z-10">
                  <div className="featured-shops-welcome whitespace-nowrap text-[10px] sm:text-xs font-medium text-primary py-1 px-2">
                    <span>
                      ✨ Welcome to {shop.name}! {shop.description ? `— ${shop.description}` : "Explore amazing products & services"} ✨
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      ✨ Welcome to {shop.name}! {shop.description ? `— ${shop.description}` : "Explore amazing products & services"} ✨
                    </span>
                  </div>
                </div>
                <Link
                  to={`/shop/${shop.slug}`}
                  className="group relative flex flex-col items-center p-4 bg-card hover:shadow-lg transition-all duration-300"
                >
                  {shop.is_promoted && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Crown className="h-5 w-5 text-gold fill-gold/20" />
                    </div>
                  )}
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 bg-card overflow-hidden shadow-sm mb-2 group-hover:border-primary transition-colors">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                        {shop.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-center line-clamp-1 group-hover:text-primary transition-colors">
                    {shop.name}
                  </h3>
                  {shop.category && (
                    <span className="text-xs text-muted-foreground mt-0.5">{shop.category}</span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
