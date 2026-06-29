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
    { label: "Appeal a suspension", href: "/appeal" },
    user
      ? { label: "Help center", href: "/dashboard/support" }
      : { label: "FAQ", href: "/#faq" },
  ];

  const legalLinks = [
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Cookies", href: "/legal/privacy#cookies" },
    { label: "Acceptable Use", href: "/legal/terms#use" },
  ];

  return (
    <footer className="border-t hairline bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          {/* Left Side */}
          <div className="space-y-5">
            <Brand />

            <p className="max-w-sm text-sm text-muted-foreground">
              The premium global marketplace for freelancers and micro-task
              workers.
            </p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Nairobi, Kenya — HQ
              </div>

              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                support@egmtasks.com
              </div>
            </div>

            {user && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2 text-xs font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-all"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <FooterCol title="Platform" links={platformLinks} />
            <FooterCol title="Company" links={companyLinks} />
            <FooterCol title="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t hairline pt-8 flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EGMTASKS Headquarters · Nairobi,
            Kenya · All rights reserved.
          </p>

          <p>
            Built for a million+ workers across 100+ countries.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground/80">
        {title}
      </h4>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              to={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
