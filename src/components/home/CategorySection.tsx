import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Calendar, ArrowRight, Store, Smartphone, Car, Home, Shirt, Dumbbell, Briefcase, Music, Utensils } from "lucide-react";
import "@/styles/featured-shops.css";
import { cn } from "@/lib/utils";

const mainCategories = [
  {
    id: "products",
    title: "Products",
    description: "Shop electronics, fashion, home goods & more",
    icon: ShoppingBag,
    href: "/products",
    gradient: "from-primary to-green-brand-dark",
    count: "1K+ items",
  },
  {
    id: "services",
    title: "Services",
    description: "Find skilled professionals near you",
    icon: Sparkles,
    href: "/services",
    gradient: "from-lavender to-purple-600",
    count: "500+ services",
  },
  {
    id: "events",
    title: "Events",
    description: "Discover parties, workshops & gatherings",
    icon: Calendar,
    href: "/events",
    gradient: "from-accent to-rose-600",
    count: "200+ events",
  },
  {
    id: "shops",
    title: "Shops",
    description: "Browse trusted sellers & branded stores",
    icon: Store,
    href: "/shops",
    gradient: "from-orange-400 to-orange-600",
    count: "100+ shops",
  },
];

const subCategories = [
  { icon: Smartphone, label: "Electronics", href: "/products?category=electronics" },
  { icon: Car, label: "Vehicles", href: "/products?category=vehicles" },
  { icon: Home, label: "Property", href: "/products?category=property" },
  { icon: Shirt, label: "Fashion", href: "/products?category=fashion" },
  { icon: Dumbbell, label: "Sports", href: "/products?category=sports" },
  { icon: Briefcase, label: "Jobs", href: "/services?category=jobs" },
  { icon: Music, label: "Entertainment", href: "/events?category=entertainment" },
  { icon: Utensils, label: "Food & Dining", href: "/services?category=food" },
];

export function CategorySection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Explore Our Marketplace
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're looking to buy, sell, or discover — we've got you covered
          </p>
        </div>

        {/* Marquee ad banner */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 py-2.5 px-4">
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
                  "✅ Hire verified professionals for any service you need " +
                  "✅ Discover exciting events & workshops near you " +
                  "✅ Create your FREE shop & start selling today " +
                  "🚀 Join Kenya's fastest-growing marketplace — Sign up now! "}
              </div>
            </div>
          </div>
        </div>

        {/* Main Category Cards - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {mainCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.href}
                className="group relative overflow-hidden rounded-2xl p-4 md:p-6 lg:p-8 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background Gradient */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100",
                  category.gradient
                )} />
                
                {/* Decorative Circle */}
                <div className="absolute -right-8 -bottom-8 w-28 md:w-40 h-28 md:h-40 bg-white/10 rounded-full" />
                
                {/* Content */}
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="p-2 md:p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-[10px] md:text-sm font-medium bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                      {category.count}
                    </span>
                  </div>
                  
                  <h3 className="font-display text-lg md:text-2xl font-bold mb-1 md:mb-2">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-xs md:text-base mb-3 md:mb-6 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold group-hover:gap-3 transition-all">
                    Explore Now
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sub Categories */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {subCategories.map((sub) => {
            const Icon = sub.icon;
            return (
              <Link
                key={sub.label}
                to={sub.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="p-3 rounded-xl bg-background shadow-sm group-hover:shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center">{sub.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
