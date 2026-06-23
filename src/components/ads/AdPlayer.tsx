import { useEffect, useRef, useState } from "react";
import { Play, EyeOff } from "lucide-react";

type Props = {
  videoUrl: string;
  durationSeconds: number;
  onCompleted: () => void;
  onAborted?: (reason: string) => void;
};

/**
 * Rewarded-video player:
 *  - No controls, no seek bar.
 *  - Countdown overlay only (e.g. "28s").
 *  - Pauses if tab/window loses focus → invalidates reward.
 *  - Blocks any seek attempt (rewind allowed only forward by playback).
 *  - Fires onCompleted when full duration was watched contiguously while visible.
 */
export function AdPlayer({ videoUrl, durationSeconds, onCompleted, onAborted }: Props) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const watchedRef = useRef(0); // accumulated seconds watched while visible
  const lastTickRef = useRef<number | null>(null);

  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [hiddenWarning, setHiddenWarning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onVis = () => {
      const v = vidRef.current;
      if (!v) return;
      if (document.hidden) {
        v.pause();
        setHiddenWarning(true);
        lastTickRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onVis);
    };
  }, []);

  function handleSeeking() {
    const v = vidRef.current;
    if (!v) return;
    // Always snap back to the highest legitimately reached point.
    if (Math.abs(v.currentTime - lastTimeRef.current) > 0.5) {
      v.currentTime = lastTimeRef.current;
    }
  }

  function handleTimeUpdate() {
    const v = vidRef.current;
    if (!v || document.hidden) return;
    // Accumulate watched seconds based on real elapsed wall-clock.
    const now = performance.now();
    if (lastTickRef.current != null) {
      const dt = (now - lastTickRef.current) / 1000;
      if (dt > 0 && dt < 2) watchedRef.current += dt;
    }
    lastTickRef.current = now;
    // Forward-only progress.
    if (v.currentTime > lastTimeRef.current) lastTimeRef.current = v.currentTime;
    setRemaining(Math.max(0, Math.ceil(durationSeconds - watchedRef.current)));
  }

  function handleEnded() {
    if (done) return;
    if (watchedRef.current + 0.5 >= durationSeconds) {
      setDone(true);
      onCompleted();
    } else {
      onAborted?.("incomplete");
    }
  }

  async function start() {
    const v = vidRef.current;
    if (!v) return;
    setStarted(true);
    setHiddenWarning(false);
    try {
      v.muted = false;
      await v.play();
    } catch {
      // Autoplay blocked — fall back to muted.
      v.muted = true;
      try { await v.play(); } catch {}
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border hairline bg-black aspect-video">
      <video
        ref={vidRef}
        src={videoUrl}
        className="w-full h-full object-contain bg-black"
        playsInline
        controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Countdown overlay — replaces native controls entirely */}
      {started && !done && (
        <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/70 text-white text-sm font-mono px-3 py-1.5 tabular-nums">
          {remaining}s
        </div>
      )}

      {/* Block any native control surface */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: started ? "none" : "auto" }}
        onClick={started ? undefined : start}
      >
        {!started && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/40 to-black/70 cursor-pointer">
            <div className="text-center text-white">
              <div className="mx-auto size-16 rounded-full bg-white/10 grid place-items-center backdrop-blur">
                <Play className="size-7" />
              </div>
              <div className="mt-3 text-sm">Tap to start · {durationSeconds}s ad</div>
              <div className="text-xs text-white/60 mt-1">Watch fully to earn credit</div>
            </div>
          </div>
        )}
      </div>

      {hiddenWarning && !done && (
        <div className="absolute inset-x-0 bottom-0 bg-destructive/90 text-destructive-foreground text-xs text-center py-2 inline-flex items-center justify-center gap-2">
          <EyeOff className="size-3.5" /> Paused — keep this tab visible to earn the reward
        </div>
      )}
    </div>
  );
}
