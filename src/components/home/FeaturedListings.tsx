import { Link } from "react-router-dom";
import { parseImages } from "@/lib/utils";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import "@/styles/featured-shops.css";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListings } from "@/hooks/useListings";
import { useHourlySeed } from "@/hooks/useHourlySeed";
import { useSellerContacts } from "@/hooks/useSellerContacts";
import { format } from "date-fns";
import { useMemo, memo } from "react";

// Skeleton grid for loading state
const ListingGridSkeleton = memo(function ListingGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="listing-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
});

function FeaturedGrid({ listings }: { listings: any[] }) {
  const userIds = useMemo(() => listings.map((l) => l.user_id).filter(Boolean), [listings]);
  const contacts = useSellerContacts(userIds);

  return (
    <div className="listing-grid">
      {listings.map((listing) => {
        const seller = contacts[listing.user_id];
        return (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.price ?? undefined}
            originalPrice={listing.original_price ?? undefined}
            image={parseImages(listing.images)?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&q=80"}
            location={listing.location}
            category={listing.listing_type}
            isSponsored={listing.is_sponsored}
            isFeatured={listing.is_featured}
            rating={listing.favorites_count ? Math.min(5, 4 + listing.favorites_count * 0.1) : undefined}
            eventDate={listing.event_date ? format(new Date(listing.event_date), "MMM d") : undefined}
            isFree={listing.is_free}
            sellerPhone={seller?.phone}
            sellerWhatsapp={seller?.whatsapp}
          />
        );
      })}
    </div>
  );
}

export const FeaturedListings = memo(function FeaturedListings() {
  // Hourly reshuffle seed — autofills featured grids every 1 hour
  const hourSeed = useHourlySeed();

  const { listings: products, isLoading: productsLoading } = useListings({
    type: "product", limit: 18, shuffleSeed: hourSeed,
  });
  const { listings: services, isLoading: servicesLoading } = useListings({
    type: "service", limit: 12, shuffleSeed: hourSeed,
  });
  const { listings: events, isLoading: eventsLoading } = useListings({
    type: "event", limit: 12, shuffleSeed: hourSeed,
  });

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Featured Listings
              </h2>
            </div>
            <p className="text-muted-foreground text-sm md:text-lg">
              Fresh picks reshuffled every hour from across SokoniArena
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/search">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Marquee ad banner */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Deals
            </span>
            <div className="overflow-hidden flex-1">
              <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                {"🔥 Hot deals updated daily on SokoniArena! " +
                  "✅ Post your listing for FREE — reach thousands of buyers instantly " +
                  "✅ Promote your ad to get 5× more views & sell faster " +
                  "✅ Verified sellers get priority placement in search results " +
                  "✅ Open your branded shop for a unique storefront experience " +
                  "🚀 Go to Dashboard → Add Listing to start selling now! " +
                  "💰 No hidden fees — list, promote & sell with zero commission! "}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full max-w-md mb-6 bg-background/50 p-1">
            <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-0">
            {productsLoading ? (
              <ListingGridSkeleton />
            ) : products.length > 0 ? (
              <FeaturedGrid listings={products} />
            ) : (
              <p className="text-center text-muted-foreground py-12">No products available</p>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            {servicesLoading ? (
              <ListingGridSkeleton />
            ) : services.length > 0 ? (
              <FeaturedGrid listings={services} />
            ) : (
              <p className="text-center text-muted-foreground py-12">No services available</p>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            {eventsLoading ? (
              <ListingGridSkeleton />
            ) : events.length > 0 ? (
              <FeaturedGrid listings={events} />
            ) : (
              <p className="text-center text-muted-foreground py-12">No events available</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
});
