import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Users2, Copy, Crown, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Plan = { id: string; tier: string; price: number; commission_rate: number; features: string[] };
type Sub = { plan_id: string; referral_plans: Plan | null };
type ReferredRow = {
  id: string;
  username: string;
  country_code: string | null;
  status: string;
  earnings: number;
  created_at: string;
};

function Referrals() {
  const { user, profile, refreshProfile } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState({ clicks: 0, signups: 0, verified: 0, earnings: 0 });
  const [rows, setRows] = useState<ReferredRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure the profile has a referral code; if missing, mint one.
  useEffect(() => {
    if (!user || !profile) return;
    const code = (profile as any).referral_code as string | undefined;
    if (!code) {
      const fresh = generateCode(profile.username);
      db.from("profiles").update({ referral_code: fresh }).eq("id", user.id).then(() => refreshProfile());
    }
  }, [user, profile, refreshProfile]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const code = (profile as any)?.referral_code as string | undefined;
    const [pRes, sRes, refsRes, eRes, cRes] = await Promise.all([
      db.from("referral_plans").select("*").eq("active", true).order("price"),
      db.from("referral_subscriptions").select("plan_id, referral_plans(*)").eq("user_id", user.id).maybeSingle(),
      db.from("referrals").select("id, referred_id, verified_at, created_at").eq("referrer_id", user.id),
      db.from("referral_earnings").select("amount,status,referred_id").eq("referrer_id", user.id),
      code ? db.from("referral_clicks").select("*", { count: "exact", head: true }).eq("code", code) : Promise.resolve({ count: 0 } as any),
    ]);
    setPlans((pRes.data as Plan[]) ?? []);
    setSub(sRes.data as Sub | null);

    const refs = (refsRes.data ?? []) as any[];
    const earnings = eRes.data ?? [];
    const earningsByRef = new Map<string, number>();
    for (const r of earnings) {
      earningsByRef.set(r.referred_id, (earningsByRef.get(r.referred_id) ?? 0) + Number(r.amount));
    }
    // Fetch referred profiles separately (no FK from referrals -> profiles via PostgREST embed reliably).
    const ids = refs.map((r) => r.referred_id).filter(Boolean);
    const profilesById = new Map<string, { username?: string; country_code?: string | null }>();
    if (ids.length) {
      const { data: profs } = await db.from("profiles").select("id, username, country_code").in("id", ids);
      for (const p of profs ?? []) profilesById.set((p as any).id, p as any);
    }
    setRows(
      refs.map((r: any) => ({
        id: r.id,
        username: profilesById.get(r.referred_id)?.username ?? "—",
        country_code: profilesById.get(r.referred_id)?.country_code ?? null,
        status: r.verified_at ? "verified" : "signed-up",
        earnings: earningsByRef.get(r.referred_id) ?? 0,
        created_at: r.created_at,
      })),
    );
    setStats({
      clicks: (cRes as any).count ?? 0,
      signups: refs.length,
      verified: refs.filter((r: any) => r.verified_at).length,
      earnings: earnings.reduce((s: number, e: any) => s + Number(e.amount), 0),
    });
    setLoading(false);
  }

  useEffect(() => { if (profile) load(); }, [profile?.id, (profile as any)?.referral_code]);

  async function subscribe(plan: Plan) {
    if (!user) return;
    // Create a PayPal order via the secure edge function.
    const { data, error } = await db.functions.invoke("paypal-create-order", {
      body: { tier: plan.tier },
    });
    if (error || (data as any)?.error) {
      return toast.error(error?.message ?? (data as any)?.error ?? "Could not start PayPal");
    }
    const orderId = (data as any)?.id as string | undefined;
    if (!orderId) return toast.error("PayPal did not return an order id");
    const approveUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
    // Open PayPal approval in a new window; user returns and we capture.
    window.open(approveUrl, "_blank", "noopener,noreferrer");
    toast.message("Complete payment in PayPal, then click 'I have paid'.", {
      action: {
        label: "I have paid",
        onClick: async () => {
          const { data: cap, error: capErr } = await db.functions.invoke("paypal-capture-order", {
            body: { order_id: orderId, tier: plan.tier },
          });
          if (capErr || (cap as any)?.error) {
            return toast.error(capErr?.message ?? (cap as any)?.error ?? "Capture failed");
          }
          toast.success("Subscription activated");
          load();
        },
      },
      duration: 60000,
    });
  }

  const code = (profile as any)?.referral_code as string | undefined;
  const link = code ? `${window.location.origin}/auth/register?ref=${code}` : "";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
        <Users2 className="size-7 text-primary" /> Referral program
      </h1>

      {!sub ? (
        <>
          <p className="text-muted-foreground">
            Subscribe to a referral tier to unlock your unique link, dashboard and monthly commissions.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl font-semibold capitalize">{p.tier}</div>
                  <Crown className={`size-5 ${p.tier === "gold" ? "text-primary" : p.tier === "silver" ? "text-muted-foreground" : "text-secondary"}`} />
                </div>
                <div className="font-display text-4xl text-gradient-gold">
                  ${Number(p.price).toFixed(2)}
                  <span className="text-sm text-muted-foreground"> /mo</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(p.features ?? []).map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
                <div className="text-xs text-muted-foreground">
                  Commission: <span className="font-semibold text-foreground">{Number(p.commission_rate) * 100}%</span>
                </div>
                <button
                  onClick={() => subscribe(p)}
                  className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Subscribe
                </button>
              </div>
            ))}
            {plans.length === 0 && !loading && (
              <div className="md:col-span-3 text-sm text-muted-foreground text-center py-8 rounded-2xl border hairline bg-card">
                No referral plans configured yet.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Code: <span className="font-mono text-primary">{code ?? "—"}</span> · Tier{" "}
                  <span className="uppercase font-semibold">{sub.referral_plans?.tier}</span> · Commission{" "}
                  {Number(sub.referral_plans?.commission_rate ?? 0) * 100}%
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <input readOnly value={link} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
              <button
                onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}
                className="rounded-lg bg-primary text-primary-foreground px-3 py-2"
                aria-label="Copy referral link"
              >
                <Copy className="size-4" />
              </button>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-input px-3 py-2 inline-flex items-center"
                aria-label="Open"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <S label="Clicks" v={stats.clicks} />
            <S label="Signups" v={stats.signups} />
            <S label="Verified" v={stats.verified} />
            <S label="Earnings" v={`$${stats.earnings.toFixed(2)}`} />
          </div>

          <div className="rounded-2xl border hairline bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <h2 className="font-display text-lg font-semibold">Referred users</h2>
            </div>
            {rows.length === 0 ? (
              <div className="px-5 py-8 text-sm text-muted-foreground text-center">
                No referrals yet. Share your link to start earning.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">User</th>
                      <th className="text-left px-4 py-2">Country</th>
                      <th className="text-left px-4 py-2">Status</th>
                      <th className="text-left px-4 py-2">Joined</th>
                      <th className="text-right px-4 py-2">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-medium">{r.username}</td>
                        <td className="px-4 py-2 text-muted-foreground">{r.country_code ?? "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "verified" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">${r.earnings.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function generateCode(seed: string) {
  const base = (seed ?? "ref").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6) || "ref";
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}${rand}`;
}

function S({ label, v }: { label: string; v: any }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold text-gradient-gold mt-1">{v}</div>
    </div>
  );
}

export default Referrals;
