import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, Smartphone, Car, Home, Shirt, Dumbbell, Briefcase,
  Music, Utensils, Menu, Search, TrendingUp, MapPin, X, ArrowRight,
  Package, Wrench, CalendarDays, Store,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import "@/styles/featured-shops.css";
import categoryProducts from "@/assets/category-products.png";
import categoryServices from "@/assets/category-services.png";
import categoryEvents from "@/assets/category-events.png";
import categoryShops from "@/assets/category-shops.png";

const mainCategories = [
  { id: "products", title: "Products", logo: categoryProducts, href: "/products", icon: Package, count: "1K+" },
  { id: "services", title: "Services", logo: categoryServices, href: "/services", icon: Wrench, count: "500+" },
  { id: "events",   title: "Events",   logo: categoryEvents,   href: "/events",   icon: CalendarDays, count: "200+" },
  { id: "shops",    title: "Shops",    logo: categoryShops,    href: "/shops",    icon: Store, count: "100+" },
];

const subCategories = [
  { icon: Smartphone, label: "Electronics", href: "/products?section=electronics" },
  { icon: Car, label: "Vehicles", href: "/products?section=vehicles" },
  { icon: Home, label: "Property", href: "/products?section=property" },
  { icon: Shirt, label: "Fashion", href: "/products?section=fashion" },
  { icon: Dumbbell, label: "Sports", href: "/products?section=sports-leisure" },
  { icon: Briefcase, label: "Jobs", href: "/services?section=jobs-cvs" },
  { icon: Music, label: "Entertainment", href: "/events?section=events-tickets" },
  { icon: Utensils, label: "Food & Dining", href: "/services?section=professional-services" },
];

const trendingSearches = [
  "iPhone 15", "Plumbers near me", "Wedding venues", "Toyota Premio",
  "Web designers", "Concerts this weekend", "Salon services", "Apartments to let",
];

const popularLocations = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
];

export function CategorySection() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      mains: mainCategories.filter((c) => c.title.toLowerCase().includes(q)),
      subs: subCategories.filter((s) => s.label.toLowerCase().includes(q)),
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-5">
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-2">
            Explore Our Marketplace
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Whether you're looking to buy, sell, or discover — we've got you covered
          </p>
        </div>

        {/* Marquee ad banner */}
        <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Hot
            </span>
            <div className="overflow-hidden flex-1">
              <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                {"🛒 Browse thousands of Products, Services & Events on SokoniArena! " +
                  "✅ Find electronics, fashion, vehicles & more at unbeatable prices " +
                  "✅ Hire verified professionals for any service you need " +
                  "✅ Discover exciting events & workshops near you " +
                  "✅ Create your FREE shop & start selling today " +
                  "🚀 Join Kenya's fastest-growing marketplace — Sign up now! " +
                  "🛒 Browse thousands of Products, Services & Events on SokoniArena! " +
                  "✅ Find electronics, fashion, vehicles & more at unbeatable prices " +
                  "✅ Hire verified professionals for any service you need "}
              </div>
            </div>
          </div>
        </div>

        {/* Smart compact bar — hamburger + search + trending chips */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Hamburger trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  className="shrink-0 gap-2 h-10 md:h-11 px-3 md:px-4"
                  aria-label="Browse all categories"
                >
                  <Menu className="h-4 w-4" />
                  <span className="hidden sm:inline font-semibold text-sm">Categories</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <Menu className="h-5 w-5 text-primary" />
                    Browse Marketplace
                  </SheetTitle>
                </SheetHeader>

                <div className="px-5 py-4 space-y-6">
                  {/* In-drawer search */}
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Search categories or anything..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 pr-9 h-10"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-muted"
                        aria-label="Clear"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Main 4 */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Marketplace
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(filtered?.mains ?? mainCategories).map((c) => (
                        <Link
                          key={c.id}
                          to={c.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 p-3 transition-all"
                        >
                          <img src={c.logo} alt={c.title} className="h-10 w-10 object-contain" loading="lazy" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-tight truncate">{c.title}</p>
                            <p className="text-[11px] text-muted-foreground">{c.count} items</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Sub categories */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Popular Categories
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(filtered?.subs ?? subCategories).map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <Link
                            key={sub.label}
                            to={sub.href}
                            onClick={() => setOpen(false)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-[11px] font-medium text-center leading-tight">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trending */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-accent" /> Trending Searches
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSearches.map((t) => (
                        <Link
                          key={t}
                          to={`/search?q=${encodeURIComponent(t)}`}
                          onClick={() => setOpen(false)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                        >
                          {t}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Popular Locations
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {popularLocations.map((loc) => (
                        <Link
                          key={loc}
                          to={`/search?location=${encodeURIComponent(loc)}`}
                          onClick={() => setOpen(false)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                        >
                          {loc}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Inline search */}
            <form onSubmit={handleSearch} className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, services, events, shops..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 md:h-11 bg-background"
              />
            </form>

            {/* Quick-jump main 4 — icon-only on mobile, icon+label on desktop */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              {mainCategories.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.id}
                    to={c.href}
                    title={c.title}
                    className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Icon className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                    <span className="text-xs font-medium">{c.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Smart trending strip */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Badge variant="secondary" className="shrink-0 gap-1 bg-accent/15 text-accent border border-accent/30">
              <TrendingUp className="h-3 w-3" /> Trending
            </Badge>
            {trendingSearches.slice(0, 6).map((t) => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all whitespace-nowrap"
              >
                {t}
              </Link>
            ))}
            <Link
              to="/products"
              className="shrink-0 text-xs px-2.5 py-1 rounded-full text-primary font-medium inline-flex items-center gap-1 hover:underline whitespace-nowrap"
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
