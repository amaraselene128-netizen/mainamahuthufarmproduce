import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { ShopCard } from "@/components/shops/ShopCard";
import { useShops } from "@/hooks/useShops";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Store, Sparkles } from "lucide-react";
import "@/styles/featured-shops.css";

export default function Shops() {
  const { shops, isLoading } = useShops();
  const [search, setSearch] = useState("");

  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Helmet>
        <title>Shops | SokoniArena Kenya - Browse Trusted Sellers</title>
        <meta name="description" content="Browse all shops on SokoniArena Kenya. Discover trusted sellers with branded storefronts offering products, services & events." />
        <link rel="canonical" href="https://sokoniarena.co.ke/shops" />
      </Helmet>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">Shops</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Browse unique shops from trusted sellers across the marketplace
            </p>
          </div>
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
                {"🏪 Create your own branded shop on SokoniArena — it's FREE! " +
                  "✅ Get a unique shop URL & custom storefront " +
                  "✅ Showcase all your products, services & events in one place " +
                  "✅ Build followers & grow your customer base " +
                  "✅ Get verified for extra trust & visibility " +
                  "✅ Promote your shop to reach thousands of buyers " +
                  "🚀 Go to Dashboard → My Shop → Create Shop to get started! " +
                  "🏪 Create your own branded shop on SokoniArena — it's FREE! " +
                  "✅ Get a unique shop URL & custom storefront " +
                  "✅ Showcase all your products, services & events in one place " +
                  "✅ Build followers & grow your customer base " +
                  "✅ Get verified for extra trust & visibility " +
                  "✅ Promote your shop to reach thousands of buyers " +
                  "🚀 Go to Dashboard → My Shop → Create Shop to get started! "}
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-80 mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((shop) => (
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
        ) : (
          <div className="text-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-2">No shops found</h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Be the first to create a shop!"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
