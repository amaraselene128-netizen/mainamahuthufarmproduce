import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Crown, Coins, ArrowLeft, Lock } from "lucide-react";
import { formatCents, TIER_PRICE_CENTS, type Tier } from "@/lib/ads";

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
          return (
            <div key={t} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl font-semibold capitalize">{t}</div>
                <Crown className={`size-5 ${t === "gold" ? "text-primary" : t === "silver" ? "text-muted-foreground" : "text-secondary"}`} />
              </div>
              <div className="font-display text-4xl text-gradient-gold">{formatCents(price)}</div>
              <div className="space-y-2">
                <button
                  disabled={!!activeTier || busy === t || balance < price}
                  onClick={() => unlock(t)}
                  className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === t ? "Unlocking…" : ok ? `Unlock with credits` : balance < price ? `Need ${formatCents(price - balance)} more` : "Already subscribed"}
                </button>
                <button
                  disabled
                  title="PayPal checkout coming soon"
                  className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground inline-flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="size-4" /> Pay with PayPal · Coming soon
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TierUnlock;
