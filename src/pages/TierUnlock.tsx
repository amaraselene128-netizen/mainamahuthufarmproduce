import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Crown, Coins, ArrowLeft, Check, ShieldAlert } from "lucide-react";
import { formatCents, TIER_PRICE_CENTS, type Tier } from "@/lib/ads";

const TIER_BENEFITS: Record<Tier, { coaching: string; tasks: string; referrals: string; minWithdraw: string; chat: string; minWithdrawCents: number }> = {
  bronze: {
    coaching: "10 minutes of weekly coaching",
    tasks: "Regular + Bronze rated tasks",
    referrals: "Regular + Bronze referral earnings",
    minWithdraw: "$30 USD",
    chat: "Tier 3 Millionaires group chat",
    minWithdrawCents: 3000,
  },
  silver: {
    coaching: "100 minutes of weekly coaching",
    tasks: "Regular, Bronze + Silver rated tasks",
    referrals: "Regular, Bronze + Silver referral earnings",
    minWithdraw: "$20 USD",
    chat: "Tier 2 Millionaires group chat",
    minWithdrawCents: 2000,
  },
  gold: {
    coaching: "Unlimited coaching · 1,000+ minutes of material weekly",
    tasks: "Regular, Bronze, Silver + Gold rated tasks",
    referrals: "Regular, Bronze, Silver + Gold referral earnings",
    minWithdraw: "$10 USD",
    chat: "Tier 1 (Premium) Millionaires group chat",
    minWithdrawCents: 1000,
  },
};

function TierUnlock() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [busy, setBusy] = useState<Tier | null>(null);

  async function load() {
    if (!user) return;
    const [cRes, sRes] = await Promise.all([
      db.from("tier_credits").select("balance_cents").eq("user_id", user.id).maybeSingle(),
      db.from("referral_subscriptions").select("plan_id, referral_plans(tier)").eq("user_id", user.id).maybeSingle(),
    ]);
    setBalance(Number((cRes.data as any)?.balance_cents ?? 0));
    setActiveTier(((sRes.data as any)?.referral_plans?.tier as Tier) ?? null);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function unlock(tier: Tier) {
    setBusy(tier);
    const { error } = await db.rpc("unlock_tier_from_credits" as any, { p_tier: tier });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${tier.toUpperCase()} tier unlocked`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Crown className="size-7 text-primary" /> Unlock referral tier
        </h1>
        <Link to="/dashboard/earn" className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> Back to ads
        </Link>
      </div>

      <div className="rounded-2xl border hairline bg-card p-6 shadow-card flex items-center gap-3">
        <Coins className="size-5 text-primary" />
        <span className="font-display text-2xl font-semibold text-gradient-gold">{formatCents(balance)}</span>
        <span className="text-xs text-muted-foreground">tier credits available</span>
      </div>

      {activeTier && (
        <div className="rounded-2xl border hairline bg-secondary/10 text-secondary px-4 py-3 text-sm">
          You already have an active <b className="uppercase">{activeTier}</b> subscription.
          Go to <Link to="/dashboard/referrals" className="underline">Referrals</Link> for your link.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(TIER_PRICE_CENTS) as Tier[]).map((t) => {
          const price = TIER_PRICE_CENTS[t];
          const ok = balance >= price && !activeTier;
          const b = TIER_BENEFITS[t];
          const accent =
            t === "gold" ? "text-primary" : t === "silver" ? "text-muted-foreground" : "text-secondary";
          return (
            <div key={t} className={`relative rounded-2xl border hairline bg-card p-6 shadow-card space-y-4 ${t === "gold" ? "ring-1 ring-primary/30" : ""}`}>
              {t === "gold" && (
                <span className="absolute -top-2 right-4 text-[10px] font-semibold uppercase tracking-wider bg-gradient-gold text-primary-foreground px-2 py-0.5 rounded-full shadow-glow">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl font-semibold capitalize">{t}</div>
                <Crown className={`size-5 ${accent}`} />
              </div>
              <div className="font-display text-4xl text-gradient-gold">{formatCents(price)}</div>

              <ul className="space-y-2 text-sm">
                <Bullet>{b.coaching}</Bullet>
                <Bullet>{b.tasks}</Bullet>
                <Bullet>{b.referrals}</Bullet>
                <Bullet><span className="font-medium">Min withdrawal: {b.minWithdraw}</span></Bullet>
                <Bullet>{b.chat}</Bullet>
              </ul>

              <button
                disabled={!ok || busy === t}
                onClick={() => unlock(t)}
                className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy === t ? "Unlocking…" : ok ? `Unlock ${t}` : balance < price ? `Need ${formatCents(price - balance)} more` : "Already subscribed"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border hairline bg-card/60 p-6 space-y-3">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldAlert className="size-5 text-primary" /> Additional terms &amp; conditions
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>
            The <span className="text-foreground font-medium">paid principal amount</span> of any package
            purchased is <span className="text-foreground font-medium">non-refundable</span>.
          </li>
          <li>
            Subscriptions can only be cancelled if the user deposits an amount{" "}
            <span className="text-foreground font-medium">equal to the principal</span> to cater for the
            operational fees of cancellation.
          </li>
        </ol>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="size-4 mt-0.5 text-secondary shrink-0" />
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

export default TierUnlock;
