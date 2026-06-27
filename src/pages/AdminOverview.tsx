import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { Users, ListChecks, CheckCircle2, Clock, Globe2, DollarSign } from "lucide-react";

function AdminOverview() {
  const [s, setS] = useState({ users: 0, workers: 0, hiring: 0, tasks: 0, pending: 0, approved: 0, rejected: 0, countries: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [u, w, h, t, p, a, r, c, e] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("profiles").select("*", { count: "exact", head: true }).eq("account_mode", "worker"),
        db.from("profiles").select("*", { count: "exact", head: true }).eq("account_mode", "hiring"),
        db.from("tasks").select("*", { count: "exact", head: true }),
        db.from("task_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("task_submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
        db.from("task_submissions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        db.from("countries").select("*", { count: "exact", head: true }),
        db.from("transactions").select("amount").eq("type", "fee"),
      ]);
      setS({
        users: u.count ?? 0, workers: w.count ?? 0, hiring: h.count ?? 0,
        tasks: t.count ?? 0, pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0,
        countries: c.count ?? 0,
        revenue: (e.data ?? []).reduce((s: number, x: any) => s + Number(x.amount), 0),
      });
    })();
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Platform overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Tile icon={Users} label="Total users" v={s.users} />
        <Tile icon={Users} label="Workers" v={s.workers} />
        <Tile icon={Users} label="Clients" v={s.hiring} />
        <Tile icon={ListChecks} label="Tasks" v={s.tasks} />
        <Tile icon={Clock} label="Pending review" v={s.pending} />
        <Tile icon={CheckCircle2} label="Approved" v={s.approved} />
        <Tile icon={Globe2} label="Countries" v={s.countries} />
        <Tile icon={DollarSign} label="Revenue" v={`$${s.revenue.toFixed(2)}`} />
      </div>
    </div>
  );
}
function Tile({ icon: Icon, label, v }: { icon: any; label: string; v: any }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-emerald grid place-items-center"><Icon className="size-5 text-secondary-foreground" /></div>
        <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-semibold">{v}</div></div>
      </div>
    </div>
  );
}

export default AdminOverview;
