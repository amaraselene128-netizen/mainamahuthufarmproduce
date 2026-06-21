import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Users, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/hiring")({
  head: () => ({ meta: [{ title: "My tasks — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: MyTasks,
});

function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("tasks").select("*").eq("hiring_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setTasks(data ?? []));
  }, [user]);

  async function setStatus(id: string, status: string) {
    const { error } = await db.from("tasks").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setTasks((arr) => arr.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">My campaigns</h1>
          <p className="text-muted-foreground mt-1">Post tasks, review submissions and grow your reach.</p>
        </div>
        <Link to="/dashboard/hiring/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow">
          <Plus className="size-4" /> New task
        </Link>
      </div>

      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {tasks.length === 0 && <div className="p-10 text-center text-muted-foreground">No tasks yet. <Link to="/dashboard/hiring/new" className="text-primary hover:underline">Create your first task</Link>.</div>}
        {tasks.map((t) => (
          <div key={t.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                <span><Users className="size-3 inline -mt-0.5 mr-1" />{t.current_workers}/{t.max_workers}</span>
                <span>${Number(t.payment_amount).toFixed(2)}</span>
                <span className="uppercase">{t.tier}</span>
                <span className={`px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-secondary/15 text-secondary" : t.status === "taken" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>{t.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/hiring/$id" params={{ id: t.id }} className="text-xs rounded-lg border border-input bg-card px-3 py-1.5 hover:bg-accent inline-flex items-center gap-1">
                <Eye className="size-3.5" /> Review
              </Link>
              {t.status === "active" && (
                <button onClick={() => setStatus(t.id, "paused")} className="text-xs rounded-lg border border-input bg-card px-3 py-1.5 hover:bg-accent">Pause</button>
              )}
              {t.status === "paused" && (
                <button onClick={() => setStatus(t.id, "active")} className="text-xs rounded-lg border border-input bg-card px-3 py-1.5 hover:bg-accent">Resume</button>
              )}
              {t.status !== "closed" && (
                <button onClick={() => setStatus(t.id, "closed")} className="text-xs rounded-lg border border-destructive/30 text-destructive px-3 py-1.5 hover:bg-destructive/10">Close</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}