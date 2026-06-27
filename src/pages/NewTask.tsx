import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { FREELANCE_CATEGORIES } from "@/data/categories";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

function NewTask() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", instructions: "",
    payment_amount: "1.00", category: "", category_group: "",
    deadline: "", terms: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.terms) return toast.error("Please accept the Terms.");
    if (!user) return;
    if (!form.category) return toast.error("Please choose a category.");
    setLoading(true);
    try {
      let attachments: { url: string; public_id: string }[] = [];
      if (files.length) {
        const ups = await uploadManyToCloudinary(files, { folder: `tasks/${user.id}` });
        attachments = ups.map((u) => ({ url: u.secure_url, public_id: u.public_id }));
      }
      const { error } = await db.from("tasks").insert({
        hiring_id: user.id,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        instructions: form.instructions || null,
        payment_amount: Number(form.payment_amount),
        tier: form.tier,
        category: form.category,
        category_group: form.category_group || null,
        attachments,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      if (error) throw error;
      toast.success("Task posted");
      nav("/dashboard/hiring");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to post task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Create a new task</h1>
        <p className="text-muted-foreground mt-1">Max 20 workers per task. First-come, first-served.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border hairline bg-card p-6 shadow-card">
        <Row>
          <Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block">
            <span className="text-sm font-medium">Category</span>
            <select
              required
              value={form.category}
              onChange={(e) => {
                const v = e.target.value;
                const group = FREELANCE_CATEGORIES.find((g) => g.items.includes(v))?.group ?? "";
                setForm({ ...form, category: v, category_group: group });
              }}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            >
              <option value="">— Select category —</option>
              {FREELANCE_CATEGORIES.map((g) => (
                <optgroup key={g.group} label={`${g.emoji} ${g.group}`}>
                  {g.items.map((it) => <option key={it} value={it}>{it}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </Row>
        <Textarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <Textarea label="Requirements" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} />
        <Textarea label="Instructions for workers" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} />
        <Row>
          <Field label="Payment ($)" type="number" min="0.10" step="0.10" required value={form.payment_amount} onChange={(e) => setForm({ ...form, payment_amount: e.target.value })} />
          <Select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} options={[{ value: "bronze", label: "Bronze" }, { value: "silver", label: "Silver" }, { value: "gold", label: "Gold" }]} />
          <Field label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Row>

        {/* Attachments */}
        <label className="block">
          <span className="text-sm font-medium">Attachments (images / videos)</span>
          <div className="mt-1.5 rounded-xl border border-dashed border-input p-4 bg-background/40">
            <label htmlFor="task-files" className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
              <Upload className="size-4" /> Choose files
            </label>
            <input
              id="task-files"
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
            {files.length > 0 && (
              <ul className="mt-3 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{f.name} · {(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-1 hover:bg-accent rounded">
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>

        <label className="flex gap-2 items-start text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
          <span>I agree to the EGMTASKS Client Terms and confirm this task complies with all applicable laws.</span>
        </label>
        <button disabled={loading} className="rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">
          {loading ? "Posting…" : "Post task"}
        </button>
      </form>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>; }
function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input {...p} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" /></label>;
}
function Textarea({ label, ...p }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><textarea {...p} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" /></label>;
}
function Select({ label, options, ...p }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><select {...p} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}

export default NewTask;
