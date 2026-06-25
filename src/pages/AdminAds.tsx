import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Megaphone, ExternalLink, Pencil } from "lucide-react";
import { formatCents } from "@/lib/ads";

type Ad = {
  id: string; title: string; description: string | null;
  video_url: string; destination_url: string; button_text: string;
  duration_seconds: number; status: string;
  budget_cents: number; spent_cents: number;
  views_purchased: number; views_completed: number;
  country_targeting: string[] | null; created_at: string;
  admin_notes: string | null;
};

function AdminAds() {
  const [rows, setRows] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  async function load() {
    setLoading(true);
    let q = db.from("advertisements").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows(((data as any[]) ?? []) as Ad[]);
  }
  useEffect(() => { load(); }, [filter]);

  async function setStatus(id: string, status: string, notes?: string) {
    const patch: any = { status, admin_notes: notes ?? null };
    if (status === "active") patch.approved_at = new Date().toISOString();
    const { error } = await db.from("advertisements").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Megaphone className="size-7 text-primary" /> Ad campaigns
        </h1>
        <div className="flex rounded-xl border border-input overflow-hidden text-xs">
          {["pending","active","paused","rejected","depleted","all"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-muted-foreground">Loading…</div> :
       rows.length === 0 ? <div className="rounded-2xl border hairline bg-card p-10 text-center text-muted-foreground">No campaigns.</div> :
       <div className="space-y-4">
         {rows.map((a) => <Row key={a.id} a={a} onAction={setStatus} />)}
       </div>}
    </div>
  );
}

function Row({ a, onAction }: { a: Ad; onAction: (id: string, s: string, n?: string) => void }) {
  const [notes, setNotes] = useState(a.admin_notes ?? "");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: a.title,
    description: a.description ?? "",
    duration_seconds: a.duration_seconds,
    destination_url: a.destination_url,
    button_text: a.button_text,
    video_url: a.video_url,
    budget_cents: a.budget_cents,
  });
  async function save() {
    const { error } = await db.from("advertisements").update({
      title: form.title,
      description: form.description || null,
      duration_seconds: Number(form.duration_seconds),
      destination_url: form.destination_url,
      button_text: form.button_text,
      video_url: form.video_url,
      budget_cents: Number(form.budget_cents),
    }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Ad updated");
    setEditing(false);
    window.location.reload();
  }
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{a.title}</div>
          <div className="text-xs text-muted-foreground">
            {a.duration_seconds}s · {a.button_text} · {new Date(a.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((v) => !v)} className="text-xs rounded-lg border border-input px-2 py-1 inline-flex items-center gap-1">
            <Pencil className="size-3" /> {editing ? "Cancel" : "Edit"}
          </button>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase bg-muted text-muted-foreground">{a.status}</span>
        </div>
      </div>
      {editing && (
        <div className="grid gap-2 md:grid-cols-2 rounded-xl border hairline bg-background p-3 text-sm">
          <label className="text-xs">Title<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-xs">Duration (s)
            <select className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}>
              {[15,30,45,60].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-xs md:col-span-2">Description<textarea rows={2} className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="text-xs md:col-span-2">Video URL<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></label>
          <label className="text-xs">Destination URL<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.destination_url} onChange={(e) => setForm({ ...form, destination_url: e.target.value })} /></label>
          <label className="text-xs">Button text<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} /></label>
          <label className="text-xs">Budget (cents)<input type="number" className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.budget_cents} onChange={(e) => setForm({ ...form, budget_cents: Number(e.target.value) })} /></label>
          <div className="md:col-span-2"><button onClick={save} className="text-xs rounded-lg bg-primary text-primary-foreground px-3 py-1.5 font-semibold">Save changes</button></div>
        </div>
      )}
      {a.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>}
      <video src={a.video_url} controls className="w-full max-h-64 rounded-xl bg-black" />
      <div className="flex flex-wrap gap-3 text-xs">
        <a href={a.destination_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
          Destination <ExternalLink className="size-3" />
        </a>
        <span>Budget {formatCents(a.budget_cents)} · Spent {formatCents(a.spent_cents)}</span>
        <span>Views {a.views_completed}/{a.views_purchased}</span>
        <span>Countries: {a.country_targeting?.length ? a.country_targeting.join(", ") : "Worldwide"}</span>
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder="Notes for the advertiser…"
        className="w-full rounded-lg border border-input bg-background p-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        {a.status !== "active" && <button onClick={() => onAction(a.id, "active", notes || undefined)} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">Approve / activate</button>}
        {a.status !== "paused" && <button onClick={() => onAction(a.id, "paused", notes || undefined)} className="text-xs rounded-lg border border-input px-3 py-1.5">Pause</button>}
        {a.status !== "rejected" && <button onClick={() => onAction(a.id, "rejected", notes || undefined)} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5">Reject</button>}
      </div>
    </div>
  );
}

export default AdminAds;
