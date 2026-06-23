import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Megaphone, ExternalLink } from "lucide-react";
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
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{a.title}</div>
          <div className="text-xs text-muted-foreground">
            {a.duration_seconds}s · {a.button_text} · {new Date(a.created_at).toLocaleString()}
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase bg-muted text-muted-foreground">{a.status}</span>
      </div>
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
