import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

function Completed() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("task_submissions")
      .select("id,admin_comment,reviewed_at,created_at,tasks(title,payment_amount,tier)")
      .eq("worker_id", user.id).eq("status", "approved")
      .order("reviewed_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Completed tasks</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No completed tasks yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.tasks?.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Approved {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <span className="font-display text-lg text-gradient-gold">+${Number(r.tasks?.payment_amount ?? 0).toFixed(2)}</span>
            </div>
            {r.admin_comment && (
              <div className="text-sm rounded-lg bg-muted p-3">
                <strong>Reviewer:</strong> {r.admin_comment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Completed;
