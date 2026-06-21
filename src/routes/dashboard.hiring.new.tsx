import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/hiring/new")({
  head: () => ({ meta: [{ title: "Create task — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NewTask,
});

function NewTask() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", instructions: "",
    payment_amount: "1.00", tier: "bronze", category_id: "", deadline: "", terms: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.from("categories").select("id,name").order("name").then(({ data }) => setCats(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.terms) return toast.error("Please accept the Terms.");
    if (!user) return;
    setLoading(true);
    const { data, error } = await db.from("tasks").insert({
      hiring_id: user.id,
      title: form.title,
      description: form.description,
      requirements: form.requirements || null,
      instructions: form.instructions || null,
      payment_amount: Number(form.payment_amount),
      tier: form.tier,
      category_id: form.category_id || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    }).select("id").single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Task posted");
    nav({ to: "/dashboard/hiring" });
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
          <Select label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} options={[{ value: "", label: "—" }, ...cats.map((c) => ({ value: c.id, label: c.name }))]} />
        </Row>
        <Textarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <Textarea label="Requirements" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} />
        <Textarea label="Instructions for workers" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} />
        <Row>
          <Field label="Payment ($)" type="number" min="0.10" step="0.10" required value={form.payment_amount} onChange={(e) => setForm({ ...form, payment_amount: e.target.value })} />
          <Select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} options={[{ value: "bronze", label: "Bronze" }, { value: "silver", label: "Silver" }, { value: "gold", label: "Gold" }]} />
          <Field label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Row>
        <label className="flex gap-2 items-start text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
          <span>I agree to the EGRATASKS Client Terms and confirm this task complies with all applicable laws.</span>
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