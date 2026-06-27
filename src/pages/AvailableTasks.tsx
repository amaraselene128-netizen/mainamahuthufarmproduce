import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Clock, Users, Download } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string;
  payment_amount: number;
  tier: "bronze" | "silver" | "gold";
  deadline: string | null;
  max_workers: number;
  current_workers: number;
  status: string;
  attachments: any;
  categories?: { name: string } | null;
};

function AvailableTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await db.from("tasks")
      .select("id,title,description,payment_amount,tier,deadline,max_workers,current_workers,status,attachments,categories(name)")
      .eq("status", "active")
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTasks((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function apply(id: string) {
    setApplying(id);
    const { error } = await db.rpc("apply_to_task", { _task_id: id });
    setApplying(null);
    if (error) return toast.error(error.message);
    toast.success("You're in — submit your work in My applications.");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Available tasks</h1>
        <p className="text-muted-foreground mt-1">First-come, first-served · maximum 20 workers per task.</p>
      </div>

      {loading ? <div className="text-muted-foreground">Loading…</div> :
        tasks.length === 0 ? (
          <div className="rounded-2xl border hairline bg-card p-10 text-center text-muted-foreground">
            No active tasks right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((t) => {
              const full = t.current_workers >= t.max_workers;
              const atts = Array.isArray(t.attachments) ? t.attachments : [];
              return (
                <div key={t.id} className="rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t.category ?? "Task"}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.tier === "gold" ? "bg-primary/15 text-primary" :
                      t.tier === "silver" ? "bg-muted text-foreground" : "bg-secondary/15 text-secondary"
                    }`}>{t.tier.toUpperCase()}</span>
                  </div>
                  <Link to={`/dashboard/worker/${t.id}`} className="mt-3 font-medium leading-snug hover:text-primary">
                    {t.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {t.deadline && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {new Date(t.deadline).toLocaleDateString()}</span>}
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {t.current_workers}/{t.max_workers}</span>
                    {atts.length > 0 && (
                      <Link to={`/dashboard/worker/${t.id}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Download className="size-3.5" /> {atts.length} file{atts.length > 1 ? "s" : ""}
                      </Link>
                    )}
                  </div>
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="font-display text-2xl font-semibold text-gradient-gold">${Number(t.payment_amount).toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/worker/${t.id}`} className="rounded-xl border border-input px-3 py-2 text-xs font-semibold hover:bg-accent">
                        Details
                      </Link>
                      <button
                        disabled={full || applying === t.id}
                        onClick={() => apply(t.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          full ? "bg-muted text-muted-foreground cursor-not-allowed" :
                          "bg-gradient-gold text-primary-foreground shadow-card hover:shadow-glow"
                        }`}
                      >
                        {full ? "TAKEN" : applying === t.id ? "Applying…" : "Apply"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

export default AvailableTasks;
