import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, ClipboardList } from "lucide-react";

type Sub = {
  id: string;
  status: string;
  comments: string | null;
  urls: string[] | null;
  files: any[] | null;
  admin_comment: string | null;
  created_at: string;
  task_id: string;
  worker_id: string;
  tasks?: { title: string; tier: string; payment_amount: number } | null;
  profiles?: { username: string | null; country_code: string | null; email: string | null } | null;
};

function AdminSubmissions() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "revision">("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = db.from("task_submissions")
      .select("id,status,comments,urls,files,admin_comment,created_at,task_id,worker_id,tasks(title,tier,payment_amount),profiles:profiles!task_submissions_worker_id_fkey(username,country_code,email)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, [filter]);

  async function review(s: Sub, status: string, comment?: string) {
    const updates: any = { status, admin_comment: comment ?? null, reviewed_at: new Date().toISOString() };
    const { error } = await db.from("task_submissions").update(updates).eq("id", s.id);
    if (error) return toast.error(error.message);
    // Sync application status when there's a linked one
    const { data: sub } = await db.from("task_submissions").select("application_id").eq("id", s.id).maybeSingle();
    if ((sub as any)?.application_id) {
      await db.from("task_applications").update({ status }).eq("id", (sub as any).application_id);
    }
    toast.success("Updated");
    load();
  }

  const filters: Array<typeof filter> = ["pending", "approved", "rejected", "revision", "all"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <ClipboardList className="size-7 text-primary" /> Submissions
        </h1>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs rounded-full px-3 py-1.5 border ${
                filter === f ? "bg-primary/15 border-primary/30 text-foreground font-semibold" : "bg-card border-border text-muted-foreground"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {loading && <div className="p-8 text-center text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No submissions for this filter.</div>
        )}
        {rows.map((s) => (
          <Row key={s.id} s={s} onReview={review} />
        ))}
      </div>
    </div>
  );
}

function Row({ s, onReview }: { s: Sub; onReview: (s: Sub, st: string, c?: string) => void }) {
  const [comment, setComment] = useState(s.admin_comment ?? "");
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-medium truncate">
            <Link to={`/admin/tasks/${s.task_id}`} className="hover:text-primary">{s.tasks?.title ?? "Task"}</Link>
          </div>
          <div className="text-xs text-muted-foreground">
            by <span className="text-foreground">{s.profiles?.username ?? s.worker_id.slice(0, 6)}</span>
            {s.profiles?.country_code ? ` · ${s.profiles.country_code}` : ""}
            {" · "}{new Date(s.created_at).toLocaleString()}
            {s.tasks ? ` · ${String(s.tasks.tier).toUpperCase()} · $${Number(s.tasks.payment_amount).toFixed(2)}` : ""}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          s.status === "approved" ? "bg-secondary/15 text-secondary" :
          s.status === "rejected" ? "bg-destructive/15 text-destructive" :
          s.status === "revision" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
        }`}>{s.status}</span>
      </div>
      {s.comments && <div className="text-sm rounded-lg bg-muted p-3 whitespace-pre-wrap">{s.comments}</div>}
      {Array.isArray(s.urls) && s.urls.length > 0 && (
        <ul className="text-sm space-y-1">
          {s.urls.map((u: string, i: number) => (
            <li key={i}>
              <a target="_blank" rel="noopener" href={u} className="text-primary hover:underline inline-flex items-center gap-1">
                {u} <ExternalLink className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {Array.isArray(s.files) && s.files.length > 0 && (
        <ul className="text-xs text-muted-foreground">
          {s.files.map((f: any, i: number) => (
            <li key={i}>• <a href={f.url} target="_blank" rel="noopener" className="text-primary hover:underline">{f.name ?? f.url}</a></li>
          ))}
        </ul>
      )}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Reviewer comment…"
        rows={2}
        className="w-full rounded-lg border border-input bg-background p-2 text-sm"
      />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onReview(s, "approved", comment || undefined)} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">Approve</button>
        <button onClick={() => onReview(s, "revision", comment || undefined)} className="text-xs rounded-lg bg-primary/15 text-primary px-3 py-1.5">Request revision</button>
        <button onClick={() => onReview(s, "rejected", comment || undefined)} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5">Reject</button>
      </div>
    </div>
  );
}

export default AdminSubmissions;
