import import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");

  async function load() {
    const { data } = await db.from("support_tickets").select("*,profiles(username,email)").order("created_at", { ascending: false });
    setTickets(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function open(id: string) {
    setActiveId(id);
    const { data } = await db.from("support_messages").select("*").eq("ticket_id", id).order("created_at");
    setMessages(data ?? []);
  }
  async function send() {
    if (!user || !activeId || !reply.trim()) return;
    await db.from("support_messages").insert({ ticket_id: activeId, sender_id: user.id, body: reply, is_admin: true });
    setReply(""); open(activeId);
  }
  async function setStatus(id: string, status: string) {
    const { error } = await db.from("support_tickets").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Support tickets</h1>
      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="rounded-2xl border hairline bg-card divide-y divide-border max-h-[70vh] overflow-auto">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => open(t.id)} className={`w-full text-left p-3 hover:bg-accent ${activeId === t.id ? "bg-accent" : ""}`}>
              <div className="flex justify-between"><span className="font-medium truncate">{t.subject}</span><span className="text-xs text-muted-foreground">{t.status}</span></div>
              <div className="text-xs text-muted-foreground">{t.profiles?.username} · {new Date(t.created_at).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border hairline bg-card p-6 min-h-[400px]">
          {!activeId ? <div className="text-muted-foreground text-center py-10">Select a ticket</div> :
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setStatus(activeId, "pending")} className="text-xs rounded-lg border border-input px-2 py-1">Pending</button>
                <button onClick={() => setStatus(activeId, "resolved")} className="text-xs rounded-lg bg-secondary text-secondary-foreground px-2 py-1">Resolve</button>
                <button onClick={() => setStatus(activeId, "closed")} className="text-xs rounded-lg border border-input px-2 py-1">Close</button>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={`rounded-xl p-3 max-w-md text-sm ${m.is_admin ? "bg-secondary/10 ml-auto" : "bg-muted"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{m.is_admin ? "You (Admin)" : "User"} · {new Date(m.created_at).toLocaleString()}</div>
                  {m.body}
                </div>
              ))}
              <div className="flex gap-2 pt-3 border-t border-border">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <button onClick={send} className="rounded-lg bg-gradient-gold px-4 py-2 text-sm text-primary-foreground">Send</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default AdminSupport;
