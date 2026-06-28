import { Link } from "react-router-dom";
import { Brand } from "./Brand";
import { Mail, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Footer() {
  const { user } = useAuth();

  const platformLinks = [
    { label: "How it works", href: "/#how" },
    { label: "Categories", href: "/categories" },
    { label: "Market with us", href: "/market-with-us" },
    user
      ? { label: "Referral program", href: "/dashboard/referrals" }
      : { label: "Become a referrer", href: "/auth/register" },
  ];

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/about#careers" },
    user
      ? { label: "Help center", href: "/dashboard/support" }
      : { label: "FAQ", href: "/#faq" },
  ];

  const legalLinks = [
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Cookies", href: "/legal/privacy#cookies" },
    { label: "Acceptable use", href: "/legal/terms#use" },
  ];

  return (
    <footer className="border-t hairline bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Brand />
            <p className="text-sm text-muted-foreground max-w-xs">
              The premium global marketplace for freelancers and micro-task workers.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" /> 
                <span>Nairobi, Kenya — HQ</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary shrink-0" /> 
                <span>support@egmtasks.com</span>
              </div>
            </div>
            {user && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2 text-xs font-semibold text-primary-foreground shadow-card hover:shadow-glow"
              >
                Go to dashboard
              </Link>
            )}
          </div>

          {/* Platform Column */}
          <FooterCol title="Platform" links={platformLinks} />

          {/* Company Column */}
          <FooterCol title="Company" links={companyLinks} />

          {/* Legal Column */}
          <FooterCol title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 pt-8 border-t hairline flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EGMTASKS Headquarters · Nairobi, Kenya · All rights reserved.</p>
          <p>Built for a million+ workers across 100+ countries.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-4">
      <h4 className="font-display text-sm font-semibold tracking-wide uppercase text-foreground/80 border-b border-border/50 pb-2">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link 
              to={l.href} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 block"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
