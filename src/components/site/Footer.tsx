import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";
import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t hairline bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Brand />
            <p className="text-sm text-muted-foreground max-w-xs">
              The premium global marketplace for freelancers and micro-task workers.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Nairobi, Kenya — HQ</div>
              <div className="flex items-center gap-2"><Mail className="size-4 text-primary" /> support@egratasks.com</div>
            </div>
          </div>
          <FooterCol title="Platform" links={[
            { label: "How it works", href: "/#how" },
            { label: "Categories", href: "/#categories" },
            { label: "Market with us", href: "/#market" },
            { label: "Referral program", href: "/#referrals" },
          ]} />
          <FooterCol title="Company" links={[
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Careers", href: "/about#careers" },
            { label: "Help center", href: "/support" },
          ]} />
          <FooterCol title="Legal" links={[
            { label: "Terms & Conditions", href: "/legal/terms" },
            { label: "Privacy Policy", href: "/legal/privacy" },
            { label: "Cookies", href: "/legal/privacy#cookies" },
            { label: "Acceptable use", href: "/legal/terms#use" },
          ]} />
        </div>
        <div className="mt-12 pt-8 border-t hairline flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EGRATASKS Headquarters · Nairobi, Kenya · All rights reserved.</p>
          <p>Built for a million+ workers across 100+ countries.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold tracking-wide uppercase text-foreground/80">{title}</h4>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
