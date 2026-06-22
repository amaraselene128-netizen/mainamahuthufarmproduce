import { useEffect, useState } from "react";
import { db } from "@/lib/db";

function Refs() {
  const [subs, setSubs] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => {
    db.from("referral_subscriptions").select("*,profiles(username),referral_plans(tier)").order("started_at", { ascending: false }).then(({ data }) => setSubs(data ?? []));
    db.from("referral_earnings").select("referrer_id,amount,profiles!referral_earnings_referrer_id_fkey(username)").then(({ data }) => {
      const grouped: Record<string, { username: string; total: number }> = {};
      for (const e of (data ?? [])) {
        const u = (e as any).profiles?.username ?? e.referrer_id;
        grouped[u] = { username: u, total: (grouped[u]?.total ?? 0) + Number(e.amount) };
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
              <div><span className="font-medium">{s.profiles?.username}</span> <span className="text-xs text-muted-foreground ml-2">since {new Date(s.started_at).toLocaleDateString()}</span></div>
              <span className="text-xs uppercase font-semibold">{s.referral_plans?.tier}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Refs;
