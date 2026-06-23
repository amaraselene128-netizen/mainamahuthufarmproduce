import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FREELANCE_CATEGORIES } from "@/data/categories";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Freelance catalog
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Every kind of work, <span className="text-gradient-gold">in one place.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Browse the full catalog of freelance and micro-task categories available on EGMTASKS.
              Clients can post tasks in any of these — workers can specialize in the ones they love.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                to="/dashboard/hiring/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow"
              >
                Post a task <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/dashboard/worker"
                className="inline-flex items-center gap-2 rounded-xl border hairline px-5 py-3 text-sm font-semibold hover:bg-accent"
              >
                Browse available tasks
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FREELANCE_CATEGORIES.map((g) => (
              <div
                key={g.group}
                className="rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.emoji}</span>
                  <h2 className="font-display text-lg font-semibold">{g.group}</h2>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-1.5">
                  {g.items.map((it) => (
                    <li
                      key={it}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      • {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
