import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Crown, Coins, ArrowLeft } from "lucide-react";
import { formatCents, TIER_PRICE_CENTS, type Tier } from "@/lib/ads";

function TierUnlock() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [busy, setBusy] = useState<Tier | null>(null);
  const [payBusy, setPayBusy] = useState<Tier | null>(null);
  const [params, setParams] = useSearchParams();

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

  // Handle the PayPal redirect: capture order + activate tier.
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
        toast.success(`${String((data as any).tier).toUpperCase()} tier activated`);
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

  async function payWithPaypal(tier: Tier) {
    if (!user) return;
    setPayBusy(tier);
    const ret = `${window.location.origin}${window.location.pathname}?paypal_order={ORDER_ID_PLACEHOLDER}`;
    const { data, error } = await db.functions.invoke("paypal-create-order", {
      body: {
        tier,
        returnUrl: `${window.location.origin}${window.location.pathname}?paypal_order=`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?paypal_cancel=1`,
      },
    });
    setPayBusy(null);
    const payload = data as any;
    if (error || payload?.error || !payload?.approveUrl) {
      return toast.error(payload?.error ?? error?.message ?? "Could not start PayPal checkout");
    }
    // PayPal will append &token=ORDER_ID; we use ?paypal_order=<id> by appending the id ourselves
    // after redirect by replacing the return URL with the order id.
    const url = new URL(payload.approveUrl);
    // we stored the orderId so build a return with it baked in
    sessionStorage.setItem("paypal_pending_order", payload.id);
    void ret;
    window.location.href = url.toString();
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
                  disabled={!!activeTier || payBusy === t}
                  onClick={() => payWithPaypal(t)}
                  className="w-full rounded-xl bg-[#0070ba] px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {payBusy === t ? "Opening PayPal…" : `Pay ${formatCents(price)} with PayPal`}
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
