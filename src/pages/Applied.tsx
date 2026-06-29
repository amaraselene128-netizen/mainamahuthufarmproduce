import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Upload, Lock, AlertTriangle } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Row = {
  id: string;
  status: string;
  applied_at: string;
  task_id: string;
  tasks: { id: string; title: string; payment_amount: number; tier: string; instructions: string | null };
};

function Applied() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [subs, setSubs] = useState<Record<string, any>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data, error } = await db.from("task_applications")
      .select("id,status,applied_at,task_id,tasks(id,title,payment_amount,tier,instructions)")
      .eq("worker_id", user.id)
      .order("applied_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data as any) ?? []);

    const { data: ss } = await db.from("task_submissions")
      .select("application_id,status,admin_comment,reviewed_at")
      .eq("worker_id", user.id);
    const map: Record<string, any> = {};
    (ss ?? []).forEach((s: any) => { map[s.application_id] = s; });
    setSubs(map);
  }
  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">My applications</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-muted-foreground text-center">No applications yet. Browse <a href="/dashboard/worker" className="text-primary hover:underline">available tasks</a>.</div>}
        {rows.map((r) => {
          const sub = subs[r.id];
          return (
            <div key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{r.tasks.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Applied {new Date(r.applied_at).toLocaleString()} · {r.tasks.tier.toUpperCase()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge(r.status)}`}>{r.status.toUpperCase()}</span>
                  <span className="font-display text-lg text-gradient-gold">${Number(r.tasks.payment_amount).toFixed(2)}</span>
                  {r.status === "pending" ? (
                    <span
                      title="Waiting for admin approval of your application"
                      className="inline-flex items-center gap-1 text-xs rounded-lg border border-input bg-muted px-3 py-1.5 text-muted-foreground cursor-not-allowed"
                    >
                      <Lock className="size-3" /> Awaiting approval
                    </span>
                  ) : (
                    <button onClick={() => setActiveId(activeId === r.id ? null : r.id)} className="text-xs rounded-lg border border-input bg-card px-3 py-1.5 hover:bg-accent">
                      {activeId === r.id ? "Close" : r.status === "approved" ? "View" : "Submit work"}
                    </button>
                  )}
                </div>
              </div>
              {sub?.admin_comment && (
                <div className="mt-3 text-sm rounded-lg bg-muted p-3">
                  <strong className="capitalize">{sub.status} · Reviewer:</strong> {sub.admin_comment}
                </div>
              )}
              {activeId === r.id && (
                <SubmissionPanel application={r} onDone={() => { setActiveId(null); load(); }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function badge(s: string) {
  return s === "approved" ? "bg-secondary/15 text-secondary" :
    s === "rejected" ? "bg-destructive/15 text-destructive" :
    s === "revision" ? "bg-primary/15 text-primary" :
    s === "submitted" ? "bg-accent text-accent-foreground" :
    "bg-muted text-foreground";
}

function SubmissionPanel({ application, onDone }: { application: Row; onDone: () => void }) {
  const { user } = useAuth();
  const [urls, setUrls] = useState("");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const up = await uploadToCloudinary(file, { folder: `submissions/${user.id}/${application.id}` });
      setFiles((f) => [...f, { name: file.name, url: up.secure_url }]);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function submit() {
    if (!user) return;
    if (files.length === 0 && !urls.trim() && !comments.trim()) {
      return toast.error("Attach a file, paste a URL, or add a comment before submitting.");
    }
    if (!confirm("Submit work? You can only submit ONCE per task. A second attempt may flag your account.")) return;
    setSubmitting(true);
    const urlList = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    const { error } = await db.from("task_submissions").insert({
      application_id: application.id,
      task_id: application.task_id,
      worker_id: user.id,
      files,
      urls: urlList,
      comments,
    });
    if (!error) {
      await db.from("task_applications").update({ status: "submitted" }).eq("id", application.id);
    }
    setSubmitting(false);
    if (error) {
      if ((error as any).code === "23505" || /duplicate|unique/i.test(error.message)) {
        toast.warning("You already submitted this task. Repeated submissions can flag your account.");
        onDone();
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Submission sent for review");
    onDone();
  }

  return (
    <div className="mt-4 rounded-xl border border-input bg-background p-4 space-y-3">
      {application.tasks.instructions && (
        <div className="text-xs text-muted-foreground"><strong>Instructions:</strong> {application.tasks.instructions}</div>
      )}
      <label className="block text-sm font-medium">URLs (one per line)</label>
      <textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-card p-3 text-sm" placeholder="https://..." />
      <label className="block text-sm font-medium">Comments</label>
      <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-card p-3 text-sm" placeholder="Add context for the reviewer" />
      <div>
        <input ref={inputRef} type="file" onChange={handleFile} className="hidden" id={`f-${application.id}`} />
        <label htmlFor={`f-${application.id}`} className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-sm hover:bg-accent">
          <Upload className="size-4" /> {uploading ? "Uploading…" : "Attach file / screenshot"}
        </label>
        {files.length > 0 && (
          <ul className="mt-2 text-xs text-muted-foreground space-y-1">
            {files.map((f, i) => <li key={i}>• {f.name}</li>)}
          </ul>
        )}
      </div>
      <button onClick={submit} disabled={submitting} className="rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </div>
  );
}

export default Applied;
