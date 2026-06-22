import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Brand } from "./Brand";

const nav = [
  { label: "How it works", href: "/#how" },
  { label: "Categories", href: "/#categories" },
  { label: "Market with us", href: "/#market" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b hairline shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Brand />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow transition-shadow"
          >
            Get Started
          </Link>
        </div>
        <button
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t hairline bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium"
                >
                  {n.label}
                </a>
              ))}
              <div className="h-px bg-border my-2" />
              <Link
                to="/auth/login"
                className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="px-3 py-2 rounded-lg bg-gradient-gold text-primary-foreground text-sm font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
