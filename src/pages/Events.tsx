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
import categoryEvents from "@/assets/category-events.png";
import { CategoryFilter, type CategoryFilterValue } from "@/components/listings/CategoryFilter";
import { findSection } from "@/lib/categories";

export default function Events() {
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
  const [sortBy, setSortBy] = useState("date");

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
    type: "event",
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
      <div className="bg-gradient-accent text-white">
        <div className="container py-12">
          <div className="flex items-center gap-3 mb-2">
            <img src={categoryEvents} alt="SokoniArena Events" className="h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">Events</h1>
          </div>
          <p className="text-white/80 mb-4">
            Discover exciting events, workshops, and gatherings near you
          </p>
          <div className="relative overflow-hidden rounded-xl bg-white/10 border border-white/20 py-2.5 px-4">
            <div className="flex items-center gap-3">
              <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-white text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Live
              </span>
              <div className="overflow-hidden flex-1">
                <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-white/90">
                  {"🎉 Post your events on SokoniArena for FREE! " +
                    "✅ Reach thousands of attendees across Kenya " +
                    "✅ Promote your event for maximum visibility " +
                    "✅ Workshops, concerts, meetups & more — all welcome " +
                    "✅ Create a branded shop to host all your events " +
                    "🚀 Go to Dashboard → Add Listing → Event to get started! " +
                    "🎉 Post your events on SokoniArena for FREE! " +
                    "✅ Reach thousands of attendees across Kenya " +
                    "✅ Promote your event for maximum visibility " +
                    "✅ Workshops, concerts, meetups & more — all welcome " +
                    "✅ Create a branded shop to host all your events " +
                    "🚀 Go to Dashboard → Add Listing → Event to get started! "}
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
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <CategoryFilter scope="event" value={filter} onChange={setFilter} />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date: Upcoming</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{listings.length}</span> events
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
            <p className="text-destructive mb-4">Error loading events: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No events found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setFilter({ section: "", category: "", subcategory: "" });
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <ListingsGridWithContacts
            listings={listings}
            category="event"
            fallbackImage="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80"
          />
        )}

        {!isLoading && listings.length > 0 && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
