import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ExternalLink, Megaphone } from "lucide-react";

type Campaign = {
  id: string;
  category: string;
  title: string;
  description: string;
  website_url: string | null;
  video_url: string | null;
  social_url: string | null;
  budget: number | null;
  contact_email: string | null;
  attachments: string[] | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
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
            {c.category} · {new Date(c.created_at).toLocaleString()} · {c.contact_email ?? "—"}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>
          {c.status.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.description}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        {c.website_url && <a href={c.website_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Website <ExternalLink className="size-3" /></a>}
        {c.video_url && <a href={c.video_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Video <ExternalLink className="size-3" /></a>}
        {c.social_url && <a href={c.social_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Social <ExternalLink className="size-3" /></a>}
        {c.budget != null && <span className="text-muted-foreground">Budget: ${c.budget}</span>}
      </div>
      {Array.isArray(c.attachments) && c.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.attachments.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noopener" className="text-xs rounded-lg border border-input bg-background px-2 py-1 hover:bg-accent">
              Attachment {i + 1}
            </a>
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
