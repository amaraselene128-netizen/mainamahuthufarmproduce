import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, Filter } from "lucide-react";

type Status = "pending" | "approved" | "rejected" | "revision" | "all";

function AdminSubmissions() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = db
      .from("task_submissions")
      .select(
        "id,status,comments,urls,files,admin_comment,created_at,task_id,worker_id,application_id,tasks(title,payment_amount),profiles:profiles!task_submissions_worker_id_fkey(username,country_code,email)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function review(s: any, newStatus: string, comment?: string) {
    const { error } = await db.from("task_submissions").update({
      status: newStatus,
      admin_comment: comment ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", s.id);
    if (error) return toast.error(error.message);
    if (s.application_id) {
      await db.from("task_applications").update({ status: newStatus }).eq("id", s.application_id);
    }
    toast.success(`Marked ${newStatus}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Submissions queue</h1>
        <div className="inline-flex items-center gap-2 text-sm">
          <Filter className="size-4 text-muted-foreground" />
          {(["pending", "approved", "rejected", "revision", "all"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize border ${
                status === s ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {loading && <div className="p-8 text-center text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && <div className="p-8 text-center text-muted-foreground">Nothing here.</div>}
        {rows.map((s) => (
          <SubRow key={s.id} s={s} onReview={review} />
        ))}
      </div>
    </div>
  );
}

function SubRow({ s, onReview }: { s: any; onReview: (s: any, st: string, c?: string) => void }) {
  const [comment, setComment] = useState(s.admin_comment ?? "");
  return (
    <div className="p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/tasks/${s.task_id}`} className="font-medium hover:text-primary truncate block">
            {s.tasks?.title ?? "Untitled task"}
          </Link>
          <div className="text-xs text-muted-foreground">
            {s.profiles?.username ?? s.worker_id.slice(0, 6)} · {s.profiles?.country_code ?? "—"} ·{" "}
            {new Date(s.created_at).toLocaleString()} · ${Number(s.tasks?.payment_amount ?? 0).toFixed(2)}
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
          {s.urls.map((u: string, i: number) => (
            <li key={i}>
              <a href={u} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1 break-all">
                {u} <ExternalLink className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {s.files?.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {s.files.map((f: any, i: number) => (
            <li key={i}>• <a href={f.url} target="_blank" rel="noopener" className="text-primary hover:underline">{f.name}</a></li>
          ))}
        </ul>
      )}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Reviewer comment (optional)…"
        rows={2}
        className="w-full rounded-lg border border-input bg-background p-2 text-sm"
      />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onReview(s, "approved", comment || undefined)} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 font-semibold">Approve</button>
        <button onClick={() => onReview(s, "revision", comment || undefined)} className="text-xs rounded-lg bg-primary/15 text-primary px-3 py-1.5 font-semibold">Request revision</button>
        <button onClick={() => onReview(s, "rejected", comment || undefined)} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5 font-semibold">Reject</button>
        <Link to={`/admin/tasks/${s.task_id}`} className="text-xs rounded-lg border border-input px-3 py-1.5">Open task</Link>
      </div>
    </div>
  );
}

export default AdminSubmissions;
