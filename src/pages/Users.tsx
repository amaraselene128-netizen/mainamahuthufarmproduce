import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { MessageSquare, Megaphone, Shield, X } from "lucide-react";

function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [msgTarget, setMsgTarget] = useState<null | { id?: string; username?: string; broadcast?: boolean }>(null);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    let query = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
    if (q) query = query.ilike("username", `%${q}%`);
    const [{ data }, rolesRes] = await Promise.all([
      query,
      db.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    setRows(data ?? []);
    setAdminIds(new Set(((rolesRes.data as any[]) ?? []).map((r) => r.user_id)));
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

  async function toggleAdmin(id: string, makeAdmin: boolean) {
    const { data, error } = await db.functions.invoke("admin-users", {
      body: { action: "set_admin", user_id: id, value: makeAdmin },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success(makeAdmin ? "Granted admin" : "Revoked admin"); load();
  }

  async function sendMessage() {
    if (!msgTarget || !msgBody.trim()) return;
    setSending(true);
    const payload = msgTarget.broadcast
      ? { target: "all", subject: msgSubject, body: msgBody }
      : { target: "user", user_id: msgTarget.id, subject: msgSubject, body: msgBody };
    const { data, error } = await db.functions.invoke("admin-notify", { body: payload });
    setSending(false);
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any).error);
    toast.success(msgTarget.broadcast ? `Broadcast sent to ${(data as any).sent} users` : "Message sent");
    setMsgTarget(null); setMsgSubject(""); setMsgBody("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username…" className="rounded-lg border border-input bg-card px-3 py-2 text-sm" />
          <button onClick={() => setMsgTarget({ broadcast: true })} className="inline-flex items-center gap-1.5 text-xs rounded-lg bg-primary text-primary-foreground px-3 py-2">
            <Megaphone className="size-3.5" /> Broadcast
          </button>
        </div>
      </div>
      <div className="rounded-2xl border hairline bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">User</th><th className="text-left">Country</th><th className="text-left">Mode</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium flex items-center gap-1.5">
                    {r.username}
                    {adminIds.has(r.id) && <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full"><Shield className="size-2.5" /> Admin</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td>{r.country_code ?? "—"}</td>
                <td className="uppercase text-xs">{r.account_mode}</td>
                <td className="text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${r.banned ? "bg-destructive/15 text-destructive" : r.suspended ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>{r.banned ? "Banned" : r.suspended ? "Suspended" : "Active"}</span></td>
                <td className="text-right p-3 space-x-1 whitespace-nowrap">
                  <button onClick={() => setMsgTarget({ id: r.id, username: r.username })} className="text-xs rounded-lg border border-input px-2 py-1 hover:bg-accent inline-flex items-center gap-1"><MessageSquare className="size-3" /> Message</button>
                  <button onClick={() => toggleAdmin(r.id, !adminIds.has(r.id))} className="text-xs rounded-lg border border-input px-2 py-1 hover:bg-accent">{adminIds.has(r.id) ? "Revoke admin" : "Make admin"}</button>
                  <button onClick={() => toggle(r.id, "suspended", !r.suspended)} className="text-xs rounded-lg border border-input px-2 py-1 hover:bg-accent">{r.suspended ? "Unsuspend" : "Suspend"}</button>
                  <button onClick={() => toggle(r.id, "banned", !r.banned)} className="text-xs rounded-lg border border-destructive/30 text-destructive px-2 py-1 hover:bg-destructive/10">{r.banned ? "Unban" : "Ban"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No users.</div>}
      </div>

      {msgTarget && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setMsgTarget(null)}>
          <div className="w-full max-w-md rounded-2xl border hairline bg-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{msgTarget.broadcast ? "Broadcast to all users" : `Message ${msgTarget.username}`}</h2>
              <button onClick={() => setMsgTarget(null)}><X className="size-4" /></button>
            </div>
            <input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Subject (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Type your message…" rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={sendMessage} disabled={sending || !msgBody.trim()} className="w-full rounded-lg bg-gradient-gold text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60">
              {sending ? "Sending…" : msgTarget.broadcast ? "Send to all users" : "Send message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
