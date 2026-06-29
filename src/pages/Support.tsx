import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Headphones, Plus, Send, Paperclip, Download } from "lucide-react";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

type Att = { url: string; name: string };

// Helper function to download files instantly
const downloadFile = async (url: string, fileName: string) => {
  try {
    // If it's a Cloudinary URL, add the attachment flag for instant download
    if (url.includes('cloudinary.com')) {
      const downloadUrl = `${url}?fl_attachment=true&filename=${encodeURIComponent(fileName)}`;
      // Open in new tab to trigger download
      window.open(downloadUrl, '_blank');
    } else {
      // For other URLs, fetch and download
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download file');
  }
};

function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const replyInput = useRef<HTMLInputElement>(null);

  async function load() {
    if (!user) return;
    const { data } = await db.from("support_tickets")
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
  }
  useEffect(() => { load(); }, [user]);

  async function openTicket(id: string) {
    setActiveId(id);
    const { data } = await db.from("support_messages").select("*").eq("ticket_id", id).order("created_at");
    setMessages(data ?? []);
  }

  async function uploadAttachments(files: File[]): Promise<Att[]> {
    if (!files.length) return [];
    const ups = await uploadManyToCloudinary(files, { folder: "support" });
    return ups.map((u, i) => ({ url: u.secure_url, name: files[i]?.name ?? `file-${i}` }));
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const atts = await uploadAttachments(newFiles);
      const { data: t, error } = await db.from("support_tickets")
        .insert({ user_id: user.id, subject, category }).select("id").single();
      if (error) throw error;
      const { error: mErr } = await db.from("support_messages")
        .insert({ ticket_id: t.id, sender_id: user.id, body, attachments: atts });
      if (mErr) throw mErr;
      setShowNew(false); setSubject(""); setBody(""); setNewFiles([]);
      toast.success("Ticket created");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!user || !activeId) return;
    if (!reply.trim() && replyFiles.length === 0) return;
    setBusy(true);
    try {
      const atts = await uploadAttachments(replyFiles);
      const { error } = await db.from("support_messages")
        .insert({ ticket_id: activeId, sender_id: user.id, body: reply || "(attachment)", attachments: atts });
      if (error) throw error;
      setReply(""); setReplyFiles([]);
      openTicket(activeId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  // Helper to render attachments with download functionality
  const renderAttachments = (attachments: Att[]) => {
    if (!Array.isArray(attachments) || attachments.length === 0) return null;
    
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {attachments.map((a: Att, i: number) => {
          const fileName = a.name || `file-${i + 1}`;
          return (
            <button
              key={i}
              onClick={() => downloadFile(a.url, fileName)}
              className="inline-flex items-center gap-1 text-[11px] rounded bg-background border border-input px-2 py-0.5 hover:bg-accent transition-colors"
              title={`Download ${fileName}`}
            >
              <Download className="size-3" /> {fileName}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Headphones className="size-7 text-primary" /> Help Center
        </h1>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow">
          <Plus className="size-4" /> New ticket
        </button>
      </div>

      {showNew && (
        <form onSubmit={createTicket} className="rounded-2xl border hairline bg-card p-6 space-y-3">
          <input 
            required 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Subject" 
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" 
          />
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="general">General</option>
            <option value="payments">Payments</option>
            <option value="tasks">Tasks</option>
            <option value="account">Account</option>
          </select>
          <textarea 
            required 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            rows={4} 
            placeholder="Describe the issue…" 
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" 
          />
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-input bg-background px-3 py-2 hover:bg-accent transition-colors">
              <Paperclip className="size-4" /> Attach screenshots / files
              <input
                type="file" 
                multiple 
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            {newFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">{newFiles.length} file(s) selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={busy} 
              className="rounded-xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit"}
            </button>
            <button 
              type="button" 
              onClick={() => setShowNew(false)} 
              className="rounded-xl border border-input px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="rounded-2xl border hairline bg-card divide-y divide-border">
          {tickets.length === 0 && <div className="p-8 text-center text-muted-foreground">No tickets yet.</div>}
          {tickets.map((t) => (
            <button 
              key={t.id} 
              onClick={() => openTicket(t.id)} 
              className={`w-full text-left p-4 hover:bg-accent transition-colors ${activeId === t.id ? "bg-accent" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{t.subject}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
                  {t.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString()}</div>
            </button>
          ))}
        </div>
        
        <div className="rounded-2xl border hairline bg-card p-6 min-h-[300px]">
          {!activeId ? (
            <div className="text-muted-foreground text-center py-10">Select a ticket to view conversation</div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`rounded-xl p-3 max-w-md text-sm ${m.is_admin ? "bg-secondary/10 border border-secondary/20" : "bg-muted ml-auto"}`}>
                  <div className="text-[10px] uppercase tracking-wider mb-1 text-muted-foreground">
                    {m.is_admin ? "Admin" : "You"} · {new Date(m.created_at).toLocaleString()}
                  </div>
                  {m.body}
                  {renderAttachments(m.attachments)}
                </div>
              ))}
              
              <div className="flex gap-2 pt-3 border-t border-border">
                <input 
                  value={reply} 
                  onChange={(e) => setReply(e.target.value)} 
                  placeholder="Reply…" 
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <label className="inline-flex items-center cursor-pointer rounded-lg border border-input bg-background px-2 hover:bg-accent transition-colors">
                  <Paperclip className="size-4" />
                  <input 
                    ref={replyInput} 
                    type="file" 
                    multiple 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setReplyFiles(Array.from(e.target.files ?? []))} 
                  />
                </label>
                <button 
                  onClick={send} 
                  disabled={busy} 
                  className="rounded-lg bg-gradient-gold px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
                >
                  <Send className="size-4" />
                </button>
              </div>
              {replyFiles.length > 0 && (
                <div className="text-xs text-muted-foreground">{replyFiles.length} file(s) attached</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Support;
