import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Star } from "lucide-react";

export const Route = createFileRoute("/dashboard/hiring/reviews")({
  head: () => ({ meta: [{ title: "Reviews — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Reviews,
});

function Reviews() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    db.from("reviews").select("*,tasks(title)").eq("hiring_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Reviews & feedback</h1>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No reviews yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.tasks?.title}</div>
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />)}</div>
            </div>
            {r.feedback && <p className="text-sm mt-2 text-muted-foreground">{r.feedback}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}