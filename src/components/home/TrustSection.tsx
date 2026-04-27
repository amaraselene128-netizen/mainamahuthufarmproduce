import { Shield, Users, MapPin, BadgeCheck, MessageCircle, Lock, Sparkles } from "lucide-react";
import "@/styles/featured-shops.css";

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    description: "Every seller goes through email verification to ensure authenticity",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Your data is protected with enterprise-grade security measures",
  },
  {
    icon: MapPin,
    title: "Local Community",
    description: "Connect with buyers and sellers in your neighborhood",
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description: "Chat directly with sellers to negotiate and ask questions",
  },
  {
    icon: Users,
    title: "Trusted Community",
    description: "Join thousands of satisfied users across Kenya",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your personal information is never shared without consent",
  },
];

export function TrustSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-brand-light text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Trust & Safety
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            A Marketplace You Can Trust
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We've built Sokoni Arena with safety and trust at its core. 
            Here's how we keep our community secure.
          </p>
        </div>

        {/* Marquee ad banner */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-green-brand-light/30 to-primary/10 border border-primary/20 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <span className="featured-shops-blink shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Safe
            </span>
            <div className="overflow-hidden flex-1">
              <div className="featured-shops-marquee whitespace-nowrap text-sm font-medium text-foreground/80">
                {"🔒 Your safety is our priority on SokoniArena! " +
                  "✅ All sellers are email-verified for authenticity " +
                  "✅ Enterprise-grade security protects your data " +
                  "✅ Chat directly with sellers — no middlemen " +
                  "✅ Report suspicious activity & we act fast " +
                  "✅ Your personal info is never shared without consent " +
                  "🛡️ Shop with confidence — SokoniArena is trusted by thousands across Kenya! " +
                  "🔒 Your safety is our priority on SokoniArena! " +
                  "✅ All sellers are email-verified for authenticity " +
                  "✅ Enterprise-grade security protects your data " +
                  "✅ Chat directly with sellers — no middlemen " +
                  "✅ Report suspicious activity & we act fast " +
                  "✅ Your personal info is never shared without consent " +
                  "🛡️ Shop with confidence — SokoniArena is trusted by thousands across Kenya! "}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid — 3 cols × 2 rows on all screens */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {trustFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-3 md:p-6 rounded-xl md:rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                  <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Icon className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-xs md:text-lg mb-0.5 md:mb-2 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="hidden md:block text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
