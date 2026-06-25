import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

type Tier = "bronze" | "silver" | "gold";

type Row = {
  id: string;
  user_id: string;
  username: string | null;
  email: string;
  country_code: string | null;
  account_type: string;
  is_suspended: boolean;
  is_banned: boolean;
  active_tier?: Tier | null;
};

function Users() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    // Pull profiles
    let query = db.from("profiles").select("*").limit(200);
    if (q) query = query.ilike("username", `%${q}%`);
    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    const profiles = (data ?? []) as any[];

    // Pull active subscriptions to compute current tier
    const userIds = profiles.map((p) => p.user_id ?? p.id);
    let tierMap = new Map<string, Tier>();
    if (userIds.length) {
      const { data: subs } = await db
        .from("referral_subscriptions")
        .select("user_id, referral_plans(tier)")
        .in("user_id", userIds);
      for (const s of (subs as any[]) ?? []) {
        const t = s?.referral_plans?.tier as Tier | undefined;
        if (t) tierMap.set(s.user_id, t);
      }
    }

    setRows(
      profiles.map((p) => ({
        id: p.id,
        user_id: p.user_id ?? p.id,
        username: p.username,
        email: p.email,
        country_code: p.country_code,
        account_type: p.account_type,
        is_suspended: !!p.is_suspended,
        is_banned: !!p.is_banned,
        active_tier: tierMap.get(p.user_id ?? p.id) ?? null,
      })),
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggle(userId: string, field: "is_suspended" | "is_banned", value: boolean) {
    const action = field === "is_suspended" ? "set_suspended" : "set_banned";
    const { data, error } = await db.functions.invoke("admin-users", {
      body: { action, user_id: userId, value },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success("Updated");
    load();
  }

  async function grantTier(userId: string, tier: Tier | "") {
    if (!tier) return;
    const { data, error } = await db.functions.invoke("admin-users", {
      body: { action: "grant_tier", user_id: userId, tier },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success(`${tier.toUpperCase()} tier granted`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username…"
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="rounded-2xl border hairline bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left">Country</th>
              <th className="text-left">Mode</th>
              <th className="text-center">Tier</th>
              <th className="text-center">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{r.username ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td>{r.country_code ?? "—"}</td>
                <td className="uppercase text-xs">{r.account_type}</td>
                <td className="text-center text-xs uppercase font-semibold">
                  {r.active_tier ?? "—"}
                </td>
                <td className="text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.is_banned
                        ? "bg-destructive/15 text-destructive"
                        : r.is_suspended
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary/15 text-secondary"
                    }`}
                  >
                    {r.is_banned ? "Banned" : r.is_suspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="text-right p-3 space-x-1 whitespace-nowrap">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value as Tier | "";
                      grantTier(r.user_id, v);
                      e.currentTarget.value = "";
                    }}
                    className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                  >
                    <option value="">Grant tier…</option>
                    <option value="bronze">Bronze ($5)</option>
                    <option value="silver">Silver ($100)</option>
                    <option value="gold">Gold ($1000)</option>
                  </select>
                  <button
                    onClick={() => toggle(r.user_id, "is_suspended", !r.is_suspended)}
                    className="text-xs rounded-lg border border-input px-2 py-1 hover:bg-accent"
                  >
                    {r.is_suspended ? "Unsuspend" : "Suspend"}
                  </button>
                  <button
                    onClick={() => toggle(r.user_id, "is_banned", !r.is_banned)}
                    className="text-xs rounded-lg border border-destructive/30 text-destructive px-2 py-1 hover:bg-destructive/10"
                  >
                    {r.is_banned ? "Unban" : "Ban"}
                  </button>
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
