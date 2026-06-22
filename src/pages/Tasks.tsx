import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

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
      <h1 className="font-display text-3xl font-semibold">Tasks</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.map((t) => (
          <div key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.current_workers}/{t.max_workers} · ${Number(t.payment_amount).toFixed(2)} · {t.status}</div>
            </div>
            <div className="flex gap-1">
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
