import import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Users2, Copy, Crown } from "lucide-react";
import { toast } from "sonner";

function Referrals() {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [stats, setStats] = useState({ clicks: 0, signups: 0, verified: 0, earnings: 0 });

  async function load() {
    if (!user) return;
    const [pRes, sRes, refsRes, eRes] = await Promise.all([
      db.from("referral_plans").select("*").eq("active", true).order("price"),
      db.from("referral_subscriptions").select("*,referral_plans(*)").eq("user_id", user.id).maybeSingle(),
      db.from("referrals").select("verified_at").eq("referrer_id", user.id),
      db.from("referral_earnings").select("amount,status").eq("referrer_id", user.id),
    ]);
    setPlans(pRes.data ?? []);
    setSub(sRes.data);
    const refs = refsRes.data ?? [];
    const { count: clicks } = await db.from("referral_clicks").select("*", { count: "exact", head: true }).eq("code", user.id);
    setStats({
      clicks: clicks ?? 0,
      signups: refs.length,
      verified: refs.filter((r: any) => r.verified_at).length,
      earnings: (eRes.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0),
    });
  }
  useEffect(() => { load(); }, [user]);

  async function subscribe(planId: string) {
    if (!user) return;
    const { error } = await db.from("referral_subscriptions").insert({ user_id: user.id, plan_id: planId });
    if (error) return toast.error(error.message);
    toast.success("Subscribed — share your link below");
    load();
  }

  const link = user ? `${window.location.origin}/auth/register?ref=${user.id}` : "";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><Users2 className="size-7 text-primary" /> Referral program</h1>

      {!sub ? (
        <>
          <p className="text-muted-foreground">Subscribe to a referral tier to unlock your unique link, dashboard and commissions.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl font-semibold capitalize">{p.tier}</div>
                  <Crown className={`size-5 ${p.tier === "gold" ? "text-primary" : p.tier === "silver" ? "text-muted-foreground" : "text-secondary"}`} />
                </div>
                <div className="font-display text-4xl text-gradient-gold">${Number(p.price).toFixed(2)}<span className="text-sm text-muted-foreground"> /mo</span></div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(p.features ?? []).map((f: string, i: number) => <li key={i}>✓ {f}</li>)}
                </ul>
                <button onClick={() => subscribe(p.id)} className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground">Subscribe</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</div>
            <div className="mt-2 flex gap-2">
              <input readOnly value={link} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
              <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }} className="rounded-lg bg-primary text-primary-foreground px-3 py-2"><Copy className="size-4" /></button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Tier: <span className="uppercase font-semibold">{sub.referral_plans?.tier}</span> · Commission {Number(sub.referral_plans?.commission_rate ?? 0) * 100}%</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <S label="Clicks" v={stats.clicks} />
            <S label="Signups" v={stats.signups} />
            <S label="Verified" v={stats.verified} />
            <S label="Earnings" v={`$${stats.earnings.toFixed(2)}`} />
          </div>
        </>
      )}
    </div>
  );
}
function S({ label, v }: { label: string; v: any }) {
  return <div className="rounded-2xl border hairline bg-card p-5 shadow-card"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-semibold text-gradient-gold mt-1">{v}</div></div>;
}

export default Referrals;
