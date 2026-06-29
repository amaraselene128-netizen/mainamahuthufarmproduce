import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Crown, Coins, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import { formatCents, TIER_PRICE_CENTS, type Tier } from "@/lib/ads";

function TierUnlock() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<Tier | null>(null);
  const [payBusy, setPayBusy] = useState<string | null>(null);
  const [renewBusy, setRenewBusy] = useState(false);
  const [params, setParams] = useSearchParams();

  async function load() {
    if (!user) return;
    // Drop expired subscription rows server-side so the UI matches reality.
    try { await db.rpc("purge_expired_subscriptions" as any); } catch { /* ignore */ }
    const [cRes, sRes] = await Promise.all([
      db.from("tier_credits").select("balance_cents").eq("user_id", user.id).maybeSingle(),
      db.from("referral_subscriptions")
        .select("plan_id, expires_at, referral_plans(tier)")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setBalance(Number((cRes.data as any)?.balance_cents ?? 0));
    const sub = sRes.data as any;
    setActiveTier((sub?.referral_plans?.tier as Tier) ?? null);
    setExpiresAt(sub?.expires_at ?? null);
  }
  useEffect(() => { load(); }, [user?.id]);

  // Handle the PayPal redirect: capture order + activate / renew tier.
  useEffect(() => {
    const orderId = params.get("paypal_order");
    if (!orderId || !user) return;
    (async () => {
      const { data, error } = await db.functions.invoke("paypal-capture-order", {
        body: { orderId },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error ?? error?.message ?? "Payment capture failed");
      } else {
        const tier = String((data as any).tier).toUpperCase();
        const kind = (data as any).kind ?? "new";
        toast.success(kind === "renew" ? `${tier} tier renewed for 30 more days` : `${tier} tier activated`);
        load();
      }
      params.delete("paypal_order");
      setParams(params, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function unlock(tier: Tier) {
    setBusy(tier);
    const { error } = await db.rpc("unlock_tier_from_credits" as any, { p_tier: tier });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${tier.toUpperCase()} tier unlocked`);
    load();
  }

  async function payWithPaypal(tier: Tier, renewal = false) {
    if (!user) return;
    const key = `${tier}:${renewal ? "renew" : "new"}`;
    if (renewal) setRenewBusy(true); else setPayBusy(key);
    const { data, error } = await db.functions.invoke("paypal-create-order", {
      body: {
        tier,
        renewal,
        returnUrl: `${window.location.origin}${window.location.pathname}?paypal_order=`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?paypal_cancel=1`,
      },
    });
    if (renewal) setRenewBusy(false); else setPayBusy(null);
    const payload = data as any;
    if (error || payload?.error || !payload?.approveUrl) {
      return toast.error(payload?.error ?? error?.message ?? "Could not start PayPal checkout");
    }
    sessionStorage.setItem("paypal_pending_order", payload.id);
    window.location.href = payload.approveUrl;
  }

  // PayPal returns with ?token=<orderId>; remap that to our paypal_order param.
  useEffect(() => {
    const token = params.get("token");
    const pending = sessionStorage.getItem("paypal_pending_order");
    if (token && pending && token === pending) {
      sessionStorage.removeItem("paypal_pending_order");
      params.delete("token"); params.delete("PayerID");
      params.set("paypal_order", token);
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;

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
        <div className="rounded-2xl border hairline bg-secondary/10 text-secondary px-4 py-4 text-sm space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Active <b className="uppercase">{activeTier}</b> subscription.
            </span>
            {daysLeft !== null && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Clock className="size-3.5" />
                {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "expires today"}
              </span>
            )}
            <Link to="/dashboard/referrals" className="underline ml-auto">Open referrals</Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Monthly renewal is 50% of the tier price ({formatCents(TIER_PRICE_CENTS[activeTier] / 2)}). Unrenewed tiers expire and lose access.
            </span>
            <button
              disabled={renewBusy}
              onClick={() => payWithPaypal(activeTier, true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0070ba] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <RefreshCw className="size-3.5" />
              {renewBusy ? "Opening PayPal…" : `Renew for ${formatCents(TIER_PRICE_CENTS[activeTier] / 2)}`}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(TIER_PRICE_CENTS) as Tier[]).map((t) => {
          const price = TIER_PRICE_CENTS[t];
          const ok = balance >= price && !activeTier;
          const key = `${t}:new`;
          return (
            <div key={t} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl font-semibold capitalize">{t}</div>
                <Crown className={`size-5 ${t === "gold" ? "text-primary" : t === "silver" ? "text-muted-foreground" : "text-secondary"}`} />
              </div>
              <div className="font-display text-4xl text-gradient-gold">{formatCents(price)}</div>
              <div className="text-xs text-muted-foreground">
                30 days access · renews monthly at {formatCents(price / 2)}
              </div>
              <div className="space-y-2">
                <button
                  disabled={!!activeTier || busy === t || balance < price}
                  onClick={() => unlock(t)}
                  className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === t ? "Unlocking…" : ok ? `Unlock with credits` : balance < price ? `Need ${formatCents(price - balance)} more` : "Already subscribed"}
                </button>
                <button
                  disabled={!!activeTier || payBusy === key}
                  onClick={() => payWithPaypal(t)}
                  className="w-full rounded-xl bg-[#0070ba] px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {payBusy === key ? "Opening PayPal…" : `Pay ${formatCents(price)} with PayPal`}
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
