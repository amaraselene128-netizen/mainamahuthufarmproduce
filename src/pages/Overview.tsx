import { useEffect, useState } from "react";
import { Wallet, Briefcase, CheckCircle2, Clock, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function Overview() {
  const { profile, user, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<{ available: number; pending: number; total_earned: number } | null>(null);
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });

  useEffect(() => {
    if (!user) return;
    db.from("wallets").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setWallet(data as any));
    if (profile?.account_mode === "worker") {
      db.from("task_applications").select("status").eq("worker_id", user.id).then(({ data }) => {
        const a = data ?? [];
        setStats({
          active: a.filter((x: any) => x.status === "joined" || x.status === "submitted").length,
          pending: a.filter((x: any) => x.status === "submitted").length,
          completed: a.filter((x: any) => x.status === "approved").length,
        });
      });
    } else {
      db.from("tasks").select("status").eq("hiring_id", user.id).then(({ data }) => {
        const a = data ?? [];
        setStats({
          active: a.filter((x: any) => x.status === "active").length,
          pending: a.filter((x: any) => x.status === "taken").length,
          completed: a.filter((x: any) => x.status === "closed").length,
        });
      });
    }
  }, [user, profile?.account_mode]);

  async function switchMode() {
    if (!profile || !user) return;
    const next = profile.account_mode === "worker" ? "hiring" : "worker";
    const { error } = await db.from("profiles").update({ account_mode: next }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success(`Switched to ${next === "worker" ? "Worker" : "Client"} mode`);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-emerald p-5 text-sm text-secondary-foreground shadow-card flex items-start gap-3">
        <Wallet className="size-5 mt-0.5 shrink-0" />
        <p><strong>Payment notice:</strong> Payments are processed monthly on the 5th after task approval.</p>
      </div>

      <div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Welcome back, {profile?.username}</h1>
            <p className="text-muted-foreground mt-1">
              You're in <span className="font-medium text-foreground">{profile?.account_mode === "worker" ? "Worker" : "Client"}</span> mode.
            </p>
          </div>
          <button onClick={switchMode} className="text-sm rounded-xl border border-input bg-card px-4 py-2 hover:bg-accent">
            Switch to {profile?.account_mode === "worker" ? "Client" : "Worker"} mode
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} label="Available" value={`$${(wallet?.available ?? 0).toFixed(2)}`} />
        <Stat icon={Clock} label="Pending" value={`$${(wallet?.pending ?? 0).toFixed(2)}`} />
        <Stat icon={CheckCircle2} label={profile?.account_mode === "worker" ? "Completed tasks" : "Closed tasks"} value={stats.completed.toString()} />
        <Stat icon={Briefcase} label={profile?.account_mode === "worker" ? "Active applications" : "Active tasks"} value={stats.active.toString()} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickCard
          title={profile?.account_mode === "worker" ? "Find new tasks" : "Post a task"}
          desc={profile?.account_mode === "worker" ? "Browse available tasks across all categories." : "Create a new campaign and reach verified workers."}
          to={profile?.account_mode === "worker" ? "/dashboard/worker" : "/dashboard/hiring/new"}
          cta={profile?.account_mode === "worker" ? "Browse tasks" : "Create task"}
          icon={profile?.account_mode === "worker" ? Briefcase : Plus}
        />
        <QuickCard title="Withdraw earnings" desc="Request a payout — processed monthly on the 5th." to="/dashboard/wallet" cta="Open wallet" icon={Wallet} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center">
          <Icon className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ title, desc, to, cta, icon: Icon }: { title: string; desc: string; to: string; cta: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link to={to} className="group rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe hover:-translate-y-0.5 transition-all flex items-start gap-4">
      <div className="size-12 rounded-xl bg-gradient-emerald grid place-items-center shrink-0">
        <Icon className="size-6 text-secondary-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-display text-xl font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{desc}</div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {cta} <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default Overview;
