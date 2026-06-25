/**
 * Force-download helper.
 *
 * Cloudinary serves uploads inline by default — clicking the URL opens
 * the asset in a new tab instead of downloading it. Adding the
 * `fl_attachment` flag to the delivery URL makes Cloudinary respond with
 * `Content-Disposition: attachment`, so the browser triggers a save.
 *
 * For non-Cloudinary URLs we fall back to fetching the blob and saving it
 * via a temporary anchor, which works for same-origin / CORS-enabled hosts.
 */

function withCloudinaryAttachment(url: string, filename?: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)res\.cloudinary\.com$/i.test(u.hostname)) return null;
    // Path looks like /<cloud>/<resource_type>/upload/<...rest>
    const marker = "/upload/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const safe = filename
      ? filename.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60)
      : "";
    const flag = safe ? `fl_attachment:${safe}` : "fl_attachment";
    u.pathname =
      u.pathname.slice(0, idx + marker.length) +
      flag +
      "/" +
      u.pathname.slice(idx + marker.length);
    return u.toString();
  } catch {
    return null;
  }
}

export async function forceDownload(url: string, filename?: string) {
  const cloud = withCloudinaryAttachment(url, filename);
  if (cloud) {
    // Navigating to the fl_attachment URL triggers a save without leaving the page.
    const a = document.createElement("a");
    a.href = cloud;
    if (filename) a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename ?? url.split("/").pop() ?? "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  } catch {
    // Last-resort fallback — opens in a new tab.
    window.open(url, "_blank", "noopener");
  }
}