import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, ArrowLeft, FileText, Mail, Globe, User, Paperclip } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  instructions: string | null;
  attachments: any[];
  payment_amount: number;
  tier: string;
  status: string;
  deadline: string | null;
  max_workers: number;
  current_workers: number;
  hiring_id: string;
  created_at: string;
  categories?: { name: string } | null;
};

type Client = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  country_code: string | null;
  avatar_url: string | null;
};

type Application = {
  id: string;
  worker_id: string;
  status: string;
  applied_at: string;
  profiles?: { username: string | null; email: string | null; country_code: string | null } | null;
};

type Submission = {
  id: string;
  application_id: string | null;
  worker_id: string;
  status: string;
  comments: string | null;
  urls: string[] | null;
  files: any[] | null;
  admin_comment: string | null;
  created_at: string;
  profiles?: { username: string | null; email: string | null; country_code: string | null } | null;
};

function AdminTaskReview() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: t } = await db
      .from("tasks")
      .select("*,categories(name)")
      .eq("id", id)
      .maybeSingle();
    setTask(t as any);

    if (t?.hiring_id) {
      const { data: c } = await db
        .from("profiles")
        .select("id,username,email,full_name,country_code,avatar_url")
        .eq("id", t.hiring_id)
        .maybeSingle();
      setClient(c as any);
    }

    const [appsRes, subsRes] = await Promise.all([
      db
        .from("task_applications")
        .select("id,worker_id,status,applied_at,profiles:profiles!task_applications_worker_profile_fk(username,email,country_code)")
        .eq("task_id", id)
        .order("applied_at", { ascending: false }),
      db
        .from("task_submissions")
        .select("id,application_id,worker_id,status,comments,urls,files,admin_comment,created_at,profiles:profiles!task_submissions_worker_profile_fk(username,email,country_code)")
        .eq("task_id", id)
        .order("created_at", { ascending: false }),
    ]);
    setApps((appsRes.data as any[]) ?? []);
    setSubs((subsRes.data as any[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function setAppStatus(appId: string, status: "approved" | "rejected") {
    const { error } = await db.from("task_applications").update({ status }).eq("id", appId);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    load();
  }

  async function reviewSubmission(sub: Submission, status: string, comment?: string) {
    const { error } = await db
      .from("task_submissions")
      .update({ status, admin_comment: comment ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (error) return toast.error(error.message);
    if (sub.application_id) {
      await db.from("task_applications").update({ status }).eq("id", sub.application_id);
    }
    toast.success("Submission updated");
    load();
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!task) return <div className="text-muted-foreground">Task not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/admin/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to tasks
      </Link>

      {/* Task header */}
      <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{task.title}</h1>
            <div className="text-xs text-muted-foreground mt-1">
              {task.categories?.name ?? "Uncategorised"} · ${Number(task.payment_amount).toFixed(2)} ·
              tier <span className="capitalize">{task.tier}</span> · {task.current_workers}/{task.max_workers} workers
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
            task.status === "active" ? "bg-secondary/15 text-secondary" :
            task.status === "pending_review" ? "bg-primary/15 text-primary" :
            "bg-muted text-muted-foreground"
          }`}>{task.status}</span>
        </div>
        <p className="text-sm">{task.description}</p>
      </div>

      {/* Client card */}
      {client && (
        <div className="rounded-2xl border hairline bg-card p-5 shadow-card">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Client</div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="size-12 rounded-full bg-muted grid place-items-center overflow-hidden">
              {client.avatar_url
                ? <img src={client.avatar_url} alt="" className="size-full object-cover" />
                : <User className="size-6 text-muted-foreground" />}
            </div>
            <div className="space-y-1">
              <div className="font-semibold">{client.full_name ?? client.username ?? "—"}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                {client.username && <span>@{client.username}</span>}
                {client.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {client.email}</span>}
                {client.country_code && <span className="inline-flex items-center gap-1"><Globe className="size-3" /> {client.country_code}</span>}
              </div>
            </div>
            <Link
              to={`/dashboard/messages?to=${client.id}`}
              className="ml-auto text-xs rounded-lg border border-input px-3 py-1.5 hover:bg-accent"
            >
              Message client
            </Link>
          </div>
        </div>
      )}

      {/* Instructions & requirements */}
      {(task.requirements || task.instructions) && (
        <div className="grid gap-4 md:grid-cols-2">
          {task.requirements && (
            <div className="rounded-2xl border hairline bg-card p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Requirements</div>
              <p className="text-sm whitespace-pre-wrap">{task.requirements}</p>
            </div>
          )}
          {task.instructions && (
            <div className="rounded-2xl border hairline bg-card p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Instructions</div>
              <p className="text-sm whitespace-pre-wrap">{task.instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {Array.isArray(task.attachments) && task.attachments.length > 0 && (
        <div className="rounded-2xl border hairline bg-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Paperclip className="size-3.5" /> Attachments ({task.attachments.length})
          </div>
          <ul className="space-y-2 text-sm">
            {task.attachments.map((f: any, i: number) => {
              const url = typeof f === "string" ? f : f?.url ?? f?.secure_url;
              const name = typeof f === "string" ? f : f?.name ?? f?.original_filename ?? `Attachment ${i + 1}`;
              if (!url) return null;
              return (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-primary hover:underline">
                    <FileText className="size-4" /> {name} <ExternalLink className="size-3" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Applications */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">Applications ({apps.length})</h2>
        <div className="rounded-2xl border hairline bg-card divide-y divide-border">
          {apps.length === 0 && <div className="p-8 text-center text-muted-foreground">No applicants yet.</div>}
          {apps.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{a.profiles?.username ?? a.worker_id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  {a.profiles?.email ?? "—"} · {a.profiles?.country_code ?? "—"} · applied {new Date(a.applied_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  a.status === "approved" ? "bg-secondary/15 text-secondary" :
                  a.status === "rejected" ? "bg-destructive/15 text-destructive" :
                  "bg-muted text-foreground"
                }`}>{a.status}</span>
                {a.status !== "approved" && (
                  <button onClick={() => setAppStatus(a.id, "approved")} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">Approve</button>
                )}
                {a.status !== "rejected" && (
                  <button onClick={() => setAppStatus(a.id, "rejected")} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5">Reject</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submissions */}
      <section className="space-y-3">
        <h2 className="font-display text-xl">Submissions ({subs.length})</h2>
        <div className="rounded-2xl border hairline bg-card divide-y divide-border">
          {subs.length === 0 && <div className="p-8 text-center text-muted-foreground">No submissions yet.</div>}
          {subs.map((s) => (
            <SubRow key={s.id} s={s} onReview={reviewSubmission} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SubRow({ s, onReview }: { s: Submission; onReview: (s: Submission, st: string, c?: string) => void }) {
  const [comment, setComment] = useState(s.admin_comment ?? "");
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{s.profiles?.username ?? s.worker_id.slice(0, 8)}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(s.created_at).toLocaleString()} · {s.profiles?.email ?? "—"} · {s.profiles?.country_code ?? "—"}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          s.status === "approved" ? "bg-secondary/15 text-secondary" :
          s.status === "rejected" ? "bg-destructive/15 text-destructive" :
          s.status === "revision" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
        }`}>{s.status}</span>
      </div>
      {s.comments && <div className="text-sm rounded-lg bg-muted p-3 whitespace-pre-wrap">{s.comments}</div>}
      {s.urls && s.urls.length > 0 && (
        <ul className="text-sm space-y-1">
          {s.urls.map((u, i) => (
            <li key={i}>
              <a target="_blank" rel="noopener" href={u} className="text-primary hover:underline inline-flex items-center gap-1">
                {u} <ExternalLink className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {s.files && s.files.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
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

export default AdminTaskReview;
