import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowLeft, Clock, Download, Users } from "lucide-react";

type Attachment = { url: string; name?: string; public_id?: string };

function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  async function load() {
    if (!id) return;
    const { data: t } = await db.from("tasks").select("*,categories(name)").eq("id", id).maybeSingle();
    setTask(t);
    if (user) {
      const { data: a } = await db.from("task_applications")
        .select("*").eq("task_id", id).eq("worker_id", user.id).maybeSingle();
      setApplication(a);
    }
  }
  useEffect(() => { load(); }, [id, user]);

  async function apply() {
    if (!user || !id) return;
    setApplying(true);
    const { error } = await db.rpc("apply_to_task", { _task_id: id });
    setApplying(false);
    if (error) return toast.error(error.message);
    toast.success("You're in — submit your work from My applications.");
    nav("/dashboard/worker/applied");
  }

  if (!task) return <div className="text-muted-foreground">Loading…</div>;

  const attachments: Attachment[] = Array.isArray(task.attachments) ? task.attachments : [];
  const full = (task.current_workers ?? 0) >= (task.max_workers ?? 0);

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/dashboard/worker" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to available tasks
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold px-2 py-0.5 rounded-full ${
            task.tier === "gold" ? "bg-primary/15 text-primary" :
            task.tier === "silver" ? "bg-muted text-foreground" :
            "bg-secondary/15 text-secondary"
          }`}>{String(task.tier).toUpperCase()}</span>
          <span className="text-muted-foreground">{task.categories?.name ?? ""}</span>
        </div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-semibold">{task.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {task.deadline && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {new Date(task.deadline).toLocaleString()}</span>}
          <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {task.current_workers}/{task.max_workers}</span>
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
        <Section title="Description">{task.description}</Section>
        {task.requirements && <Section title="Requirements">{task.requirements}</Section>}
        {task.instructions && <Section title="Instructions">{task.instructions}</Section>}

        {attachments.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Files to download</div>
            <ul className="space-y-2">
              {attachments.map((f, i) => (
                <li key={i}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener"
                    download={f.name ?? true}
                    className="inline-flex items-center gap-2 text-sm rounded-lg border border-input bg-background px-3 py-2 hover:bg-accent"
                  >
                    <Download className="size-4 text-primary" />
                    {f.name ?? `Attachment ${i + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="font-display text-3xl text-gradient-gold font-semibold">${Number(task.payment_amount).toFixed(2)}</span>
          {application ? (
            <Link to="/dashboard/worker/applied" className="rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              View my application
            </Link>
          ) : (
            <button
              disabled={full || applying || !user}
              onClick={apply}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${
                full ? "bg-muted text-muted-foreground cursor-not-allowed" :
                "bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow"
              }`}
            >
              {full ? "TAKEN" : applying ? "Applying…" : "Apply now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export default TaskDetail;
