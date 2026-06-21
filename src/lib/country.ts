// Detect user country code (ISO-2) using a public IP API.
// Falls back to undefined; UI will let user pick manually.
export async function detectCountry(): Promise<string | undefined> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    return (json?.country_code || json?.country || "").toString().toUpperCase().slice(0, 2) || undefined;
  } catch {
    return undefined;
  }
}