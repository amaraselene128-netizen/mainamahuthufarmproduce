import { useEffect } from "react";

/**
 * Auto-detects YouTube / Facebook / Instagram / TikTok / X (Twitter) URLs
 * and renders the appropriate embedded player.
 *
 * Falls back to a plain link for unknown providers.
 */

type Props = { url: string; title?: string; className?: string };

function youtubeId(url: URL): string | null {
  if (/youtu\.be$/i.test(url.hostname)) return url.pathname.slice(1) || null;
  if (!/youtube\.com$/i.test(url.hostname.replace(/^www\./, ""))) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const m = url.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
  return m ? m[2] : null;
}

function detect(raw: string):
  | { kind: "youtube"; id: string }
  | { kind: "facebook"; url: string }
  | { kind: "instagram"; url: string }
  | { kind: "tiktok"; id: string; url: string }
  | { kind: "twitter"; url: string }
  | { kind: "unknown" } {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const yt = youtubeId(u);
    if (yt) return { kind: "youtube", id: yt };
    if (/(^|\.)facebook\.com$|fb\.watch$/.test(host)) return { kind: "facebook", url: raw };
    if (/(^|\.)instagram\.com$/.test(host)) return { kind: "instagram", url: raw };
    if (/(^|\.)tiktok\.com$/.test(host)) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return { kind: "tiktok", id: m?.[1] ?? "", url: raw };
    }
    if (/(^|\.)(twitter|x)\.com$/.test(host)) return { kind: "twitter", url: raw };
  } catch { /* not a URL */ }
  return { kind: "unknown" };
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) {
    // @ts-ignore — re-process if SDK already loaded
    if ((window as any).instgrm?.Embeds?.process) (window as any).instgrm.Embeds.process();
    if ((window as any).twttr?.widgets?.load) (window as any).twttr.widgets.load();
    return;
  }
  const s = document.createElement("script");
  s.id = id; s.src = src; s.async = true;
  document.body.appendChild(s);
}

export function SocialEmbed({ url, title = "Embedded video", className }: Props) {
  const info = detect(url);

  useEffect(() => {
    if (info.kind === "instagram") loadScript("https://www.instagram.com/embed.js", "ig-embed-sdk");
    if (info.kind === "tiktok") loadScript("https://www.tiktok.com/embed.js", "tt-embed-sdk");
    if (info.kind === "twitter") loadScript("https://platform.twitter.com/widgets.js", "tw-embed-sdk");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (info.kind === "youtube") {
    return (
      <div className={`relative aspect-video overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${info.id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (info.kind === "facebook") {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(info.url)}&show_text=false`;
    return (
      <div className={`relative aspect-video overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={src}
          title={title}
          loading="lazy"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (info.kind === "instagram") {
    return (
      <blockquote
        className={`instagram-media ${className ?? ""}`}
        data-instgrm-permalink={info.url}
        data-instgrm-version="14"
        style={{ background: "#000", margin: 0, maxWidth: "100%" }}
      />
    );
  }

  if (info.kind === "tiktok") {
    return (
      <blockquote
        className={`tiktok-embed ${className ?? ""}`}
        cite={info.url}
        data-video-id={info.id}
        style={{ maxWidth: "605px", minWidth: "260px" }}
      >
        <a href={info.url}>{info.url}</a>
      </blockquote>
    );
  }

  if (info.kind === "twitter") {
    return (
      <blockquote className={`twitter-tweet ${className ?? ""}`}>
        <a href={info.url}>{info.url}</a>
      </blockquote>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="text-primary hover:underline break-all text-sm"
    >
      {url}
    </a>
  );
}