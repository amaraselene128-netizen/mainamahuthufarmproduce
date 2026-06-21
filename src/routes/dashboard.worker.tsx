import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/site/Brand";
import { ArrowLeft, Clock, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/dashboard/worker")({
  head: () => ({
    meta: [
      { title: "Worker Dashboard — EGRATASKS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: WorkerDashboard,
});

const mockTasks = [
  { id: 1, title: "Subscribe to YouTube channel & like 3 videos", category: "YouTube", payment: "$1.20", deadline: "24h", tier: "Silver", workers: 12 },
  { id: 2, title: "Install app and leave a 5-star review", category: "Mobile Apps", payment: "$2.50", deadline: "48h", tier: "Gold", workers: 7 },
  { id: 3, title: "Share TikTok video to your story", category: "TikTok", payment: "$0.80", deadline: "12h", tier: "Bronze", workers: 19 },
  { id: 4, title: "Write a 50-word product review", category: "Services", payment: "$3.00", deadline: "72h", tier: "Gold", workers: 4 },
];

function WorkerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-5 border-b hairline bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><Brand /></Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5">
              <Wallet className="size-4 text-primary" />
              <span className="font-medium">$24.60</span>
              <span className="text-muted-foreground">wallet</span>
            </div>
            <Link to="/dashboard" className="rounded-lg px-3 py-1.5 hover:bg-accent">
              <ArrowLeft className="size-4 inline mr-1" /> Switch mode
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-gradient-emerald p-5 text-sm text-secondary-foreground shadow-card mb-8 flex items-start gap-3">
          <Wallet className="size-5 mt-0.5" />
          <p><strong>Payment notice:</strong> Payments are processed monthly on the 28th after task approval.</p>
        </div>

        <h1 className="font-display text-4xl font-semibold">Available tasks</h1>
        <p className="text-muted-foreground mt-1">First-come, first-served · maximum 20 workers per task.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockTasks.map((t) => {
            const full = t.workers >= 20;
            return (
              <div key={t.id} className="rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t.category}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    t.tier === "Gold" ? "bg-primary/15 text-primary" :
                    t.tier === "Silver" ? "bg-muted text-foreground" : "bg-secondary/15 text-secondary"
                  }`}>{t.tier}</span>
                </div>
                <h3 className="mt-3 font-medium leading-snug">{t.title}</h3>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {t.deadline}</span>
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> {t.workers}/20</span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold text-gradient-gold">{t.payment}</span>
                  <button
                    disabled={full}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      full ? "bg-muted text-muted-foreground cursor-not-allowed" :
                      "bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow"
                    }`}
                  >
                    {full ? "TAKEN" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
