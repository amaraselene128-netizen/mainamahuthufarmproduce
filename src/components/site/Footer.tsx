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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand strip */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b hairline">
          <div className="flex items-center gap-4">
            <Brand />
            <p className="text-xs text-muted-foreground hidden md:block max-w-sm">
              The premium global marketplace for freelancers and micro-task workers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" /> Nairobi, Kenya</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5 text-primary" /> support@egmtasks.com</span>
            {user && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-card hover:shadow-glow"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* 3 horizontal columns with titles */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          <FooterCol title="Platform" links={platformLinks} />
          <FooterCol title="Company" links={companyLinks} />
          <FooterCol title="Legal" links={legalLinks} />
        </div>

        <div className="mt-10 pt-6 border-t hairline flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} EGMTASKS Headquarters · Nairobi, Kenya.</p>
          <p>Built for a million+ workers across 100+ countries.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-xs font-semibold tracking-wide uppercase text-foreground/80">{title}</h4>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link to={l.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
