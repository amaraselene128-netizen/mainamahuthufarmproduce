import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Megaphone, Plus } from "lucide-react";
import { formatCents } from "@/lib/ads";

type Campaign = {
  id: string; title: string; status: string;
  duration_seconds: number; budget_cents: number; spent_cents: number;
  views_purchased: number; views_completed: number;
  country_targeting: string[] | null; created_at: string;
};

function AdvertiserDashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<string, { avgWatch: number; clicks: number }>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("advertisements").select("*").eq("advertiser_id", user.id).order("created_at", { ascending: false });
    const list = (data as any[]) ?? [];
    setRows(list as Campaign[]);
    if (list.length) {
      const ids = list.map((c) => c.id);
      const [viewsRes, clicksRes] = await Promise.all([
        db.from("ad_views").select("ad_id,watched_seconds").in("ad_id", ids).eq("completed", true),
        db.from("ad_clicks").select("ad_id").in("ad_id", ids),
      ]);
      const agg: Record<string, { sum: number; n: number; clicks: number }> = {};
      for (const id of ids) agg[id] = { sum: 0, n: 0, clicks: 0 };
      for (const v of (viewsRes.data as any[]) ?? []) { agg[v.ad_id].sum += v.watched_seconds; agg[v.ad_id].n += 1; }
      for (const c of (clicksRes.data as any[]) ?? []) { agg[c.ad_id].clicks += 1; }
      const out: typeof stats = {};
      for (const id of ids) out[id] = { avgWatch: agg[id].n ? agg[id].sum / agg[id].n : 0, clicks: agg[id].clicks };
      setStats(out);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Megaphone className="size-7 text-primary" /> Your campaigns
        </h1>
        <Link to="/dashboard/advertise" className="text-xs rounded-lg bg-gradient-gold text-primary-foreground px-3 py-2 font-semibold inline-flex items-center gap-1.5">
          <Plus className="size-3.5" /> New campaign
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border hairline bg-card p-10 text-center text-muted-foreground">
          No campaigns yet. Click "New campaign" to launch one.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((c) => {
            const completion = c.views_purchased ? Math.round((c.views_completed / c.views_purchased) * 100) : 0;
            const remaining = Math.max(0, c.budget_cents - c.spent_cents);
            const ctr = c.views_completed ? Math.round(((stats[c.id]?.clicks ?? 0) / c.views_completed) * 100) : 0;
            const badge =
              c.status === "active" ? "bg-secondary/15 text-secondary" :
              c.status === "pending" ? "bg-primary/15 text-primary" :
              c.status === "rejected" ? "bg-destructive/15 text-destructive" :
              "bg-muted text-muted-foreground";
            return (
              <div key={c.id} className="rounded-2xl border hairline bg-card p-5 shadow-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.duration_seconds}s · {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${badge}`}>{c.status}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <Stat label="Views purchased" v={c.views_purchased.toLocaleString()} />
                  <Stat label="Views completed" v={c.views_completed.toLocaleString()} />
                  <Stat label="Budget remaining" v={formatCents(remaining)} />
                  <Stat label="Completion" v={`${completion}%`} />
                  <Stat label="Avg watch" v={`${(stats[c.id]?.avgWatch ?? 0).toFixed(1)}s`} />
                  <Stat label="Clicks" v={(stats[c.id]?.clicks ?? 0).toLocaleString()} />
                  <Stat label="CTR" v={`${ctr}%`} />
                  <Stat label="Countries" v={c.country_targeting?.length ? c.country_targeting.join(", ") : "Worldwide"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{v}</div>
    </div>
  );
}

export default AdvertiserDashboard;
