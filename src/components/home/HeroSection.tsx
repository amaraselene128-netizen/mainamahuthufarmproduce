import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, Smartphone, Cpu, Shirt, Home, Sparkles,
  Monitor, Dumbbell, Car, ShoppingBasket, Baby, Grid3x3,
  Percent, Store, Headphones, ArrowRight,
  ShieldCheck, Truck, RotateCcw, Star, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useListings } from "@/hooks/useListings";
import { useShops } from "@/hooks/useShops";
import { parseImages, cn } from "@/lib/utils";

const sidebarCategories = [
  { icon: Smartphone, label: "Phones & Tablets", href: "/products?category=electronics" },
  { icon: Cpu, label: "Electronics", href: "/products?category=electronics" },
  { icon: Shirt, label: "Fashion", href: "/products?category=fashion" },
  { icon: Home, label: "Home & Living", href: "/products?category=home" },
  { icon: Sparkles, label: "Beauty & Health", href: "/products?category=beauty" },
  { icon: Monitor, label: "Computing", href: "/products?category=computing" },
  { icon: Dumbbell, label: "Sports & Outdoors", href: "/products?category=sports" },
  { icon: Car, label: "Automotive", href: "/products?category=vehicles" },
  { icon: ShoppingBasket, label: "Groceries", href: "/products?category=groceries" },
  { icon: Baby, label: "Baby & Kids", href: "/products?category=baby" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type BannerItem = {
  id: string;
  title: string;
  price?: number | null;
  location?: string;
  listing_type: "product" | "service" | "event";
  image: string;
};

/** Small rotating mini-banner used 3× under the hero. */
function MiniBanner({
  label,
  items,
  accent,
  fallbackHref,
}: {
  label: string;
  items: BannerItem[];
  accent: string; // tailwind gradient classes (e.g., "from-rose-500 to-pink-600")
  fallbackHref: string;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);

  const cur = items[idx];
  const path = cur
    ? cur.listing_type === "product" ? "products"
      : cur.listing_type === "service" ? "services" : "events"
    : "products";

  return (
    <Link
      to={cur ? `/${path}/${cur.id}` : fallbackHref}
      className={cn(
        "group relative h-[110px] sm:h-[120px] rounded-2xl overflow-hidden shadow-sm border border-border/60",
        "bg-gradient-to-br text-white",
        accent
      )}
    >
      {/* Decorative ring */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative z-10 h-full flex items-center justify-between p-3">
        <div className="min-w-0 max-w-[55%]">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {label}
          </span>
          <p className="mt-1.5 text-[12px] sm:text-sm font-semibold leading-tight line-clamp-2">
            {cur?.title ?? "Discover more"}
          </p>
          {cur?.price != null && (
            <p className="mt-0.5 text-[11px] font-bold text-white/95">
              KES {cur.price.toLocaleString()}
            </p>
          )}
        </div>

        {cur && (
          <div className="relative shrink-0 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden bg-white/90 shadow-inner ring-2 ring-white/70">
            <img
              src={cur.image}
              alt={cur.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          {items.slice(0, Math.min(4, items.length)).map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === idx % Math.min(4, items.length) ? "w-4 bg-white" : "w-1 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

/** Mobile-only rotating ad strip that fills the empty space below the hero CTAs. */
function MobileHeroAdStrip({ items }: { items: BannerItem[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const cur = items[idx % items.length];
  const path =
    cur.listing_type === "product" ? "products"
      : cur.listing_type === "service" ? "services" : "events";

  return (
    <Link
      to={`/${path}/${cur.id}`}
      className="sm:hidden mt-3 flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-1.5 pr-3 max-w-[58%] hover:bg-white/20 transition-colors"
      aria-label={cur.title}
    >
      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/90">
        <img
          src={cur.image}
          alt={cur.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-white/80 font-semibold leading-none">
          Trending now
        </p>
        <p className="text-[11px] font-semibold text-white line-clamp-1 leading-tight mt-0.5">
          {cur.title}
        </p>
        {cur.price != null && (
          <p className="text-[10px] font-bold text-white/95 leading-none">
            KES {cur.price.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}
  const navigate = useNavigate();
  // Pull a wide pool of listings for the rotating banner
  const { listings } = useListings({ limit: 60 });
  const { shops } = useShops(20);

  const allBanners = useMemo<BannerItem[]>(() => {
    const items: BannerItem[] = [];
    for (const l of listings as any[]) {
      const image = parseImages(l.images)?.[0];
      if (!image) continue;
      items.push({
        id: l.id,
        title: l.title,
        price: l.price,
        location: l.location,
        listing_type: l.listing_type,
        image,
      });
    }
    return shuffle(items);
  }, [listings]);

  // Main hero rotation (large banner)
  const heroBanners = allBanners;
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroBanners.length), 3500);
    return () => clearInterval(t);
  }, [heroBanners.length]);

  const current = heroBanners[heroIdx];
  const goPrev = () => setHeroIdx((i) => (i - 1 + heroBanners.length) % heroBanners.length);
  const goNext = () => setHeroIdx((i) => (i + 1) % heroBanners.length);

  const categoryPath = current
    ? current.listing_type === "product" ? "products"
      : current.listing_type === "service" ? "services" : "events"
    : "products";

  // Mini-banner pools — newest-first, then shuffled
  const productItems = useMemo(
    () => allBanners.filter((b) => b.listing_type === "product").slice(0, 8),
    [allBanners]
  );
  const serviceEventItems = useMemo(
    () => allBanners.filter((b) => b.listing_type !== "product").slice(0, 8),
    [allBanners]
  );
  const shopItems = useMemo<BannerItem[]>(() => {
    const items: BannerItem[] = [];
    for (const s of shops as any[]) {
      const image = (s.logo_url || s.cover_image_url) as string | undefined;
      if (!image) continue;
      items.push({
        id: s.slug || s.id,
        title: s.name,
        location: s.location,
        listing_type: "product",
        image,
      });
    }
    return shuffle(items).slice(0, 8);
  }, [shops]);

  return (
    <section className="bg-background border-b border-border/60">
      <div className="container py-4 md:py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* SIDEBAR — categories (hidden on mobile) */}
          <aside className="hidden lg:block col-span-3 xl:col-span-3">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold">
                <Grid3x3 className="h-4 w-4" />
                All Categories
              </div>
              <nav className="py-1">
                {sidebarCategories.map((c) => (
                  <Link
                    key={c.label}
                    to={c.href}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <c.icon className="h-4 w-4 text-primary" />
                      {c.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary border-t border-border hover:bg-muted"
                >
                  <Grid3x3 className="h-4 w-4" />
                  View All Categories
                </Link>
              </nav>
            </div>
          </aside>

          {/* CENTER — hero banner */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6 space-y-3">
            <div className="relative h-[300px] sm:h-[380px] md:h-[440px] rounded-2xl overflow-hidden shadow-md
                            bg-[radial-gradient(circle_at_85%_50%,_hsl(var(--primary)/0.55),_transparent_60%),linear-gradient(135deg,_hsl(var(--primary))_0%,_hsl(142_70%_32%)_100%)]">
              {/* Decorative soft swirls */}
              <div className="absolute inset-0 opacity-30 pointer-events-none
                              bg-[radial-gradient(ellipse_at_75%_55%,_rgba(255,255,255,0.25),_transparent_55%)]" />
              <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-1/3 top-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

              {/* TEXT — left side, constrained to avoid collision */}
              <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-7 md:p-8 text-primary-foreground">
                <div className="max-w-[55%] sm:max-w-[50%] md:max-w-[48%]">
                  <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full mb-3 sm:mb-4">
                    <Flame className="h-3 w-3" /> Mega Deals
                  </span>
                  <h1 className="font-display text-xl sm:text-2xl md:text-[34px] font-bold leading-[1.15]">
                    Discover Amazing Deals in Your Community
                  </h1>
                  <p className="hidden sm:block mt-3 text-[13px] md:text-[14px] text-white/90 leading-relaxed">
                    Buy, sell, and connect with trusted sellers — products, services and events, all on SokoniArena.
                  </p>

                  <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-5">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm"
                      onClick={() =>
                        current ? navigate(`/${categoryPath}/${current.id}`) : navigate("/products")
                      }
                    >
                      Shop Now
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent text-white border-white/70 hover:bg-white/10 hover:text-white font-semibold"
                      asChild
                    >
                      <Link to="/shops">Explore Shops</Link>
                    </Button>
                  </div>
                </div>

                {/* Trust row — bottom-left (desktop) */}
                <div className="hidden sm:flex items-center gap-5 text-white/90 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> 100% Secure
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-4 w-4" /> Fast Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4" /> Easy Returns
                  </span>
                </div>

                {/* MOBILE — rotating ad strip filling the empty green area */}
                <MobileHeroAdStrip items={allBanners} />
              </div>

              {/* RIGHT — rotating listing image inside a soft white spotlight (no collision) */}
              {current && (
                <Link
                  to={`/${categoryPath}/${current.id}`}
                  className="absolute right-2 sm:right-5 md:right-7 top-1/2 -translate-y-1/2 z-[5]
                             w-[40%] sm:w-[44%] md:w-[44%] aspect-square
                             flex items-center justify-center group pointer-events-auto"
                  aria-label={current.title}
                >
                  {/* White spotlight card behind image */}
                  <div className="absolute inset-2 sm:inset-3 rounded-3xl bg-white/95 shadow-2xl
                                  ring-1 ring-white/60" />
                  <div className="absolute inset-0 rounded-full
                                  bg-[radial-gradient(circle,_rgba(255,255,255,0.35)_0%,_transparent_65%)]" />

                  <div className="relative w-[88%] h-[88%]">
                    <OptimizedImage
                      src={current.image!}
                      alt={current.title}
                      className="relative w-full h-full object-contain drop-shadow-xl
                                 transition-transform duration-700 group-hover:scale-[1.04]"
                      width={800}
                      priority
                    />
                  </div>

                  {/* Top-right star badge */}
                  <span className="absolute top-1 right-1 sm:top-3 sm:right-3 h-9 w-9 sm:h-11 sm:w-11
                                   rounded-full bg-yellow-400 text-yellow-900 inline-flex items-center justify-center
                                   shadow-lg ring-4 ring-yellow-300/40 z-10">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  </span>

                  {/* Bottom-right percent badge (starburst) */}
                  <span className="absolute -bottom-1 -right-1 sm:bottom-1 sm:right-1
                                   h-12 w-12 sm:h-14 sm:w-14 inline-flex items-center justify-center
                                   text-white font-bold text-xs sm:text-sm
                                   bg-[hsl(142_70%_32%)] shadow-xl z-10
                                   [clip-path:polygon(50%_0%,_61%_12%,_78%_5%,_82%_22%,_98%_28%,_90%_43%,_100%_58%,_85%_67%,_88%_85%,_70%_85%,_61%_100%,_50%_88%,_39%_100%,_30%_85%,_12%_85%,_15%_67%,_0%_58%,_10%_43%,_2%_28%,_18%_22%,_22%_5%,_39%_12%)]">
                    <Percent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                </Link>
              )}

              {/* Carousel arrows — hidden on mobile to prevent overlap with CTAs/image */}
              {heroBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={goPrev}
                    className="hidden sm:inline-flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-primary shadow-md items-center justify-center"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={goNext}
                    className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-primary shadow-md items-center justify-center"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dots — centered bottom */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {heroBanners.slice(0, Math.min(5, heroBanners.length)).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === heroIdx % Math.min(5, heroBanners.length)
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* THREE smaller rotating banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MiniBanner
                label="Featured Shops"
                items={shopItems}
                accent="from-orange-500 to-rose-600"
                fallbackHref="/shops"
              />
              <MiniBanner
                label="New Products"
                items={productItems}
                accent="from-primary to-emerald-700"
                fallbackHref="/products"
              />
              <MiniBanner
                label="Services & Events"
                items={serviceEventItems}
                accent="from-violet-500 to-fuchsia-600"
                fallbackHref="/services"
              />
            </div>
          </div>

          {/* RIGHT — small lively info cards */}
          <aside className="col-span-12 lg:col-span-3 xl:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-3">
            <Link
              to="/products?sort=deals"
              className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-primary/5 p-3 lg:p-4 flex items-center justify-between gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-sm lg:text-base">Daily Deals</h3>
                <p className="hidden lg:block text-xs text-muted-foreground mt-0.5">New deals every day</p>
                <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1 lg:mt-2">
                  View All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="shrink-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-primary/15 text-primary inline-flex items-center justify-center">
                <span className="absolute inline-flex h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-primary/20 opacity-60 animate-ping" />
                <Percent className="h-5 w-5 lg:h-6 lg:w-6 relative" />
              </div>
            </Link>

            <Link
              to="/dashboard"
              className="rounded-2xl border border-border bg-gradient-to-br from-card to-accent/5 p-3 lg:p-4 flex items-center justify-between gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-sm lg:text-base">Become a Seller</h3>
                <p className="hidden lg:block text-xs text-muted-foreground mt-0.5">Grow your business with us</p>
                <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1 lg:mt-2">
                  Start Selling <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="shrink-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-accent/15 text-accent inline-flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Store className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
            </Link>

            <Link
              to="/help"
              className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-3 lg:p-4 flex items-center justify-between gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-sm lg:text-base">Need Help?</h3>
                <p className="hidden lg:block text-xs text-muted-foreground mt-0.5">We're here to help you</p>
                <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1 lg:mt-2">
                  Contact Support <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="shrink-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headphones className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
            </Link>

            {/* Live ticker — desktop only, adds liveliness */}
            <div className="hidden lg:flex items-center gap-2 col-span-1 rounded-2xl border border-border bg-card overflow-hidden p-2">
              <span className="shrink-0 inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
              <div className="overflow-hidden flex-1">
                <div className="whitespace-nowrap text-xs text-muted-foreground featured-shops-marquee">
                  🔥 New listings dropping daily &nbsp; • &nbsp; 🛒 Free shop signup &nbsp; • &nbsp; ⭐ Verified sellers &nbsp; • &nbsp; 💬 24/7 support
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
