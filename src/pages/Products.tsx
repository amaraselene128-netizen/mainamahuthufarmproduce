import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { parseImages } from "@/lib/utils";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Grid3X3, LayoutGrid, Loader2, Sparkles } from "lucide-react";
import "@/styles/featured-shops.css";
import { useListings } from "@/hooks/useListings";
import categoryProducts from "@/assets/category-products.png";

const categories = [
  "All Categories",
  "Electronics",
  "Vehicles",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Books",
  "Property",
  "Others",
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");

  // Sync category from URL param on mount/change
  useEffect(() => {
    if (categoryFromUrl) {
      const matched = categories.find(
        (c) => c.toLowerCase() === categoryFromUrl.toLowerCase()
      );
      if (matched) setSelectedCategory(matched);
    }
  }, [categoryFromUrl]);

  // Reshuffle each page mount (and every hour) for the default sort
  const [pageSeed] = useState(() => Math.random());
  const { listings, isLoading, error } = useListings({
    type: "product",
    category: selectedCategory,
    searchQuery,
    sortBy,
    shuffleSeed: sortBy === "newest" ? pageSeed : undefined,
  });

  return (
    <Layout>
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <img src={categoryProducts} alt="SokoniArena Products" className="h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Products</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Discover amazing products from trusted sellers across Kenya
          </p>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 py-2.5 px-4">
            <div className="flex items-center gap-3">
              <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              <div className="overflow-hidden flex-1">
                <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                  {"🛍️ List your products for FREE on SokoniArena! " +
                    "✅ Reach thousands of buyers across Kenya instantly " +
                    "✅ Promote your listing for 5× more visibility " +
                    "✅ Create your own branded shop with a unique URL " +
                    "✅ Get verified for extra trust & priority placement " +
                    "🚀 Go to Dashboard → Add Listing to start selling! " +
                    "🛍️ List your products for FREE on SokoniArena! " +
                    "✅ Reach thousands of buyers across Kenya instantly " +
                    "✅ Promote your listing for 5× more visibility " +
                    "✅ Create your own branded shop with a unique URL " +
                    "✅ Get verified for extra trust & priority placement " +
                    "🚀 Go to Dashboard → Add Listing to start selling! "}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* More Filters Button */}
            <Button variant="outline" className="md:w-auto">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{listings.length}</span> products
          </p>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">Error loading products: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Categories");
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price || undefined}
                originalPrice={listing.original_price || undefined}
                image={parseImages(listing.images)?.[0] || "https://images.unsplash.com/photo-1560472355-536de3962603?w=500&q=80"}
                location={listing.location}
                category="product"
                isSponsored={listing.is_sponsored || false}
                isFeatured={listing.is_featured || false}
                isFree={listing.is_free || false}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {!isLoading && listings.length > 0 && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
