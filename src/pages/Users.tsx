import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

const TIERS = ["bronze", "silver", "gold"] as const;

function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  async function load() {
    let query = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
    if (q) query = query.ilike("username", `%${q}%`);
    const { data } = await query;
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, [q]);

  async function toggle(id: string, field: "suspended" | "banned", value: boolean) {
    const action = field === "suspended" ? "set_suspended" : "set_banned";
    const { data, error } = await db.functions.invoke("admin-users", {
      body: { action, user_id: id, value },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success("Updated"); load();
  }

  async function grantTier(id: string, tier: string) {
    if (!tier) return;
    const { error } = await db.rpc("admin_grant_tier" as any, { p_user: id, p_tier: tier });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${tier.toUpperCase()} tier`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username…" className="rounded-lg border border-input bg-card px-3 py-2 text-sm" />
      </div>
      <div className="rounded-2xl border hairline bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">User</th><th className="text-left">Country</th><th className="text-left">Mode</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3"><div className="font-medium">{r.username}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
                <td>{r.country_code ?? "—"}</td>
                <td className="uppercase text-xs">{r.account_mode}</td>
                <td className="text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${r.banned ? "bg-destructive/15 text-destructive" : r.suspended ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>{r.banned ? "Banned" : r.suspended ? "Suspended" : "Active"}</span></td>
                <td className="text-right p-3 space-x-1 whitespace-nowrap">
                  <select
                    defaultValue=""
                    onChange={(e) => { grantTier(r.id, e.target.value); e.currentTarget.value = ""; }}
                    className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                    title="Grant a tier (use only if PayPal failed but you confirmed payment)"
                  >
                    <option value="">Grant tier…</option>
                    {TIERS.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                  <button onClick={() => toggle(r.id, "suspended", !r.suspended)} className="text-xs rounded-lg border border-input px-2 py-1 hover:bg-accent">{r.suspended ? "Unsuspend" : "Suspend"}</button>
                  <button onClick={() => toggle(r.id, "banned", !r.banned)} className="text-xs rounded-lg border border-destructive/30 text-destructive px-2 py-1 hover:bg-destructive/10">{r.banned ? "Unban" : "Ban"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No users.</div>}
      </div>
    </div>
  );
}

export default Users;
