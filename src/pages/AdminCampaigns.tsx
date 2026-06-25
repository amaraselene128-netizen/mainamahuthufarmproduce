import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, Megaphone, Pencil } from "lucide-react";
import { SocialEmbed } from "@/components/media/SocialEmbed";
import { forceDownload } from "@/lib/download";

type Campaign = {
  id: string;
  category: string;
  title: string;
  description: string;
  website_url: string | null;
  video_url: string | null;
  video_file_url?: string | null;
  social_url: string | null;
  budget: number | null;
  contact_email: string | null;
  attachments: string[] | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  promotion_type?: string | null;
  duration_seconds?: number | null;
};

function AdminCampaigns() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await db
      .from("market_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string, notes?: string) {
    const { error } = await db
      .from("market_campaigns")
      .update({ status, admin_notes: notes ?? null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
        <Megaphone className="size-7 text-primary" /> Marketing campaigns
      </h1>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border hairline bg-card p-10 text-center text-muted-foreground">
          No campaigns submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => (
            <CampaignRow key={c.id} c={c} onAction={setStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignRow({ c, onAction }: { c: Campaign; onAction: (id: string, s: string, n?: string) => void }) {
  const [notes, setNotes] = useState(c.admin_notes ?? "");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: c.title ?? "",
    description: c.description ?? "",
    duration_seconds: c.duration_seconds ?? 30,
    promotion_type: c.promotion_type ?? "external",
    video_url: c.video_url ?? "",
    video_file_url: c.video_file_url ?? "",
    website_url: c.website_url ?? "",
    social_url: c.social_url ?? "",
    budget: c.budget ?? 0,
  });
  async function save() {
    const { error } = await db.from("market_campaigns").update({
      title: form.title,
      description: form.description,
      duration_seconds: Number(form.duration_seconds) || null,
      promotion_type: form.promotion_type,
      video_url: form.video_url || null,
      video_file_url: form.video_file_url || null,
      website_url: form.website_url || null,
      social_url: form.social_url || null,
      budget: Number(form.budget) || null,
    }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Campaign updated");
    setEditing(false);
    window.location.reload();
  }
  const badge =
    c.status === "approved" ? "bg-secondary/15 text-secondary" :
    c.status === "rejected" ? "bg-destructive/15 text-destructive" :
    "bg-primary/15 text-primary";

  return (
    <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold">{c.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {c.category} · {c.promotion_type ?? "external"} · {c.duration_seconds ?? "—"}s · {new Date(c.created_at).toLocaleString()} · {c.contact_email ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((v) => !v)} className="text-xs rounded-lg border border-input px-2 py-1 inline-flex items-center gap-1">
            <Pencil className="size-3" /> {editing ? "Cancel" : "Edit"}
          </button>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>
            {c.status.toUpperCase()}
          </span>
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
          <label className="text-xs">Promotion type
            <select className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.promotion_type} onChange={(e) => setForm({ ...form, promotion_type: e.target.value })}>
              <option value="on_site">On site (direct upload)</option>
              <option value="external">External link</option>
            </select>
          </label>
          <label className="text-xs">Budget ($)<input type="number" className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></label>
          <label className="text-xs md:col-span-2">External video URL (YouTube/FB/IG/TikTok/X)<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></label>
          <label className="text-xs md:col-span-2">Direct video file URL (Cloudinary upload)<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.video_file_url} onChange={(e) => setForm({ ...form, video_file_url: e.target.value })} /></label>
          <label className="text-xs">Website URL<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></label>
          <label className="text-xs">Social URL<input className="w-full mt-1 rounded border border-input bg-card px-2 py-1.5" value={form.social_url} onChange={(e) => setForm({ ...form, social_url: e.target.value })} /></label>
          <div className="md:col-span-2"><button onClick={save} className="text-xs rounded-lg bg-primary text-primary-foreground px-3 py-1.5 font-semibold">Save changes</button></div>
        </div>
      )}
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.description}</p>
      {c.video_url && (
        <div className="rounded-xl overflow-hidden border hairline bg-black">
          {/^https?:\/\/res\.cloudinary\.com\//i.test(c.video_url) ? (
            <video src={c.video_url} controls className="w-full aspect-video bg-black" />
          ) : (
            <SocialEmbed url={c.video_url} title={c.title} />
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        {c.website_url && <a href={c.website_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Website <ExternalLink className="size-3" /></a>}
        {c.video_url && <a href={c.video_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Open source <ExternalLink className="size-3" /></a>}
        {c.social_url && <a href={c.social_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Social <ExternalLink className="size-3" /></a>}
        {c.budget != null && <span className="text-muted-foreground">Budget: ${c.budget}</span>}
      </div>
      {Array.isArray(c.attachments) && c.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.attachments.map((u, i) => (
            <button
              key={i}
              type="button"
              onClick={() => forceDownload(u, `attachment-${i + 1}`)}
              className="text-xs rounded-lg border border-input bg-background px-2 py-1 hover:bg-accent"
            >
              Attachment {i + 1}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes for the requester…"
        className="w-full rounded-lg border border-input bg-background p-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onAction(c.id, "approved", notes || undefined)} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">Approve</button>
        <button onClick={() => onAction(c.id, "rejected", notes || undefined)} className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5">Reject</button>
        <button onClick={() => onAction(c.id, "pending", notes || undefined)} className="text-xs rounded-lg border border-input px-3 py-1.5">Mark pending</button>
      </div>
    </div>
  );
}

export default AdminCampaigns;
