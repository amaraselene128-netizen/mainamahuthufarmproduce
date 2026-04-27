import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, X, Volume2, VolumeX, Sparkles, PhoneOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, welcomeMessage, type ChatMsg } from "@/lib/sokoni-assistant/aiBrain";
import {
  isSpeechRecognitionSupported,
  speak,
  stopSpeaking,
} from "@/lib/sokoni-assistant/speech";
import { LiveSpeechSession } from "@/lib/sokoni-assistant/liveSession";
import {
  appendLocal,
  clearHistory,
  endConversation,
  loadHistory,
  persistMessage,
  type StoredMsg,
} from "@/lib/sokoni-assistant/persistence";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { AssistantMessage } from "./AssistantMessage";

const QUICK_PROMPTS = [
  "Show me around",
  "Find iPhones under 30k in Nairobi",
  "Analyze price for Toyota Vitz",
  "Open my favorites",
  "How do I open a shop?",
];

export function SokoniAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    return (meta.username || meta.full_name || (user?.email ? user.email.split("@")[0] : null)) ?? null;
  }, [user]);

  const [open, setOpen] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [partial, setPartial] = useState("");
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const sessionRef = useRef<LiveSpeechSession | null>(null);
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

  // Auto-scroll
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

      // Build conversation history (last 12 messages) for AI context
      const history: ChatMsg[] = messages
        .slice(-12)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }));
      history.push({ role: "user", content: userText });

      setPartial("Thinking…");
      let streamed = "";

      try {
        const result = await streamChat({
          messages: history,
          username,
          isLoggedIn: !!user,
          userId: user?.id ?? null,
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

        // Speak full reply once generation completes
        if (!muted && result.reply) {
          sessionRef.current?.pauseForSpeaking();
          speak(result.reply, {
            onEnd: () => sessionRef.current?.resumeAfterSpeaking(),
          });
        }

        const action = result.action;
        if (action?.external) {
          window.open(action.external, "_blank", "noopener,noreferrer");
        }
        if (action?.navigate) {
          setTimeout(() => navigate(action.navigate!), 700);
        }
        if (action?.endSession) {
          setTimeout(() => endLiveSession(), 1500);
        }
      } catch (err: any) {
        setPartial("");
        const errText = err?.message || "Something went wrong reaching the AI. Please try again.";
        pushMessage({ id: crypto.randomUUID(), role: "assistant", text: errText, ts: Date.now() });
        if (!muted) speak(errText);
      }
    },
    [messages, muted, navigate, pushMessage, user, username]
  );

  // ---- Live session control ----
  const startLiveSession = useCallback(async () => {
    if (!supported) {
      toast({
        variant: "destructive",
        title: "Voice not supported",
        description: "Try Chrome, Edge or Safari for live voice.",
      });
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({
        variant: "destructive",
        title: "Microphone blocked",
        description: "Please allow microphone access to talk to Sokoni Assistant.",
      });
      return;
    }
    if (sessionRef.current) sessionRef.current.stop();
    const session = new LiveSpeechSession({
      onPartial: (t) => setPartial(t),
      onFinal: (t) => {
        setPartial("");
        if (t) reply(t);
      },
      onListeningChange: setListening,
      onError: (err) => {
        if (err && err !== "no-speech") {
          toast({ variant: "destructive", title: "Voice error", description: err });
        }
      },
    });
    sessionRef.current = session;
    session.start();
    setLiveOn(true);
  }, [reply, supported]);

  const endLiveSession = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setLiveOn(false);
    setListening(false);
    setPartial("");
    stopSpeaking();
    if (userIdRef.current) endConversation(userIdRef.current);
  }, []);

  // Stop everything when panel closes
  useEffect(() => {
    if (!open) {
      endLiveSession();
    }
  }, [open, endLiveSession]);

  // Cleanup on unmount
  useEffect(() => () => { sessionRef.current?.stop(); stopSpeaking(); }, []);

  const toggleMute = () => {
    if (!muted) stopSpeaking();
    setMuted((m) => !m);
  };

  const handleClearHistory = () => {
    if (user) clearHistory(user.id);
    setMessages([]);
    const w: StoredMsg = { id: crypto.randomUUID(), role: "assistant", text: welcomeMessage({ username, isLoggedIn: !!user }), ts: Date.now() };
    setMessages([w]);
  };

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
                {liveOn && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Sokoni Beast 🦁</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {liveOn
                    ? listening ? "On the hunt • Listening…" : "Live • Paused"
                    : muted ? "Voice muted" : "Tap mic for live mode, or type below"}
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
                <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm bg-primary/40 text-primary-foreground italic">
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

          {/* Mic / Live control */}
          <div className="p-4 border-t flex items-center justify-center gap-3">
            {!liveOn ? (
              <button
                onClick={startLiveSession}
                aria-label="Start live voice session"
                className={cn(
                  "h-14 px-6 rounded-full flex items-center gap-2 transition-all",
                  "bg-primary text-primary-foreground hover:scale-105 ring-4 ring-primary/20"
                )}
              >
                <Mic className="h-5 w-5" />
                <span className="text-sm font-medium">Start live session</span>
              </button>
            ) : (
              <>
                <div className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center",
                  listening ? "bg-primary/15 ring-4 ring-primary/30" : "bg-muted ring-4 ring-muted-foreground/10"
                )}>
                  {listening ? (
                    <Mic className="h-6 w-6 text-primary" />
                  ) : (
                    <MicOff className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={endLiveSession}
                  aria-label="End session"
                  className="h-12 px-5 rounded-full bg-destructive text-destructive-foreground flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="text-sm font-medium">End session</span>
                </button>
              </>
            )}
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
