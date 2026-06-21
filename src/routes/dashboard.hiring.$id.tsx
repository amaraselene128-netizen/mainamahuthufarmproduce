import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/hiring/$id")({
  head: () => ({ meta: [{ title: "Review task — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ReviewTask,
});

function ReviewTask() {
  const { id } = useParams({ from: "/dashboard/hiring/$id" });
  const [task, setTask] = useState<any | null>(null);
  const [subs, setSubs] = useState<any[]>([]);

  async function load() {
    const [{ data: t }, { data: s }] = await Promise.all([
      db.from("tasks").select("*,categories(name)").eq("id", id).maybeSingle(),
      db.from("task_submissions")
        .select("id,status,comments,urls,files,admin_comment,created_at,worker_id,profiles:profiles!task_submissions_worker_id_fkey(username,country_code,email)")
        .eq("task_id", id).order("created_at", { ascending: false }),
    ]);
    setTask(t); setSubs(s ?? []);
  }
  useEffect(() => { load(); }, [id]);

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
        <div>
          <div className="font-medium">{s.profiles?.username ?? s.worker_id.slice(0, 6)}</div>
          <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.profiles?.country_code ?? "—"}</div>
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