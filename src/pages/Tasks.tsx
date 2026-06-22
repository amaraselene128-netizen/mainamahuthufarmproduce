import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Plus } from "lucide-react";

function Tasks() {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    const { data } = await db.from("tasks").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function setStatus(id: string, status: string) {
    const { data, error } = await db.functions.invoke("admin-tasks", {
      body: { action: "set_status", id, status },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    load();
  }
  async function del(id: string) {
    if (!confirm("Delete this task?")) return;
    const { data, error } = await db.functions.invoke("admin-tasks", {
      body: { action: "delete", id },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    load();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-semibold">Tasks</h1>
        <Link to="/admin/tasks/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow">
          <Plus className="size-4" /> New task
        </Link>
      </div>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No tasks yet.</div>}
        {rows.map((t) => (
          <div key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <Link to={`/admin/tasks/${t.id}`} className="min-w-0 hover:text-primary">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.current_workers}/{t.max_workers} · ${Number(t.payment_amount).toFixed(2)} · {t.status}</div>
            </Link>
            <div className="flex gap-1 flex-wrap">
              <Link to={`/admin/tasks/${t.id}`} className="text-xs rounded-lg border border-input px-2 py-1">Review</Link>
              <button onClick={() => setStatus(t.id, "active")} className="text-xs rounded-lg border border-input px-2 py-1">Activate</button>
              <button onClick={() => setStatus(t.id, "paused")} className="text-xs rounded-lg border border-input px-2 py-1">Pause</button>
              <button onClick={() => del(t.id)} className="text-xs rounded-lg border border-destructive/30 text-destructive px-2 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tasks;
