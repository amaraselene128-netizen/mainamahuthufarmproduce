import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Layout } from "@/components/layout/Layout";
import { ListingsGridWithContacts } from "@/components/listings/ListingsGridWithContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2, Sparkles } from "lucide-react";
import "@/styles/featured-shops.css";
import { useListings } from "@/hooks/useListings";
import categoryServices from "@/assets/category-services.png";
import { CategoryFilter, type CategoryFilterValue } from "@/components/listings/CategoryFilter";
import { findSection } from "@/lib/categories";

export default function Services() {
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilterValue>(() => {
    const sectionParam = searchParams.get("section") || "";
    const categoryParam = searchParams.get("category") || "";
    const sectionFromCategory = !sectionParam && categoryParam
      ? findSection(categoryParam.toLowerCase())?.slug || ""
      : "";
    return {
      section: sectionParam || sectionFromCategory,
      category: sectionFromCategory ? "" : categoryParam,
      subcategory: searchParams.get("subcategory") || "",
    };
  });
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const sectionParam = searchParams.get("section") || "";
    const categoryParam = searchParams.get("category") || "";
    const sectionFromCategory = !sectionParam && categoryParam
      ? findSection(categoryParam.toLowerCase())?.slug || ""
      : "";
    setFilter({
      section: sectionParam || sectionFromCategory,
      category: sectionFromCategory ? "" : categoryParam,
      subcategory: searchParams.get("subcategory") || "",
    });
  }, [searchParams]);

  const [pageSeed] = useState(() => Math.random());
  const { listings, isLoading, error } = useListings({
    type: "service",
    section: filter.section,
    category: filter.category,
    subcategory: filter.subcategory,
    searchQuery,
    sortBy,
    shuffleSeed: sortBy === "newest" ? pageSeed : undefined,
  });

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-purple text-white">
        <div className="container py-12">
          <div className="flex items-center gap-3 mb-2">
            <img src={categoryServices} alt="SokoniArena Services" className="h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Services</h1>
          </div>
          <p className="text-white/80 mb-4">
            Find skilled professionals and service providers near you
          </p>
          <div className="relative overflow-hidden rounded-xl bg-white/10 border border-white/20 py-2.5 px-4">
            <div className="flex items-center gap-3">
              <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-white text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              <div className="overflow-hidden flex-1">
                <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-white/90">
                  {"🔧 Offer your services on SokoniArena — it's FREE! " +
                    "✅ Get discovered by thousands of clients near you " +
                    "✅ Build your reputation with reviews & verified badges " +
                    "✅ Create a branded shop to showcase all your services " +
                    "✅ Promote your listing for priority placement " +
                    "🚀 Go to Dashboard → Add Listing → Service to get started! " +
                    "🔧 Offer your services on SokoniArena — it's FREE! " +
                    "✅ Get discovered by thousands of clients near you " +
                    "✅ Build your reputation with reviews & verified badges " +
                    "✅ Create a branded shop to showcase all your services " +
                    "✅ Promote your listing for priority placement " +
                    "🚀 Go to Dashboard → Add Listing → Service to get started! "}
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{listings.length}</span> services
          </p>
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
            <p className="text-destructive mb-4">Error loading services: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No services found matching your criteria.</p>
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
          <ListingsGridWithContacts
            listings={listings}
            category="service"
            fallbackImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80"
          />
        )}

        {!isLoading && listings.length > 0 && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">
              Load More Services
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
