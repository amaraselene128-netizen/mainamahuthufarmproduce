import { Link } from "react-router-dom";
import {
  Smartphone, Cpu, Shirt, Home, Sparkles,
  Monitor, Dumbbell, Car, ShoppingBasket, Baby,
  ChevronRight, Instagram, Facebook, Twitter, Youtube, 
  Linkedin, Tag, Store, HelpCircle, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarCategories = [
  { icon: Smartphone, label: "Phones & Tablets" },
  { icon: Cpu, label: "Electronics" },
  { icon: Shirt, label: "Fashion" },
  { icon: Home, label: "Home & Living" },
  { icon: Sparkles, label: "Beauty & Health" },
  { icon: Monitor, label: "Computing" },
  { icon: Dumbbell, label: "Sports & Outdoors" },
  { icon: Car, label: "Automotive" },
  { icon: ShoppingBasket, label: "Groceries" },
  { icon: Baby, label: "Baby & Kids" },
];

const socialIcons = [
  { icon: Instagram, label: "Instagram", color: "hover:text-pink-600" },
  { icon: Facebook, label: "Facebook", color: "hover:text-blue-600" },
  { icon: Twitter, label: "Twitter", color: "hover:text-sky-500" },
  { icon: Youtube, label: "YouTube", color: "hover:text-red-600" },
  { icon: MapPin, label: "Pinterest", color: "hover:text-red-500" }, // Using MapPin as fallback for Pinterest
  { icon: Linkedin, label: "LinkedIn", color: "hover:text-blue-700" },
];

export function HeroSection() {
  return (
    <section className="bg-background min-h-screen">
      <div className="container px-4 py-4">
        
        {/* Header / Logo Area */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">SOKONIARENA</h1>
        </div>

        {/* All Categories Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">All Categories</h2>
            <Link to="/products" className="text-sm text-primary flex items-center gap-1">
              View All Categories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {sidebarCategories.map((category) => (
              <Link
                key={category.label}
                to={`/products?category=${category.label.toLowerCase()}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              >
                <category.icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{category.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mega Deals Hero Section */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 mb-6 text-white">
          <div className="mb-2">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full">
              Mega Deals
            </span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            Discover Amazing Deals in Your Community
          </h2>
          
          <p className="text-sm text-white/90 mb-4 leading-relaxed">
            Buy, sell, and connect with trusted sellers — quick, services and events, all on SOKONIARENA.
          </p>
          
          <div className="flex gap-3">
            <Button className="bg-white text-primary hover:bg-white/90 font-semibold">
              Shop Now
            </Button>
            <Button 
              variant="outline" 
              className="bg-transparent text-white border-white hover:bg-white/10"
              asChild
            >
              <Link to="/shops">Explore Shops</Link>
            </Button>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {/* Daily Deals */}
          <Link 
            to="/products?sort=deals"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-semibold text-base">Daily Deals</h3>
              <p className="text-xs text-muted-foreground mt-0.5">New deals every day</p>
              <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1">
                View All <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
              <Tag className="h-6 w-6" />
            </div>
          </Link>

          {/* Become a Seller */}
          <Link 
            to="/dashboard"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-semibold text-base">Become a Seller</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Grow your business with us</p>
              <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1">
                Start Selling <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 text-accent inline-flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
          </Link>

          {/* Need Help */}
          <Link 
            to="/help"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-semibold text-base">Need Help?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">We're here to help you</p>
              <span className="text-primary text-xs font-medium inline-flex items-center gap-1 mt-1">
                Contact Support <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
              <HelpCircle className="h-6 w-6" />
            </div>
          </Link>
        </div>

        {/* Featured Products Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Featured Products</h2>
          
          <div className="space-y-3">
            {/* NEW PRODUCTS */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <h3 className="font-semibold text-sm">NEW PRODUCTS</h3>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Small East African goat...</p>
                  <p className="text-primary font-bold mt-1">KES 4,000</p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
            </div>

            {/* SERVICES & EVENTS */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <h3 className="font-semibold text-sm">SERVICES & EVENTS</h3>
              </div>
              <div className="p-4">
                <p className="font-medium">Stuck in sales and marketing...</p>
                <Button size="sm" variant="outline" className="mt-3">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-center mb-3 text-muted-foreground">
            Follow Us
          </h3>
          <div className="flex justify-center gap-4">
            {socialIcons.map((social) => (
              <Link
                key={social.label}
                to="#"
                className={`p-2 rounded-full bg-muted text-muted-foreground transition-colors ${social.color}`}
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
