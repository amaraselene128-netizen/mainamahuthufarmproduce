import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LayoutDashboard, Users, ListChecks, Headphones, Globe2, ShieldAlert, Wallet, Crown, Megaphone, Tv, ClipboardCheck } from "lucide-react";
import { Brand } from "@/components/site/Brand";
import { useAuth } from "@/lib/auth-context";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { to: "/admin/submissions", label: "Submissions", icon: ClipboardCheck },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/ads", label: "Ads", icon: Tv },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { to: "/admin/countries", label: "Countries", icon: Globe2 },
  { to: "/admin/referrals", label: "Referrals", icon: Crown },
  { to: "/admin/fraud", label: "Fraud", icon: ShieldAlert },
  { to: "/admin/support", label: "Support", icon: Headphones },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const path = useLocation().pathname;

  useEffect(() => {
    if (loading) return;
    if (!user) nav("/auth/login");
    else if (!isAdmin) nav("/dashboard");
  }, [loading, user, isAdmin, nav]);

  if (loading || !isAdmin) return <div className="min-h-screen grid place-items-center text-muted-foreground">Verifying admin access…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b hairline bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3"><Brand /></Link>
          <span className="rounded-full bg-secondary/15 text-secondary text-xs font-semibold px-3 py-1">ADMIN</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[220px_1fr] gap-6 px-4 sm:px-6 py-6">
        <aside className="hidden lg:block">
          <nav className="space-y-1 sticky top-20">
            {items.map((it) => {
              const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-secondary/10 text-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <it.icon className="size-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <nav className="lg:hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="whitespace-nowrap text-xs rounded-full px-3 py-1.5 border border-border bg-card text-muted-foreground">{it.label}</Link>
          ))}
        </nav>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

export default AdminLayout;
