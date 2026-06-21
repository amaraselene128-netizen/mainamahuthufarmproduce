import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, CheckCircle2, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/hiring/analytics")({
  head: () => ({ meta: [{ title: "Analytics — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Analytics,
});

function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, taken: 0, closed: 0, submissions: 0, approved: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tasks } = await db.from("tasks").select("status").eq("hiring_id", user.id);
      const { data: subs } = await db.from("task_submissions").select("status,task_id,tasks!inner(hiring_id)").eq("tasks.hiring_id", user.id);
      const t = tasks ?? [];
      setStats({
        total: t.length,
        active: t.filter((x: any) => x.status === "active").length,
        taken: t.filter((x: any) => x.status === "taken").length,
        closed: t.filter((x: any) => x.status === "closed").length,
        submissions: (subs ?? []).length,
        approved: (subs ?? []).filter((x: any) => x.status === "approved").length,
      });
    })();
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={BarChart3} label="Tasks posted" value={stats.total} />
        <Stat icon={Users} label="Active tasks" value={stats.active} />
        <Stat icon={CheckCircle2} label="Approved submissions" value={stats.approved} />
      </div>
    </div>
  );
}
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center"><Icon className="size-5 text-primary-foreground" /></div>
        <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-3xl font-semibold">{value}</div></div>
      </div>
    </div>
  );
}