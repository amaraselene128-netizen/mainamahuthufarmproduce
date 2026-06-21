import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Notifs,
});

function Notifs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setRows(data ?? []);
      db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => undefined);
    });
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><Bell className="size-7 text-primary" /> Notifications</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No notifications yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}