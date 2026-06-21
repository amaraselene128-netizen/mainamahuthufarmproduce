import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/site/Brand";
import { ArrowLeft, Plus, BarChart3, Star, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/hiring")({
  head: () => ({
    meta: [
      { title: "Hiring Dashboard — EGRATASKS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: HiringDashboard,
});

function HiringDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-5 border-b hairline bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><Brand /></Link>
          <Link to="/dashboard" className="text-sm rounded-lg px-3 py-1.5 hover:bg-accent">
            <ArrowLeft className="size-4 inline mr-1" /> Switch mode
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold">My campaigns</h1>
            <p className="text-muted-foreground mt-1">Post tasks, review submissions and grow your reach.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow">
            <Plus className="size-4" /> New task
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard icon={BarChart3} label="Active tasks" value="6" />
          <StatCard icon={CheckCircle2} label="Completed" value="142" />
          <StatCard icon={Star} label="Average rating" value="4.9" />
        </div>

        <div className="mt-10 rounded-2xl border hairline bg-card shadow-card p-6">
          <h2 className="font-display text-2xl font-semibold">Recent activity</h2>
          <ul className="mt-4 divide-y divide-border">
            {[
              { title: "TikTok video shares", status: "12/20 workers", tier: "Silver" },
              { title: "App install + review", status: "Awaiting review", tier: "Gold" },
              { title: "YouTube watch + like", status: "Completed", tier: "Bronze" },
            ].map((r, i) => (
              <li key={i} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.status}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{r.tier}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center">
          <Icon className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-3xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
