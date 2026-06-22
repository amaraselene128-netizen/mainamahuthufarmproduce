import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Props = {
  variant?: "gold" | "emerald" | "outline";
  loggedOutPrimary?: { label: string; to: string };
  loggedOutSecondary?: { label: string; to: string };
  loggedInPrimary?: { label: string; to: string };
  loggedInSecondary?: { label: string; to: string };
};

const goldCls =
  "group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe hover:shadow-glow transition-all";
const emeraldCls =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-emerald px-6 py-3.5 text-sm font-semibold text-secondary-foreground shadow-card hover:shadow-glow transition-all";
const glassCls =
  "inline-flex items-center gap-2 rounded-xl glass px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors";

export function AuthCta({
  variant = "gold",
  loggedOutPrimary = { label: "Get Started", to: "/auth/register" },
  loggedOutSecondary = { label: "Login", to: "/auth/login" },
  loggedInPrimary = { label: "Go to dashboard", to: "/dashboard" },
  loggedInSecondary = { label: "Browse tasks", to: "/dashboard/worker" },
}: Props) {
  const { user } = useAuth();
  const primaryCls = variant === "emerald" ? emeraldCls : goldCls;

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to={loggedInPrimary.to} className={primaryCls}>
          <LayoutDashboard className="size-4" /> {loggedInPrimary.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link to={loggedInSecondary.to} className={glassCls}>
          {loggedInSecondary.label}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link to={loggedOutPrimary.to} className={primaryCls}>
        {loggedOutPrimary.label}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link to={loggedOutSecondary.to} className={glassCls}>
        {loggedOutSecondary.label}
      </Link>
    </div>
  );
}

export default AuthCta;
