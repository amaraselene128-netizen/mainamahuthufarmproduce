import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, Smartphone, Cpu, Shirt, Home, Sparkles,
  Monitor, Dumbbell, Car, ShoppingBasket, Baby, Grid3x3,
  Percent, Store, Headphones, ArrowRight,
  ShieldCheck, Truck, RotateCcw, Star, Flame,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";
import { useShops } from "@/hooks/useShops";
import { parseImages, cn } from "@/lib/utils";

/* 🔥 LAZY COMPONENTS */
const Button = lazy(() => import("@/components/ui/button").then(m => ({ default: m.Button })));
const OptimizedImage = lazy(() => import("@/components/ui/optimized-image").then(m => ({ default: m.OptimizedImage })));

/* 🔹 SAFE NAVIGATION */
function useSafeNavigate() {
  try {
    const nav = useNavigate();
    return (url: string) => nav(url);
  } catch {
    return (url: string) => (window.location.href = url);
  }
}

/* 🔹 DATA */
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
  return [...arr].sort(() => Math.random() - 0.5);
}

type BannerItem = {
  id: string;
  title: string;
  price?: number | null;
  listing_type: "product" | "service" | "event";
  image: string;
};

/* 🔹 MINI BANNER */
function MiniBanner({ label, items, accent, fallbackHref }: any) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [items.length]);

  const cur = items[i];
  const path = cur?.listing_type === "product" ? "products" : "services";

  return (
    <Link
      to={cur ? `/${path}/${cur.id}` : fallbackHref}
      className={cn("h-[100px] rounded-xl text-white p-2 flex justify-between items-center", accent)}
    >
      <div>
        <p className="text-[10px] font-bold">{label}</p>
        <p className="text-xs line-clamp-2">{cur?.title}</p>
      </div>

      {cur && (
        <img src={cur.image} className="w-14 h-14 rounded-full object-cover" />
      )}
    </Link>
  );
}

/* 🔥 MAIN COMPONENT */
export function HeroSection() {
  const navigate = useSafeNavigate();
  const { listings } = useListings({ limit: 50 });
  const { shops } = useShops(10);

  const banners = useMemo(() => {
    return shuffle(
      listings
        .map((l: any) => {
          const img = parseImages(l.images)?.[0];
          if (!img) return null;
          return {
            id: l.id,
            title: l.title,
            price: l.price,
            listing_type: l.listing_type,
            image: img,
          };
        })
        .filter(Boolean)
    );
  }, [listings]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length]);

  const current = banners[index];

  return (
    <section className="border-b">
      <div className="container py-4">
        <div className="grid grid-cols-12 gap-3">

          {/* 🔹 MOBILE CATEGORY STRIP */}
          <div className="col-span-12 lg:hidden flex gap-2 overflow-x-auto">
            {sidebarCategories.map(c => (
              <Link key={c.label} to={c.href} className="px-3 py-2 bg-card border rounded-lg text-xs flex gap-1">
                <c.icon className="h-4 w-4" />
                {c.label}
              </Link>
            ))}
          </div>

          {/* 🔹 DESKTOP SIDEBAR */}
          <aside className="hidden lg:block col-span-3 border rounded-xl p-2">
            {sidebarCategories.map(c => (
              <Link key={c.label} to={c.href} className="flex justify-between py-2 text-sm">
                <span className="flex gap-2">
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </span>
                <ChevronRight />
              </Link>
            ))}
          </aside>

          {/* 🔥 HERO */}
          <div className="col-span-12 lg:col-span-6">
            <div className="h-[260px] md:h-[420px] bg-green-600 text-white rounded-xl flex justify-between p-4">

              <div className="max-w-[55%]">
                <h1 className="text-lg md:text-3xl font-bold">
                  Discover Deals
                </h1>

                <div className="flex gap-2 mt-3">
                  <Suspense fallback={<div />}>
                    <Button onClick={() => navigate("/products")}>
                      Shop
                    </Button>
                  </Suspense>
                </div>
              </div>

              {current && (
                <Suspense fallback={<div />}>
                  <OptimizedImage
                    src={current.image}
                    className="w-[45%] object-contain"
                  />
                </Suspense>
              )}
            </div>

            {/* MINI */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <MiniBanner label="Shops" items={banners} accent="bg-orange-500" fallbackHref="/shops" />
              <MiniBanner label="Products" items={banners} accent="bg-green-500" fallbackHref="/products" />
              <MiniBanner label="Services" items={banners} accent="bg-purple-500" fallbackHref="/services" />
            </div>
          </div>

          {/* 🔹 RIGHT */}
          <aside className="col-span-12 lg:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-2">
            <Link className="border p-2 rounded-lg text-xs">Deals</Link>
            <Link className="border p-2 rounded-lg text-xs">Sell</Link>
            <Link className="border p-2 rounded-lg text-xs">Help</Link>
          </aside>

        </div>
      </div>
    </section>
  );
}
