import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, X, Sparkles, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, welcomeMessage, type ChatMsg } from "@/lib/sokoni-assistant/aiBrain";
import {
  appendLocal,
  clearHistory,
  loadHistory,
  persistMessage,
  type StoredMsg,
} from "@/lib/sokoni-assistant/persistence";
import { useAuth } from "@/contexts/AuthContext";
import { AssistantMessage } from "./AssistantMessage";

const QUICK_PROMPTS = [
  "How do I post a listing?",
  "How do I open a shop?",
  "How do I contact a seller?",
  "How do I reset my password?",
  "How do I promote my shop?",
  "Find iPhones under 30k in Nairobi",
];

export function SokoniAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    return (meta.username || meta.full_name || (user?.email ? user.email.split("@")[0] : null)) ?? null;
  }, [user]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [partial, setPartial] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Welcome + load history on open
  useEffect(() => {
    if (!open) return;
    const ctx = { username, isLoggedIn: !!user };
    const saved = user ? loadHistory(user.id) : [];
    if (saved.length) {
      setMessages(saved);
    } else {
      const welcome: StoredMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: welcomeMessage(ctx),
        ts: Date.now(),
      };
      setMessages([welcome]);
    }
    userIdRef.current = user?.id ?? null;
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, user, username]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partial]);

  const pushMessage = useCallback((m: StoredMsg) => {
    setMessages((prev) => [...prev, m]);
    const uid = userIdRef.current;
    if (uid) {
      appendLocal(uid, m);
      persistMessage(uid, m.role, m.text);
    }
  }, []);

  const send = useCallback(
    async (userText: string) => {
      const text = userText.trim();
      if (!text || busy) return;

      const userMsg: StoredMsg = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        ts: Date.now(),
      };
      pushMessage(userMsg);
      setInput("");
      setBusy(true);

      // Build conversation history (last 10 messages for speed)
      const history: ChatMsg[] = messages
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }));
      history.push({ role: "user", content: text });

      setPartial("…");
      let streamed = "";
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const result = await streamChat({
          messages: history,
          username,
          isLoggedIn: !!user,
          signal: ctrl.signal,
          onDelta: (chunk) => {
            streamed += chunk;
            setPartial(streamed);
          },
        });

        setPartial("");
        const botMsg: StoredMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.reply,
          ts: Date.now(),
        };
        pushMessage(botMsg);

        if (result.action?.type === "navigate") {
          setTimeout(() => navigate((result.action as any).path), 500);
        } else if (result.action?.type === "search") {
          setTimeout(() => navigate(`/search?q=${encodeURIComponent((result.action as any).query)}`), 500);
        }
      } catch (err: any) {
        setPartial("");
        if (err?.name !== "AbortError") {
          const errText = err?.message || "Something went wrong. Please try again.";
          pushMessage({ id: crypto.randomUUID(), role: "assistant", text: errText, ts: Date.now() });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [busy, messages, navigate, pushMessage, user, username]
  );

  const handleClearHistory = () => {
    if (user) clearHistory(user.id);
    const w: StoredMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: welcomeMessage({ username, isLoggedIn: !!user }),
      ts: Date.now(),
    };
    setMessages([w]);
  };

  // Cleanup abort on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Sokoni Assistant"
          className={cn(
            "fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full",
            "bg-primary text-primary-foreground shadow-2xl",
            "flex items-center justify-center hover:scale-105 transition-transform",
            "ring-4 ring-primary/20"
          )}
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">Sokoni Assistant</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary-foreground ring-2 ring-background animate-pulse" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[60] w-[min(380px,calc(100vw-2rem))]",
            "h-[min(620px,calc(100vh-3rem))]",
            "bg-background border border-border rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden"
          )}
          role="dialog"
          aria-label="Sokoni Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Sokoni Assistant</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Ask me anything about SokoniArena
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearHistory} aria-label="Clear conversation">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => <AssistantMessage key={m.id} m={m} />)}
            {partial && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-muted text-foreground">
                  {partial === "…" ? (
                    <span className="inline-flex gap-1 items-center text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                    </span>
                  ) : partial}
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t flex gap-2 overflow-x-auto">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={busy}
                  className="shrink-0 text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how to do anything…"
              disabled={busy}
              className="flex-1 h-10 px-3 rounded-full border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0",
                "bg-primary text-primary-foreground hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
