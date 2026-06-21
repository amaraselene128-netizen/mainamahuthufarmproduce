import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Users, ArrowRight } from "lucide-react";
import { Brand } from "@/components/site/Brand";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EGRATASKS" },
      { name: "description", content: "Your EGRATASKS dashboard." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="px-6 py-5 border-b hairline bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link to="/"><Brand /></Link>
          <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Sign out</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Welcome
          </span>
          <h1 className="mt-4 font-display text-5xl font-semibold">Choose how you want to start.</h1>
          <p className="mt-3 text-muted-foreground">You can switch modes anytime from your settings.</p>
          <div className="mt-4 inline-block rounded-xl bg-muted px-4 py-2 text-xs text-muted-foreground">
            Payments are processed monthly on the 28th after task approval.
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ModeCard
            icon={Briefcase}
            title="Worker Dashboard"
            sub="Browse and apply to tasks. Up to 20 workers per task."
            to="/dashboard/worker"
            accent="gold"
          />
          <ModeCard
            icon={Users}
            title="Client Dashboard"
            sub="Post tasks, review submissions, leave reviews."
            to="/dashboard/hiring"
            accent="emerald"
          />
        </div>
      </main>
    </div>
  );
}

function ModeCard({
  icon: Icon, title, sub, to, accent,
}: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; to: string; accent: "gold" | "emerald" }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border hairline bg-card p-8 shadow-card hover:shadow-luxe hover:-translate-y-1 transition-all"
    >
      <div className={`size-14 rounded-xl grid place-items-center shadow-glow ${accent === "gold" ? "bg-gradient-gold" : "bg-gradient-emerald"}`}>
        <Icon className={`size-7 ${accent === "gold" ? "text-primary-foreground" : "text-secondary-foreground"}`} />
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
        Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
