import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/worker/completed")({
  head: () => ({ meta: [{ title: "Completed tasks — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Completed,
});

function Completed() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("task_applications")
      .select("id,status,applied_at,tasks(title,payment_amount,tier)")
      .eq("worker_id", user.id).eq("status", "approved")
      .order("applied_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Completed tasks</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No completed tasks yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.tasks?.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(r.applied_at).toLocaleString()}</div>
            </div>
            <span className="font-display text-lg text-gradient-gold">+${Number(r.tasks?.payment_amount ?? 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}