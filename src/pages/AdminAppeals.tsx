import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

type Row = {
  id: string; email: string; contact: string | null; reason: string;
  status: string; admin_notes: string | null; created_at: string; reviewed_at: string | null;
};

function AdminAppeals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    let q = db.from("account_appeals").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) return toast.error(error.message);
    setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, [filter]);

  async function decide(id: string, email: string, status: "approved" | "rejected", notes: string) {
    setBusy(id);
    // 1) update appeal
    const { error } = await db.from("account_appeals")
      .update({ status, admin_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { setBusy(null); return toast.error(error.message); }

    // 2) if approved, unsuspend/unban the matching profile (best effort)
    if (status === "approved") {
      const { data: prof } = await db.from("profiles")
        .select("id").ilike("email", email).maybeSingle();
      if (prof?.id) {
        await db.functions.invoke("admin-users", { body: { action: "set_suspended", user_id: prof.id, value: false } });
        await db.functions.invoke("admin-users", { body: { action: "set_banned", user_id: prof.id, value: false } });
      }
    }
    setBusy(null);
    toast.success(`Appeal ${status}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <ShieldAlert className="size-7 text-primary" /> Account appeals
        </h1>
        <div className="flex gap-2 text-xs">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 border ${filter === f ? "bg-secondary text-secondary-foreground" : "border-input"}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No appeals.</div>}
        {rows.map((r) => <AppealRow key={r.id} row={r} busy={busy === r.id} onDecide={decide} />)}
      </div>
    </div>
  );
}

function AppealRow({ row, busy, onDecide }: { row: Row; busy: boolean; onDecide: (id: string, email: string, s: "approved" | "rejected", n: string) => void }) {
  const [notes, setNotes] = useState(row.admin_notes ?? "");
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-medium">{row.email}</div>
          <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()} · {row.contact ?? "—"}</div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.status === "approved" ? "bg-secondary/15 text-secondary" :
          row.status === "rejected" ? "bg-destructive/15 text-destructive" :
          "bg-muted text-foreground"}`}>{row.status.toUpperCase()}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{row.reason}</p>
      {row.status === "pending" && (
        <>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Internal notes (optional)"
            className="w-full rounded-lg border border-input bg-background p-2 text-sm" />
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => onDecide(row.id, row.email, "approved", notes)}
              className="text-xs rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Approve & lift restriction
            </button>
            <button disabled={busy} onClick={() => onDecide(row.id, row.email, "rejected", notes)}
              className="text-xs rounded-lg bg-destructive/15 text-destructive px-3 py-1.5 inline-flex items-center gap-1">
              <XCircle className="size-3.5" /> Reject
            </button>
          </div>
        </>
      )}
      {row.admin_notes && row.status !== "pending" && (
        <div className="text-xs text-muted-foreground"><b>Notes:</b> {row.admin_notes}</div>
      )}
    </div>
  );
}

export default AdminAppeals;
