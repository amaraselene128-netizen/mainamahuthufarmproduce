import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

function Withdrawals() {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    const { data } = await db.from("withdrawal_requests").select("*,profiles(username,email)").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function setStatus(id: string, status: string) {
    const { data, error } = await db.functions.invoke("admin-withdrawals", {
      body: { id, status },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success("Updated"); load();
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Withdrawals</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.map((r) => (
          <div key={r.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-medium">{r.profiles?.username ?? r.user_id.slice(0,6)} · ${Number(r.amount).toFixed(2)} · {r.method}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.profiles?.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
              <button onClick={() => setStatus(r.id, "approved")} className="text-xs rounded-lg border border-input px-2 py-1">Approve</button>
              <button onClick={() => setStatus(r.id, "paid")} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-2 py-1">Mark paid</button>
              <button onClick={() => setStatus(r.id, "rejected")} className="text-xs rounded-lg border border-destructive/30 text-destructive px-2 py-1">Reject</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No requests.</div>}
      </div>
    </div>
  );
}

export default Withdrawals;
