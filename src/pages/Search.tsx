import { useState, useEffect, useCallback, useMemo } from "react";
import { parseImages } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ListingsGridWithContacts } from "@/components/listings/ListingsGridWithContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CategoryFilter, type CategoryFilterValue } from "@/components/listings/CategoryFilter";
import { findSection, SECTIONS } from "@/lib/categories";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  images: string[];
  location: string;
  listing_type: "product" | "service" | "event";
  is_sponsored: boolean;
  is_featured: boolean;
  is_free: boolean;
  event_date: string | null;
  created_at: string;
}

interface ShopHit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  followers_count: number | null;
}

/**
 * Try to infer a category/subcategory from a free-text query.
 * Returns the first taxonomy match whose label is contained in the query.
 */
function inferCategoryFromQuery(q: string): { category?: string; section?: string } {
  const term = q.toLowerCase().trim();
  if (!term) return {};
  for (const section of SECTIONS) {
    for (const c of section.categories) {
      if (term.includes(c.label.toLowerCase()) || c.label.toLowerCase().includes(term)) {
        return { category: c.label, section: section.slug };
      }
      for (const s of c.subcategories || []) {
        if (term.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(term)) {
          return { category: c.label, section: section.slug };
        }
      }
    }
    if (term.includes(section.label.toLowerCase().split(" ")[0])) {
      return { section: section.slug };
    }
  }
  return {};
}

const ITEMS_PER_PAGE = 12;

const LOCATIONS = [
  "All Locations",
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Garissa",
  "Nyeri",
];

// Category list now comes from src/lib/categories.ts via the CategoryFilter
// component. Search supports section + category + subcategory cascading.

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [shopHits, setShopHits] = useState<ShopHit[]>([]);
  const [fallbackInfo, setFallbackInfo] = useState<{ category?: string; section?: string } | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState(
    searchParams.get("type") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || "All Locations"
  );
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
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") || "0"),
    parseInt(searchParams.get("maxPrice") || "1000000"),
  ]);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Debounce search query and price range for smooth UX
  const debouncedQuery = useDebounce(query, 300);
  const debouncedPriceRange = useDebounce(priceRange, 400);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);

    let queryBuilder = supabase
      .from("listings_public")
      .select("*", { count: "exact" })
      .eq("status", "available");

    // Deep search query - search across multiple fields with improved matching
    if (debouncedQuery && debouncedQuery.trim()) {
      const searchTerm = debouncedQuery.trim();
      // Search across title, description, location, category, and subcategory
      queryBuilder = queryBuilder.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,subcategory.ilike.%${searchTerm}%`
      );
    }

    // Category filter (listing type)
    if (activeTab !== "all") {
      const listingType = activeTab as "product" | "service" | "event";
      queryBuilder = queryBuilder.eq("listing_type", listingType);
    }

    // Location filter
    if (selectedLocation !== "All Locations") {
      queryBuilder = queryBuilder.ilike("location", `%${selectedLocation}%`);
    }

    // Section / category / subcategory cascade
    if (filter.section) {
      queryBuilder = queryBuilder.eq("section", filter.section);
    }
    if (filter.category) {
      queryBuilder = queryBuilder.eq("category", filter.category);
    }
    if (filter.subcategory) {
      queryBuilder = queryBuilder.eq("subcategory", filter.subcategory);
    }

    // Price filter with debounced values
    if (debouncedPriceRange[0] > 0) {
      queryBuilder = queryBuilder.gte("price", debouncedPriceRange[0]);
    }
    if (debouncedPriceRange[1] < 1000000) {
      queryBuilder = queryBuilder.lte("price", debouncedPriceRange[1]);
    }

    // Sorting - Fixed and comprehensive
    switch (sortBy) {
      case "newest":
        queryBuilder = queryBuilder.order("created_at", { ascending: false });
        break;
      case "oldest":
        queryBuilder = queryBuilder.order("created_at", { ascending: true });
        break;
      case "price-low":
        queryBuilder = queryBuilder
          .order("price", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
        break;
      case "price-high":
        queryBuilder = queryBuilder
          .order("price", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        break;
      case "popular":
        queryBuilder = queryBuilder
          .order("views_count", { ascending: false })
          .order("favorites_count", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      default:
        // Relevance - sponsored first, then featured, then by views and recency
        queryBuilder = queryBuilder
          .order("is_sponsored", { ascending: false })
          .order("is_featured", { ascending: false })
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false });
    }

    // Pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, count, error } = await queryBuilder;

    if (error) {
      console.error("Search error:", error);
      setListings([]);
      setTotalCount(0);
    } else if (data) {
      setListings(data as Listing[]);
      setTotalCount(count || 0);
    }

    // ───── Global enhancements ─────
    // (a) Search shops with the same query so users discover storefronts.
    if (debouncedQuery && debouncedQuery.trim()) {
      const term = debouncedQuery.trim();
      const { data: shopsData } = await supabase
        .from("shops")
        .select("id, name, slug, description, logo_url, location, followers_count")
        .eq("is_active", true)
        .or(
          `name.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%,category.ilike.%${term}%`
        )
        .order("followers_count", { ascending: false })
        .limit(8);
      setShopHits((shopsData as ShopHit[]) || []);
    } else {
      setShopHits([]);
    }

    // (b) Zero-result fallback: try to infer the category from the query and
    // broaden the search so users always see something relevant.
    const noResults = !error && (!data || data.length === 0);
    if (noResults && debouncedQuery && debouncedQuery.trim()) {
      const inferred = inferCategoryFromQuery(debouncedQuery);
      if (inferred.category || inferred.section) {
        let fallback = supabase
          .from("listings_public")
          .select("*", { count: "exact" })
          .eq("status", "available");
        if (activeTab !== "all") fallback = fallback.eq("listing_type", activeTab as any);
        if (inferred.category) fallback = fallback.eq("category", inferred.category);
        else if (inferred.section) fallback = fallback.eq("section", inferred.section);
        fallback = fallback
          .order("is_sponsored", { ascending: false })
          .order("views_count", { ascending: false })
          .order("created_at", { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1);
        const { data: fb, count: fbCount } = await fallback;
        if (fb && fb.length > 0) {
          setListings(fb as Listing[]);
          setTotalCount(fbCount || fb.length);
          setFallbackInfo(inferred);
        } else {
          setFallbackInfo(null);
        }
      } else {
        setFallbackInfo(null);
      }
    } else {
      setFallbackInfo(null);
    }

    setIsLoading(false);
  }, [debouncedQuery, activeTab, sortBy, selectedLocation, filter, debouncedPriceRange, currentPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Update URL params when filters change (debounced values for price)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeTab !== "all") params.set("type", activeTab);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (selectedLocation !== "All Locations")
      params.set("location", selectedLocation);
    if (filter.section) params.set("section", filter.section);
    if (filter.category) params.set("category", filter.category);
    if (filter.subcategory) params.set("subcategory", filter.subcategory);
    if (debouncedPriceRange[0] > 0) params.set("minPrice", debouncedPriceRange[0].toString());
    if (debouncedPriceRange[1] < 1000000)
      params.set("maxPrice", debouncedPriceRange[1].toString());
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params, { replace: true });
  }, [
    debouncedQuery,
    activeTab,
    sortBy,
    selectedLocation,
    filter,
    debouncedPriceRange,
    currentPage,
    setSearchParams,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedLocation("All Locations");
    setFilter({ section: "", category: "", subcategory: "" });
    setPriceRange([0, 1000000]);
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cascading category filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <CategoryFilter scope="all" value={filter} onChange={setFilter} compact={false} />
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Price Range</Label>
          <span className="text-xs text-muted-foreground">
            KES {priceRange[0].toLocaleString()} - KES {priceRange[1].toLocaleString()}
          </span>
        </div>
        <div className="pt-2 pb-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={1000000}
            step={1000}
            minStepsBetweenThumbs={1}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Min Price</Label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setPriceRange([Math.min(val, priceRange[1] - 1000), priceRange[1]]);
              }}
              placeholder="0"
              className="h-9"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Max Price</Label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1000000;
                setPriceRange([priceRange[0], Math.max(val, priceRange[0] + 1000)]);
              }}
              placeholder="1,000,000"
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>
          Clear All
        </Button>
        <Button className="flex-1" onClick={() => setIsFiltersOpen(false)}>
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Search Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-8">
          <h1 className="font-display text-3xl font-bold mb-4">Search</h1>

          <form onSubmit={handleSearch}>
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setCurrentPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="product">Products</TabsTrigger>
              <TabsTrigger value="service">Services</TabsTrigger>
              <TabsTrigger value="event">Events</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* Desktop Filters */}
            <div className="hidden md:block">
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search results
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Mobile Filters */}
            <div className="md:hidden">
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search results
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedLocation !== "All Locations" ||
          filter.section ||
          filter.category ||
          filter.subcategory ||
          priceRange[0] > 0 ||
          priceRange[1] < 1000000) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedLocation !== "All Locations" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLocation("All Locations")}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {selectedLocation}
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
            {filter.section && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilter({ section: "", category: "", subcategory: "" })}
              >
                {findSection(filter.section)?.label || filter.section}
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
            {filter.category && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilter({ ...filter, category: "", subcategory: "" })}
              >
                {filter.category}
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
            {filter.subcategory && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilter({ ...filter, subcategory: "" })}
              >
                {filter.subcategory}
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPriceRange([0, 1000000])}
              >
                KES {priceRange[0].toLocaleString()} -{" "}
                {priceRange[1].toLocaleString()}
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          {debouncedQuery && (
            <>
              Showing results for "
              <span className="font-medium text-foreground">{debouncedQuery}</span>" •{" "}
            </>
          )}
          <span className="font-medium text-foreground">{totalCount}</span>{" "}
          items found
          {sortBy !== "relevance" && (
            <span className="text-xs ml-2">
              (sorted by {sortBy === "newest" ? "newest" : sortBy === "oldest" ? "oldest" : sortBy === "price-low" ? "price ↑" : sortBy === "price-high" ? "price ↓" : "popularity"})
            </span>
          )}
        </p>

        {/* Matching Shops */}
        {shopHits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" /> Shops matching "{debouncedQuery}"
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {shopHits.map((s) => (
                <Link
                  key={s.id}
                  to={`/shop/${s.slug}`}
                  className="shrink-0 w-44 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold shrink-0">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        s.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {s.followers_count || 0} followers
                      </p>
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fallback notice when we broadened the search */}
        {fallbackInfo && (
          <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
            No exact matches for{" "}
            <span className="font-medium">"{debouncedQuery}"</span>. Showing related items
            {fallbackInfo.category ? (
              <> in category <span className="font-medium">{fallbackInfo.category}</span>.</>
            ) : fallbackInfo.section ? (
              <> in section <span className="font-medium">{findSection(fallbackInfo.section)?.label}</span>.</>
            ) : (
              "."
            )}
          </div>
        )}

        {/* Image Gallery Strip - Google-style */}
        {!isLoading && listings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Images</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {listings
                .flatMap((l) => {
                  const imgs = parseImages(l.images);
                  return imgs.length > 0
                    ? [{ id: l.id, title: l.title, src: imgs[0] }]
                    : [];
                })
                .slice(0, 10)
                .map((img, i) => (
                  <a
                    key={`${img.id}-${i}`}
                    href={`/listing/${img.id}`}
                    className="shrink-0 group"
                  >
                    <div className="w-28 h-28 rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={img.src}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate w-28">{img.title}</p>
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="listing-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <ListingsGridWithContacts
              listings={listings}
              category={activeTab === "service" ? "service" : activeTab === "event" ? "event" : "product"}
              fallbackImage="/placeholder.svg"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="icon"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No results found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
