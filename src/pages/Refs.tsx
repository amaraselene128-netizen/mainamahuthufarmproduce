import { useEffect, useState } from "react";
import { db } from "@/lib/db";

function Refs() {
  const [subs, setSubs] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => {
    db.from("referral_subscriptions").select("*,referral_plans(tier)").order("started_at", { ascending: false }).then(async ({ data }) => {
      const rows = (data as any[]) ?? [];
      const ids = [...new Set(rows.map((s) => s.user_id).filter(Boolean))];
      const { data: profiles } = ids.length ? await db.from("profiles").select("id,username").in("id", ids) : { data: [] as any[] };
      const names = new Map(((profiles as any[]) ?? []).map((p) => [p.id, p.username]));
      setSubs(rows.map((s) => ({ ...s, username: names.get(s.user_id) ?? s.user_id })));
    });
    db.from("referral_earnings").select("referrer_id,amount,amount_cents").then(async ({ data }) => {
      const rows = (data as any[]) ?? [];
      const ids = [...new Set(rows.map((e) => e.referrer_id).filter(Boolean))];
      const { data: profiles } = ids.length ? await db.from("profiles").select("id,username").in("id", ids) : { data: [] as any[] };
      const names = new Map(((profiles as any[]) ?? []).map((p) => [p.id, p.username]));
      const grouped: Record<string, { username: string; total: number }> = {};
      for (const e of rows) {
        const u = names.get(e.referrer_id) ?? e.referrer_id;
        const amount = e.amount_cents != null ? Number(e.amount_cents) / 100 : Number(e.amount ?? 0);
        grouped[u] = { username: u, total: (grouped[u]?.total ?? 0) + amount };
      }
      setTop(Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 10));
    });
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Referrals</h1>
      <section>
        <h2 className="font-display text-xl mb-3">Top referrers</h2>
        <div className="rounded-2xl border hairline bg-card divide-y divide-border">
          {top.map((t, i) => <div key={i} className="p-3 flex justify-between"><span>{i + 1}. {t.username}</span><span className="text-gradient-gold font-semibold">${t.total.toFixed(2)}</span></div>)}
          {top.length === 0 && <div className="p-6 text-center text-muted-foreground">No earnings yet.</div>}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl mb-3">Active subscriptions ({subs.length})</h2>
        <div className="rounded-2xl border hairline bg-card divide-y divide-border">
          {subs.map((s) => (
            <div key={s.id} className="p-3 flex justify-between">
              <div><span className="font-medium">{s.username}</span> <span className="text-xs text-muted-foreground ml-2">since {new Date(s.started_at).toLocaleDateString()}</span></div>
              <span className="text-xs uppercase font-semibold">{s.referral_plans?.tier}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Refs;
