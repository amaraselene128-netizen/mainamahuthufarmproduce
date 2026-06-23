// Lightweight device fingerprint — UA + screen + canvas hash.
// Not perfect; combined with server-side unique-completed-view index for fraud reduction.
export function deviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  const parts: string[] = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    navigator.hardwareConcurrency?.toString() ?? "",
  ];
  try {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 50;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("egratasks-fp", 2, 2);
      parts.push(c.toDataURL().slice(-64));
    }
  } catch {}
  let h = 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `fp_${Math.abs(h).toString(36)}_${s.length}`;
}
