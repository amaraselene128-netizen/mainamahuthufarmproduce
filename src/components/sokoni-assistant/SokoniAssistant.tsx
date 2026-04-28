import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, X, Volume2, VolumeX, Sparkles, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, welcomeMessage, type ChatMsg } from "@/lib/sokoni-assistant/aiBrain";
import {
  isSpeechRecognitionSupported,
  createRecognizer,
  speak,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/sokoni-assistant/speech";
import {
  appendLocal,
  clearHistory,
  loadHistory,
  persistMessage,
  type StoredMsg,
} from "@/lib/sokoni-assistant/persistence";
import type { FlowState } from "@/lib/sokoni-assistant/conversation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { AssistantMessage } from "./AssistantMessage";

const QUICK_PROMPTS = [
  "Show me around",
  "What is Fun Circle?",
  "How do I open a shop?",
  "Find dining sets in Nairobi",
  "Open my favorites",
];

export function SokoniAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    return (meta.username || meta.full_name || (user?.email ? user.email.split("@")[0] : null)) ?? null;
  }, [user]);

  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [partial, setPartial] = useState("");
  const [typed, setTyped] = useState("");
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supported = isSpeechRecognitionSupported();
  const userIdRef = useRef<string | null>(null);

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
      if (!muted) speak(welcome.text);
    }
    userIdRef.current = user?.id ?? null;
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

  const reply = useCallback(
    async (userText: string) => {
      const userMsg: StoredMsg = {
        id: crypto.randomUUID(),
        role: "user",
        text: userText,
        ts: Date.now(),
      };
      pushMessage(userMsg);

      const history: ChatMsg[] = messages
        .slice(-12)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }));
      history.push({ role: "user", content: userText });

      setPartial("Thinking…");
      setThinking(true);
      let streamed = "";

      try {
        const result = await streamChat({
          messages: history,
          username,
          isLoggedIn: !!user,
          userId: user?.id ?? null,
          flowState,
          onDelta: (chunk) => {
            streamed += chunk;
            setPartial(streamed);
          },
        });

        setPartial("");
        setThinking(false);
        const botMsg: StoredMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.reply,
          ts: Date.now(),
        };
        pushMessage(botMsg);
        setFlowState(result.flowState ?? null);

        if (!muted && result.reply) speak(result.reply);

        const action = result.action;
        if (action?.external) window.open(action.external, "_blank", "noopener,noreferrer");
        if (action?.navigate) setTimeout(() => navigate(action.navigate!), 700);
        if (action?.endSession) setTimeout(() => setOpen(false), 1500);
      } catch (err: any) {
        setPartial("");
        setThinking(false);
        const errText = err?.message || "Something went wrong. Please try again.";
        pushMessage({ id: crypto.randomUUID(), role: "assistant", text: errText, ts: Date.now() });
        if (!muted) speak(errText);
      }
    },
    [messages, muted, navigate, pushMessage, user, username, flowState]
  );

  // ── Press-to-talk mic ──
  const startRecording = useCallback(async () => {
    if (!supported) {
      toast({ variant: "destructive", title: "Voice not supported", description: "Try Chrome, Edge or Safari." });
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({ variant: "destructive", title: "Microphone blocked", description: "Allow microphone access to use voice." });
      return;
    }
    stopSpeaking();
    const rec = createRecognizer("en-US");
    if (!rec) return;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setPartial((finalText + " " + interim).trim());
    };
    rec.onerror = () => { setRecording(false); };
    rec.onend = () => {
      setRecording(false);
      const t = (finalText || "").trim();
      setPartial("");
      if (t) reply(t);
    };
    recRef.current = rec;
    setRecording(true);
    try { rec.start(); } catch { /* already started */ }
  }, [reply, supported]);

  const stopRecording = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const toggleMic = useCallback(() => {
    if (recording) stopRecording();
    else startRecording();
  }, [recording, startRecording, stopRecording]);

  // Cleanup
  useEffect(() => {
    if (!open) {
      try { recRef.current?.stop(); } catch { /* ignore */ }
      stopSpeaking();
      setRecording(false);
      setPartial("");
    }
  }, [open]);
  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* ignore */ } stopSpeaking(); }, []);

  const toggleMute = () => {
    if (!muted) stopSpeaking();
    setMuted((m) => !m);
  };

  const handleClearHistory = () => {
    if (user) clearHistory(user.id);
    setFlowState(null);
    const w: StoredMsg = { id: crypto.randomUUID(), role: "assistant", text: welcomeMessage({ username, isLoggedIn: !!user }), ts: Date.now() };
    setMessages([w]);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Sokoni Arena assistant"
          className={cn(
            "fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full",
            "bg-primary text-primary-foreground shadow-2xl",
            "flex items-center justify-center hover:scale-105 transition-transform",
            "ring-4 ring-primary/20"
          )}
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">Sokoni Arena assistant</span>
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
          aria-label="Sokoni Arena assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
                {recording && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Sokoni Arena</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {recording ? "Listening — tap mic to stop" : thinking ? "Thinking…" : muted ? "Voice muted" : "Type or tap the mic"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute} aria-label={muted ? "Unmute voice" : "Mute voice"}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
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
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm bg-primary/30 text-foreground italic">
                  {partial}…
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 border-t flex gap-2 overflow-x-auto">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => reply(q)}
                className="shrink-0 text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = typed.trim();
                if (!t) return;
                setTyped("");
                reply(t);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleMic}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0",
                  recording
                    ? "bg-red-500 text-white ring-4 ring-red-500/30 animate-pulse"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Ask Sokoni Arena anything…"
                className="flex-1 h-10 rounded-full border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button type="submit" size="sm" className="h-10 rounded-full px-4" disabled={thinking}>
                {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </form>
          </div>

          {!supported && (
            <p className="px-4 pb-3 text-[11px] text-center text-muted-foreground">
              Voice input isn't supported in this browser. Use Chrome, Edge or Safari.
            </p>
          )}
        </div>
      )}
    </>
  );
}
