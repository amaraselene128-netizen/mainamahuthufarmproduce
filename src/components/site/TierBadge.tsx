import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

type Tier = "bronze" | "silver" | "gold" | null | undefined;

const styles: Record<string, string> = {
  bronze: "bg-amber-700/15 text-amber-700 border-amber-700/30",
  silver: "bg-slate-400/15 text-slate-500 border-slate-400/30",
  gold: "bg-gradient-gold text-primary-foreground border-transparent shadow-card",
};

export function TierBadge({ tier, size = "sm", link = true }: { tier: Tier; size?: "sm" | "md"; link?: boolean }) {
  if (!tier) {
    const body = (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/5">
        <Crown className="size-3" /> Upgrade for priority
      </span>
    );
    return link ? <Link to="/tiers">{body}</Link> : body;
  }
  const cls = styles[tier];
  const sizeCls = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  const body = (
    <span className={`inline-flex items-center gap-1 rounded-full border ${cls} ${sizeCls} font-semibold uppercase tracking-wider`}>
      <Crown className={size === "md" ? "size-3.5" : "size-3"} /> {tier}
    </span>
  );
  return link ? <Link to="/tiers">{body}</Link> : body;
}
