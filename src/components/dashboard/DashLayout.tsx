import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard, ListChecks, ClipboardList, CheckCircle2, XCircle,
  Wallet, Bell, Settings, UserCircle, Plus, BarChart3, Star, Headphones,
  Users2, Coins, ShieldCheck, LogOut, MessageSquare,
} from "lucide-react";
import { Brand } from "@/components/site/Brand";
import { useAuth } from "@/lib/auth-context";

const workerNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Available tasks", to: "/dashboard/worker", icon: ListChecks },
  { label: "My applications", to: "/dashboard/worker/applied", icon: ClipboardList },
  { label: "Completed", to: "/dashboard/worker/completed", icon: CheckCircle2 },
  { label: "Rejected", to: "/dashboard/worker/rejected", icon: XCircle },
  { label: "Earnings", to: "/dashboard/wallet", icon: Coins },
];

const hiringNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "My tasks", to: "/dashboard/hiring", icon: ListChecks },
  { label: "Create task", to: "/dashboard/hiring/new", icon: Plus },
  { label: "Analytics", to: "/dashboard/hiring/analytics", icon: BarChart3 },
  { label: "Reviews", to: "/dashboard/hiring/reviews", icon: Star },
];

const sharedNav = [
  { label: "Wallet", to: "/dashboard/wallet", icon: Wallet },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Referrals", to: "/dashboard/referrals", icon: Users2 },
  { label: "Support", to: "/dashboard/support", icon: Headphones },
  { label: "Profile", to: "/dashboard/profile", icon: UserCircle },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export function DashLayout() {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const path = useLocation({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
  }, [loading, user, nav]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const items = profile.account_mode === "worker" ? workerNav : hiringNav;

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b hairline bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3"><Brand /></Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-muted-foreground">Hi, <span className="font-medium text-foreground">{profile.username}</span></span>
            <span className="hidden sm:inline rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wider text-muted-foreground">
              {profile.account_mode === "worker" ? "Worker" : "Client"}
            </span>
            {isAdmin && (
              <Link to="/admin" className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/20 hover:bg-secondary/25">
                <ShieldCheck className="inline size-3.5 -mt-0.5 mr-1" /> Admin
              </Link>
            )}
            <button onClick={signOut} className="rounded-lg p-2 hover:bg-accent" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid lg:grid-cols-[240px_1fr] gap-6 px-4 sm:px-6 py-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="space-y-1 sticky top-20">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 pb-2">
              {profile.account_mode === "worker" ? "Worker" : "Client"}
            </div>
            {items.map((it) => {
              const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-primary/10 text-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <it.icon className="size-4" /> {it.label}
                </Link>
              );
            })}
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 pt-4 pb-2">Account</div>
            {sharedNav.map((it) => {
              const active = path === it.to || path.startsWith(it.to + "/");
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-primary/10 text-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <it.icon className="size-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav scroller */}
        <nav className="lg:hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {[...items, ...sharedNav].map((it) => {
            const active = path === it.to || (!it.to.endsWith("/dashboard") && path.startsWith(it.to + "/"));
            return (
              <Link key={it.to} to={it.to} className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 border ${
                active ? "bg-primary/15 border-primary/30 text-foreground" : "bg-card border-border text-muted-foreground"
              }`}>{it.label}</Link>
            );
          })}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}