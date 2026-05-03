export function HeroSection() {
  const navigate = useNavigate();
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

  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (allBanners.length <= 1) return;
    const t = setInterval(() => {
      setHeroIdx((i) => (i + 1) % allBanners.length);
    }, 3500);
    return () => clearInterval(t);
  }, [allBanners.length]);

  const current = allBanners[heroIdx];

  const categoryPath = current
    ? current.listing_type === "product"
      ? "products"
      : current.listing_type === "service"
      ? "services"
      : "events"
    : "products";

  return (
    <section className="bg-background border-b border-border/60">
      <div className="container py-3 md:py-6">
        <div className="grid grid-cols-12 gap-3 md:gap-4">

          {/* 🔹 MOBILE CATEGORY STRIP (same sidebar but horizontal) */}
          <div className="col-span-12 lg:hidden overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {sidebarCategories.map((c) => (
                <Link
                  key={c.label}
                  to={c.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border text-xs whitespace-nowrap"
                >
                  <c.icon className="h-4 w-4 text-primary" />
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 🔹 DESKTOP SIDEBAR */}
          <aside className="hidden lg:block col-span-3">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-4 py-3 font-semibold bg-primary text-white">
                All Categories
              </div>
              {sidebarCategories.map((c) => (
                <Link
                  key={c.label}
                  to={c.href}
                  className="flex justify-between px-4 py-2 text-sm hover:bg-muted"
                >
                  <span className="flex gap-2 items-center">
                    <c.icon className="h-4 w-4 text-primary" />
                    {c.label}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </aside>

          {/* 🔥 HERO (SAME LOOK, JUST SCALED) */}
          <div className="col-span-12 lg:col-span-6">
            <div className="relative h-[260px] sm:h-[340px] md:h-[420px] rounded-2xl overflow-hidden shadow-md bg-primary text-white">

              <div className="flex h-full items-center justify-between p-4 sm:p-6">

                {/* TEXT */}
                <div className="max-w-[55%]">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">
                    Discover Amazing Deals
                  </h1>
                  <p className="text-xs sm:text-sm mt-2 text-white/90">
                    Buy, sell & connect locally
                  </p>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-white text-primary"
                      onClick={() =>
                        navigate(
                          current
                            ? `/${categoryPath}/${current.id}`
                            : "/products"
                        )
                      }
                    >
                      Shop
                    </Button>
                    <Button size="sm" variant="outline">
                      Shops
                    </Button>
                  </div>
                </div>

                {/* IMAGE */}
                {current && (
                  <div className="w-[45%] aspect-square relative">
                    <img
                      src={current.image}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 🔹 MINI BANNERS */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <MiniBanner
                label="Shops"
                items={allBanners}
                accent="from-orange-500 to-rose-600"
                fallbackHref="/shops"
              />
              <MiniBanner
                label="Products"
                items={allBanners}
                accent="from-green-500 to-emerald-700"
                fallbackHref="/products"
              />
              <MiniBanner
                label="Services"
                items={allBanners}
                accent="from-purple-500 to-pink-600"
                fallbackHref="/services"
              />
            </div>
          </div>

          {/* 🔹 RIGHT CARDS (NOW INLINE ON MOBILE) */}
          <aside className="col-span-12 lg:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-2">

            <Link className="p-2 rounded-xl border bg-card text-xs">
              <p className="font-semibold">Deals</p>
              <span className="text-primary text-[11px]">View</span>
            </Link>

            <Link className="p-2 rounded-xl border bg-card text-xs">
              <p className="font-semibold">Sell</p>
              <span className="text-primary text-[11px]">Start</span>
            </Link>

            <Link className="p-2 rounded-xl border bg-card text-xs">
              <p className="font-semibold">Help</p>
              <span className="text-primary text-[11px]">Support</span>
            </Link>

          </aside>

        </div>
      </div>
    </section>
  );
}
