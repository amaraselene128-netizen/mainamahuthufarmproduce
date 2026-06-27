import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, Users, Download, PlayCircle, Coins } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { formatCents, REWARD_CENTS, type AdDuration } from "@/lib/ads";

type Task = {
  id: string;
  title: string;
  description: string;
  payment_amount: number;
  tier: "bronze" | "silver" | "gold";
  deadline: string | null;
  max_workers: number;
  current_workers: number;
  status: string;
  attachments: any;
  category?: string | null;
};

type AdJob = {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: AdDuration;
  spent_cents: number;
  budget_cents: number;
  country_targeting?: string[] | null;
};

function AvailableTasks() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ads, setAds] = useState<AdJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [taskRes, adsRes, campRes, viewsRes, campViewsRes] = await Promise.all([
      db.from("tasks")
        .select("id,title,description,payment_amount,tier,deadline,max_workers,current_workers,status,attachments,category")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      db.from("advertisements")
        .select("id,title,description,duration_seconds,spent_cents,budget_cents,country_targeting,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      db.from("market_campaigns")
        .select("id,title,description,duration_seconds,target_countries,created_at,video_url,video_file_url")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      user ? db.from("ad_views").select("ad_id").eq("user_id", user.id).eq("completed", true) : Promise.resolve({ data: [] } as any),
      user ? db.from("campaign_views").select("campaign_id").eq("user_id", user.id).eq("completed", true) : Promise.resolve({ data: [] } as any),
    ]);
    setLoading(false);
    if (taskRes.error) toast.error(taskRes.error.message);
    if (adsRes.error) toast.error(adsRes.error.message);

    const completed = new Set<string>();
    ((viewsRes as any).data ?? []).forEach((v: any) => completed.add(v.ad_id));
    ((campViewsRes as any).data ?? []).forEach((v: any) => completed.add(v.campaign_id));
    const country = profile?.country_code ?? null;
    const availableAds = (((adsRes.data as any[]) ?? []) as AdJob[])
      .filter((a) => a.spent_cents < a.budget_cents)
      .filter((a) => !completed.has(a.id))
      .filter((a) => !a.country_targeting?.length || (country && a.country_targeting.includes(country)));
    const availableCampaigns: AdJob[] = (((campRes.data as any[]) ?? []))
      .filter((c) => !!(c.video_file_url || c.video_url))
      .filter((c) => !completed.has(c.id))
      .filter((c) => !c.target_countries?.length || (country && c.target_countries.includes(country)))
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        duration_seconds: ([15,30,45,60] as number[]).includes(c.duration_seconds) ? c.duration_seconds : 30,
        spent_cents: 0,
        budget_cents: 1,
      }));
    setTasks((taskRes.data as any) ?? []);
    setAds([...availableAds, ...availableCampaigns]);
  }
  useEffect(() => { load(); }, [user?.id, profile?.country_code]);

  async function apply(id: string) {
    setApplying(id);
    const { error } = await db.rpc("apply_to_task", { _task_id: id });
    setApplying(null);
    if (error) return toast.error(error.message);
    toast.success("You're in — submit your work in My applications.");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Available jobs</h1>
        <p className="text-muted-foreground mt-1">Tasks and rewarded video ads in one list.</p>
      </div>

      {loading ? <div className="text-muted-foreground">Loading…</div> :
        tasks.length === 0 && ads.length === 0 ? (
          <div className="rounded-2xl border hairline bg-card p-10 text-center text-muted-foreground">
            No active jobs right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ads.map((a) => (
              <div key={`ad-${a.id}`} className="rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Video ad</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">WATCH</span>
                </div>
                <div className="mt-4 aspect-video rounded-xl bg-muted grid place-items-center">
                  <PlayCircle className="size-10 text-primary" />
                </div>
                <Link to="/dashboard/earn" className="mt-3 font-medium leading-snug hover:text-primary">
                  {a.title}
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description ?? "Watch the full video to earn tier-unlock credits."}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {a.duration_seconds}s</span>
                  <span className="flex items-center gap-1"><Coins className="size-3.5" /> {formatCents(REWARD_CENTS[a.duration_seconds])} tier credit</span>
                </div>
                <div className="mt-auto pt-5 flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold text-gradient-gold">{formatCents(REWARD_CENTS[a.duration_seconds])}</span>
                  <Link to="/dashboard/earn" className="rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow">
                    Watch
                  </Link>
                </div>
              </div>
            ))}
            {tasks.map((t) => {
              const full = t.current_workers >= t.max_workers;
              const atts = Array.isArray(t.attachments) ? t.attachments : [];
              return (
                <div key={t.id} className="rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t.category ?? "Task"}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.tier === "gold" ? "bg-primary/15 text-primary" :
                      t.tier === "silver" ? "bg-muted text-foreground" : "bg-secondary/15 text-secondary"
                    }`}>{t.tier.toUpperCase()}</span>
                  </div>
                  <Link to={`/dashboard/worker/${t.id}`} className="mt-3 font-medium leading-snug hover:text-primary">
                    {t.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {t.deadline && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {new Date(t.deadline).toLocaleDateString()}</span>}
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {t.current_workers}/{t.max_workers}</span>
                    {atts.length > 0 && (
                      <Link to={`/dashboard/worker/${t.id}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Download className="size-3.5" /> {atts.length} file{atts.length > 1 ? "s" : ""}
                      </Link>
                    )}
                  </div>
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="font-display text-2xl font-semibold text-gradient-gold">${Number(t.payment_amount).toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/worker/${t.id}`} className="rounded-xl border border-input px-3 py-2 text-xs font-semibold hover:bg-accent">
                        Details
                      </Link>
                      <button
                        disabled={full || applying === t.id}
                        onClick={() => apply(t.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          full ? "bg-muted text-muted-foreground cursor-not-allowed" :
                          "bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow"
                        }`}
                      >
                        {full ? "TAKEN" : applying === t.id ? "Applying…" : "Apply"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

export default AvailableTasks;
