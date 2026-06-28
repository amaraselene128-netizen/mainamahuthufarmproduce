import { useEffect, useRef, useState } from "react";
import { Play, EyeOff, ExternalLink } from "lucide-react";
import { SocialEmbed } from "@/components/media/SocialEmbed";

/**
 * Returns true if the URL points to a directly-playable video file
 * (Cloudinary upload, .mp4/.webm/.mov/.m4v, or a blob/data URL). Everything
 * else (YouTube, Facebook, Instagram, TikTok, X …) is treated as a social
 * embed and rendered inside the appropriate iframe.
 */
function isDirectVideo(url: string): boolean {
  if (!url) return false;
  if (/^(blob:|data:video\/)/i.test(url)) return true;
  try {
    const u = new URL(url);
    if (/(^|\.)res\.cloudinary\.com$/i.test(u.hostname)) return true;
    if (/\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(u.pathname)) return true;
  } catch { /* not a URL */ }
  return false;
}

type Props = {
  videoUrl: string;
  durationSeconds: number;
  onCompleted: () => void;
  onAborted?: (reason: string) => void;
  /** When provided, the video itself becomes clickable (after it starts) and behaves like the CTA button. */
  destinationUrl?: string;
  onCtaClick?: () => void;
};

/**
 * Rewarded-video player:
 *  - No controls, no seek bar.
 *  - Countdown overlay only (e.g. "28s").
 *  - Pauses if tab/window loses focus → invalidates reward.
 *  - Blocks any seek attempt (rewind allowed only forward by playback).
 *  - Fires onCompleted when full duration was watched contiguously while visible.
 */
export function AdPlayer({ videoUrl, durationSeconds, onCompleted, onAborted, destinationUrl, onCtaClick }: Props) {
  const embedded = !isDirectVideo(videoUrl);
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
      if (document.hidden) {
        v?.pause();
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

  // Wall-clock countdown used for embedded (YouTube/FB/IG/TikTok/X) players,
  // where we can't read playback progress through the iframe. The viewer must
  // keep the tab visible for `durationSeconds` after pressing Start.
  useEffect(() => {
    if (!embedded || !started || done) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      watchedRef.current += 1;
      const left = Math.max(0, durationSeconds - Math.floor(watchedRef.current));
      setRemaining(left);
      if (left <= 0) {
        setDone(true);
        onCompleted();
        window.clearInterval(id);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [embedded, started, done, durationSeconds, onCompleted]);

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
    setStarted(true);
    setHiddenWarning(false);
    if (embedded) return;
    const v = vidRef.current;
    if (!v) return;
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
      {embedded ? (
        started ? (
          <div className="absolute inset-0">
            <SocialEmbed url={videoUrl} className="w-full h-full" />
          </div>
        ) : null
      ) : (
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
      )}

      {/* Countdown overlay — replaces native controls entirely */}
      {started && !done && (
        <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/70 text-white text-sm font-mono px-3 py-1.5 tabular-nums">
          {remaining}s
        </div>
      )}

      {/* Pre-start tap-to-play overlay */}
      {!started && (
        <div
          className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/40 to-black/70 cursor-pointer"
          onClick={start}
        >
          <div className="text-center text-white">
            <div className="mx-auto size-16 rounded-full bg-white/10 grid place-items-center backdrop-blur">
              <Play className="size-7" />
            </div>
            <div className="mt-3 text-sm">Tap to start · {durationSeconds}s ad</div>
            <div className="text-xs text-white/60 mt-1">Watch fully to earn credit</div>
          </div>
        </div>
      )}

      {/* After start: direct videos are clickable and act like the CTA button.
          For embedded videos, do not cover the iframe or users cannot press play. */}
      {started && destinationUrl && onCtaClick && !done && !embedded && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCtaClick(); }}
          className="absolute inset-0 grid place-items-end p-3 bg-transparent cursor-pointer group"
          aria-label="Open advertiser destination"
        >
          <span className="opacity-0 group-hover:opacity-100 transition rounded-full bg-black/70 text-white text-[10px] px-2 py-1 inline-flex items-center gap-1">
            <ExternalLink className="size-3" /> Tap video to open
          </span>
        </button>
      )}

      {started && destinationUrl && onCtaClick && !done && embedded && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCtaClick(); }}
          className="absolute bottom-3 right-3 rounded-full bg-black/75 text-white text-[11px] px-3 py-1.5 inline-flex items-center gap-1 hover:bg-black/90 transition"
          aria-label="Open advertiser destination"
        >
          <ExternalLink className="size-3" /> Open link
        </button>
      )}

      {hiddenWarning && !done && (
        <div className="absolute inset-x-0 bottom-0 bg-destructive/90 text-destructive-foreground text-xs text-center py-2 inline-flex items-center justify-center gap-2">
          <EyeOff className="size-3.5" /> Paused — keep this tab visible to earn the reward
        </div>
      )}
    </div>
  );
}
