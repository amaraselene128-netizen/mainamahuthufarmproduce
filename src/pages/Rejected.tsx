import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

function Rejected() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("task_submissions")
      .select("id,status,admin_comment,created_at,tasks(title)")
      .eq("worker_id", user.id).in("status", ["rejected", "revision"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Rejected & revisions</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">Nothing here — keep up the good work.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.tasks?.title}</div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                {r.status.toUpperCase()}
              </span>
            </div>
            {r.admin_comment && <div className="mt-2 text-sm text-muted-foreground rounded-lg bg-muted p-3"><strong>Reviewer:</strong> {r.admin_comment}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rejected;
