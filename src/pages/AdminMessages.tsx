import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Send, Megaphone, Search } from "lucide-react";

type Prof = { id: string; username: string; email: string };

function AdminMessages() {
  const [users, setUsers] = useState<Prof[]>([]);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Prof | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  // Broadcast composer
  const [bcTitle, setBcTitle] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [bcBusy, setBcBusy] = useState(false);

  async function search() {
    let query = db.from("profiles").select("id,username,email").order("username").limit(40);
    if (q.trim()) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await query;
    setUsers((data as any) ?? []);
  }
  useEffect(() => { search(); }, [q]);

  async function send() {
    if (!target) return toast.error("Pick a user");
    if (!title.trim() || !body.trim()) return toast.error("Title and body required");
    setBusy(true);
    const { error } = await db.rpc("admin_notify_user" as any, {
      _user: target.id, _title: title.trim(), _body: body.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Notification sent to ${target.username}`);
    setTitle(""); setBody("");
  }

  async function broadcast() {
    if (!bcTitle.trim() || !bcBody.trim()) return toast.error("Title and body required");
    if (!confirm("Send this notification to every active user?")) return;
    setBcBusy(true);
    const { data, error } = await db.rpc("admin_broadcast_notification" as any, {
      _title: bcTitle.trim(), _body: bcBody.trim(),
    });
    setBcBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Broadcast sent to ${data ?? 0} users`);
    setBcTitle(""); setBcBody("");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
        <Send className="size-7 text-primary" /> Direct messages & notifications
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
          <h2 className="font-display text-lg font-semibold">Send to a single user</h2>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or email…"
              className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="max-h-44 overflow-y-auto divide-y divide-border rounded-lg border border-input">
            {users.map((u) => (
              <button key={u.id} onClick={() => setTarget(u)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${target?.id === u.id ? "bg-accent" : ""}`}>
                <div className="font-medium">{u.username}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </button>
            ))}
            {users.length === 0 && <div className="p-3 text-xs text-muted-foreground">No matches.</div>}
          </div>
          {target && <div className="text-xs">Selected: <b>{target.username}</b></div>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={busy} onClick={send}
            className="w-full rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? "Sending…" : "Send notification"}
          </button>
        </div>

        <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Megaphone className="size-5 text-primary" /> Broadcast to everyone
          </h2>
          <input value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="Title"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <textarea value={bcBody} onChange={(e) => setBcBody(e.target.value)} placeholder="Announcement body" rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={bcBusy} onClick={broadcast}
            className="w-full rounded-xl bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {bcBusy ? "Sending…" : "Broadcast to all active users"}
          </button>
          <p className="text-xs text-muted-foreground">
            Skips suspended / banned accounts. Notifications appear in each user's bell + Notifications page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminMessages;
