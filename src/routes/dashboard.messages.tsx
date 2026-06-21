import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/dashboard/messages")({
  head: () => ({ meta: [{ title: "Messages — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Messages,
});

function Messages() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("messages").select("*").eq("to_user", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setRows(data ?? []));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><MessageSquare className="size-7 text-primary" /> Messages from Admin</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No messages yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{r.subject ?? "Message"}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}