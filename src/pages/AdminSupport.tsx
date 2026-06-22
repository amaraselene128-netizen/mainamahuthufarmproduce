import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Paperclip, ExternalLink, Send } from "lucide-react";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

type Att = { url: string; name: string };

function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await db.from("support_tickets")
      .select("*,profiles(username,email)")
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function open(id: string) {
    setActiveId(id);
    const { data } = await db.from("support_messages")
      .select("*").eq("ticket_id", id).order("created_at");
    setMessages(data ?? []);
  }

  async function send() {
    if (!user || !activeId) return;
    if (!reply.trim() && files.length === 0) return;
    setBusy(true);
    try {
      let atts: Att[] = [];
      if (files.length) {
        const ups = await uploadManyToCloudinary(files, { folder: "support" });
        atts = ups.map((u, i) => ({ url: u.secure_url, name: files[i]?.name ?? `file-${i}` }));
      }
      const { error } = await db.from("support_messages").insert({
        ticket_id: activeId, sender_id: user.id, body: reply || "(attachment)",
        is_admin: true, attachments: atts,
      });
      if (error) throw error;
      setReply(""); setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      open(activeId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send");
    } finally {
      setBusy(false);
    }
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
          {tickets.length === 0 && <div className="p-8 text-center text-muted-foreground">No tickets.</div>}
          {tickets.map((t) => (
            <button key={t.id} onClick={() => open(t.id)} className={`w-full text-left p-3 hover:bg-accent ${activeId === t.id ? "bg-accent" : ""}`}>
              <div className="flex justify-between">
                <span className="font-medium truncate">{t.subject}</span>
                <span className="text-xs text-muted-foreground">{t.status}</span>
              </div>
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
                  {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.attachments.map((a: Att, i: number) => (
                        <a key={i} href={a.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] rounded bg-background border border-input px-2 py-0.5 hover:bg-accent">
                          <ExternalLink className="size-3" /> {a.name ?? `file ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-3 border-t border-border">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <label className="inline-flex items-center cursor-pointer rounded-lg border border-input bg-background px-2 hover:bg-accent">
                  <Paperclip className="size-4" />
                  <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,application/pdf"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                </label>
                <button onClick={send} disabled={busy} className="rounded-lg bg-gradient-gold px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
                  <Send className="size-4" />
                </button>
              </div>
              {files.length > 0 && <div className="text-xs text-muted-foreground">{files.length} file(s) attached</div>}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default AdminSupport;
