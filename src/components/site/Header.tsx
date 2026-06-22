import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Brand } from "./Brand";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { label: "How it works", href: "/#how" },
  { label: "Categories", href: "/categories" },
  { label: "Market with us", href: "/market-with-us" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initial = (profile?.username ?? user?.email ?? "?").charAt(0).toUpperCase();

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
            <Link
              key={n.href}
              to={n.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium px-3 py-2 rounded-lg bg-secondary/15 text-secondary border border-secondary/20 hover:bg-secondary/25 inline-flex items-center gap-1"
                >
                  <ShieldCheck className="size-4" /> Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow transition-shadow inline-flex items-center gap-1.5"
              >
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2">
                <div className="size-9 rounded-full bg-gradient-gold grid place-items-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="size-9 object-cover" />
                  ) : (
                    <span className="font-semibold text-primary-foreground text-sm">{initial}</span>
                  )}
                </div>
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  className="p-2 rounded-lg hover:bg-accent"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
                  <div className="size-9 rounded-full bg-gradient-gold grid place-items-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="size-9 object-cover" />
                    ) : (
                      <span className="font-semibold text-primary-foreground text-sm">{initial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{profile?.username ?? user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">{profile?.account_mode ?? "user"}</div>
                  </div>
                </div>
              )}
              {nav.map((n) => (
                <Link
                  key={n.href}
                  to={n.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium"
                >
                  {n.label}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg bg-gradient-gold text-primary-foreground text-sm font-semibold text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg border border-secondary/30 text-secondary text-sm font-semibold text-center"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium text-left inline-flex items-center gap-2"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/register"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg bg-gradient-gold text-primary-foreground text-sm font-semibold text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
