import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { Filter, ExternalLink } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "revision", label: "Revision" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function AdminSubmissions() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await db
      .from("task_submissions")
      .select(
        "id,status,comments,urls,files,created_at,worker_id,task_id," +
          "tasks(title,hiring_id)," +
          "profiles!task_submissions_worker_id_profiles_fkey(username,email,country_code)"
      )
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) console.error("submissions load", error);
    setRows((data as any[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-semibold">Submissions queue</h1>
        <div className="flex items-center gap-1 rounded-full bg-card border border-border p-1">
          <Filter className="size-3.5 text-muted-foreground ml-2" />
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                tab === t.key ? "bg-gradient-gold text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {loading && <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>}
        {!loading && rows.length === 0 && <div className="p-8 text-center text-muted-foreground">Nothing here.</div>}
        {rows.map((s) => (
          <div key={s.id} className="p-4 grid gap-3 sm:grid-cols-[1fr_auto] items-start">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
              <Link to={`/admin/tasks/${s.task_id}`} className="font-medium hover:underline truncate block">
                {s.tasks?.title ?? "Untitled task"}
              </Link>
              <div className="text-xs text-muted-foreground">
                Worker: <b>{s.profiles?.username ?? s.worker_id.slice(0, 6)}</b>
                {s.profiles?.email && <span> · {s.profiles.email}</span>}
                {s.profiles?.country_code && <span> · {s.profiles.country_code}</span>}
              </div>
              {s.comments && <p className="text-sm mt-1 line-clamp-2">{s.comments}</p>}
              {(s.urls?.length || s.files?.length) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {(s.urls ?? []).map((u: string, i: number) => (
                    <a key={`u${i}`} href={u} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                      <ExternalLink className="size-3" /> link
                    </a>
                  ))}
                  {(s.files ?? []).map((f: any, i: number) => (
                    <a key={`f${i}`} href={f.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                      <ExternalLink className="size-3" /> {f.name ?? `file ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <Link to={`/admin/tasks/${s.task_id}`} className="text-xs rounded-lg bg-gradient-gold text-primary-foreground px-3 py-1.5">Open task</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSubmissions;