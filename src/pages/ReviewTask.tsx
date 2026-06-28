import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, Check, X } from "lucide-react";
import { TierBadgeImg, type TierName } from "@/components/site/TierBadgeImg";


function ReviewTask() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<any | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);

  async function load() {
    const [{ data: t, error: taskError }, { data: s, error: subError }, { data: a }] = await Promise.all([
      db.from("tasks").select("*,categories(name)").eq("id", id).maybeSingle(),
      db.from("task_submissions")
        .select("id,application_id,status,comments,urls,files,admin_comment,created_at,worker_id")
        .eq("task_id", id).order("created_at", { ascending: false }),
      db.from("task_applications")
        .select("id,worker_id,status,applied_at")
        .eq("task_id", id).order("applied_at", { ascending: false }),
    ]);
    if (taskError) toast.error(taskError.message);
    if (subError) toast.error(subError.message);

    const submissions = (s as any[]) ?? [];
    const applications = (a as any[]) ?? [];
    const workerIds = [...new Set([
      ...submissions.map((row) => row.worker_id),
      ...applications.map((row) => row.worker_id),
    ].filter(Boolean))];
    let profileMap = new Map<string, any>();
    let tierMap = new Map<string, TierName>();
    if (workerIds.length > 0) {
      const [{ data: profiles }, { data: subsRows }] = await Promise.all([
        db.from("profiles").select("id,username,country_code,email").in("id", workerIds),
        db
          .from("referral_subscriptions")
          .select("user_id,status,current_period_end,plans:plans(tier)")
          .in("user_id", workerIds)
          .eq("status", "active"),
      ]);
      profileMap = new Map(((profiles as any[]) ?? []).map((p) => [p.id, p]));
      const rank: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
      for (const row of (subsRows as any[]) ?? []) {
        const tier = (row.plans?.tier as TierName | undefined) ?? null;
        if (!tier) continue;
        if (row.current_period_end && new Date(row.current_period_end) < new Date()) continue;
        const prev = tierMap.get(row.user_id);
        if (!prev || (rank[tier] ?? 0) > (rank[prev] ?? 0)) tierMap.set(row.user_id, tier);
      }
    }

    setTask(t);
    setSubs(submissions.map((row) => ({ ...row, profiles: profileMap.get(row.worker_id) ?? null, tier: tierMap.get(row.worker_id) ?? null })));
    setApps(applications.map((row) => ({ ...row, profiles: profileMap.get(row.worker_id) ?? null, tier: tierMap.get(row.worker_id) ?? null })));
  }

  useEffect(() => { load(); }, [id]);

  async function setAppStatus(appId: string, status: "approved" | "rejected") {
    const { error } = await db.from("task_applications").update({ status }).eq("id", appId);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Application approved" : "Application rejected");
    load();
  }

  async function review(subId: string, applicationStatus: string, comment?: string) {
    const { data: sub } = await db.from("task_submissions").select("application_id").eq("id", subId).maybeSingle();
    const updates: any = { status: applicationStatus, admin_comment: comment ?? null, reviewed_at: new Date().toISOString() };
    const { error } = await db.from("task_submissions").update(updates).eq("id", subId);
    if (error) return toast.error(error.message);
    if (sub?.application_id) await db.from("task_applications").update({ status: applicationStatus }).eq("id", sub.application_id);
    toast.success("Updated");
    load();
  }

  if (!task) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{task.title}</h1>
        <p className="text-muted-foreground mt-1">{task.description}</p>
      </div>

      <div className="rounded-2xl border hairline bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b hairline flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Applications ({apps.length})</h2>
          <span className="text-xs text-muted-foreground">Approve to unlock attachments & submissions</span>
        </div>
        {apps.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No applications yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {apps.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2.5">
                  <TierBadgeImg tier={a.tier} size={32} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {a.profiles?.username ?? a.worker_id.slice(0, 8)}
                      {a.tier && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">{a.tier}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(a.applied_at).toLocaleString()} · {a.profiles?.country_code ?? "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                    a.status === "approved" ? "bg-secondary/15 text-secondary" :
                    a.status === "rejected" ? "bg-destructive/15 text-destructive" :
                    a.status === "submitted" ? "bg-accent text-accent-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>{a.status}</span>
                  {a.status === "pending" && (
                    <>
                      <button onClick={() => setAppStatus(a.id, "approved")} className="text-xs inline-flex items-center gap-1 rounded-lg bg-secondary text-secondary-foreground px-2.5 py-1">
                        <Check className="size-3" /> Approve
                      </button>
                      <button onClick={() => setAppStatus(a.id, "rejected")} className="text-xs inline-flex items-center gap-1 rounded-lg bg-destructive/15 text-destructive px-2.5 py-1">
                        <X className="size-3" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="font-display text-xl">Submissions ({subs.length})</h2>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {subs.length === 0 && <div className="p-8 text-center text-muted-foreground">No submissions yet.</div>}
        {subs.map((s) => (
          <SubRow key={s.id} s={s} onReview={review} />
        ))}
      </div>
    </div>
  );
}

function SubRow({ s, onReview }: { s: any; onReview: (id: string, st: string, c?: string) => void }) {
  const [comment, setComment] = useState(s.admin_comment ?? "");
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TierBadgeImg tier={s.tier} size={32} />
          <div>
            <div className="font-medium flex items-center gap-1.5">
              {s.profiles?.username ?? s.worker_id.slice(0, 6)}
              {s.tier && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">{s.tier}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.profiles?.country_code ?? "—"}</div>
          </div>
        </div>

        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          s.status === "approved" ? "bg-secondary/15 text-secondary" :
          s.status === "rejected" ? "bg-destructive/15 text-destructive" :
          s.status === "revision" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
        }`}>{s.status}</span>
      </div>
      {s.comments && <div className="text-sm rounded-lg bg-muted p-3">{s.comments}</div>}
      {s.urls?.length > 0 && (
        <ul className="text-sm space-y-1">
          {s.urls.map((u: string, i: number) => <li key={i}><a target="_blank" rel="noopener" href={u} className="text-primary hover:underline inline-flex items-center gap-1">{u} <ExternalLink className="size-3" /></a></li>)}
        </ul>
      )}
      {s.files?.length > 0 && (
        <ul className="text-xs text-muted-foreground">
          {s.files.map((f: any, i: number) => <li key={i}>• <a href={f.url} target="_blank" rel="noopener" className="text-primary hover:underline">{f.name}</a></li>)}
        </ul>
      )}
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reviewer comment…" rows={2} className="w-full rounded-lg border border-input bg-background p-2 text-sm" />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onReview(s.id, "approved", comment || undefined)} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">Approve</button>
        <button onClick={() => onReview(s.id, "revision", comment || undefined)} className="text-xs rounded-lg bg-primary/15 text-primary px-3 py-1.5">Request revision</button>
        <button onClick={() => onReview(s.id, "rejected", comment || undefined)} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5">Reject</button>
      </div>
    </div>
  );
}

export default ReviewTask;
