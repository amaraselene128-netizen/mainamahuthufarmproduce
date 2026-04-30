// Prerender pages for bots/crawlers with full SEO HTML.
// Real users hit the SPA; bots hit this function (routed via netlify.toml).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://sokoniarena.co.ke";
const DEFAULT_IMAGE = `${SITE_URL}/pwa-512x512.svg`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, n = 155): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1) + "…";
}

function pickImage(item: any): string {
  const imgs = item?.images;
  if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === "string") return imgs[0];
  if (typeof item?.image_url === "string") return item.image_url;
  if (typeof item?.logo_url === "string") return item.logo_url;
  if (typeof item?.banner_url === "string") return item.banner_url;
  return DEFAULT_IMAGE;
}

function htmlShell(opts: {
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd?: Record<string, unknown>;
  bodyContent: string;
  ogType?: string;
}): string {
  const { title, description, canonical, image, jsonLd, bodyContent, ogType = "website" } = opts;
  const ld = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="${esc(ogType)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:site_name" content="SokoniArena" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
${ld}
</head>
<body>
${bodyContent}
<p><a href="${esc(canonical)}">View on SokoniArena</a></p>
</body>
</html>`;
}

function notFound(canonical: string) {
  return new Response(
    htmlShell({
      title: "Not found · SokoniArena",
      description: "The page you are looking for could not be found.",
      canonical,
      image: DEFAULT_IMAGE,
      bodyContent: `<h1>Not found</h1>`,
    }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function renderListing(id: string, kind: "product" | "service" | "event") {
  const canonical = `${SITE_URL}/${kind}s/${id}`;
  const { data, error } = await supabase
    .from("listings_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return notFound(canonical);

  const title = `${data.title || "Listing"} · SokoniArena`;
  const descSrc =
    data.description ||
    [data.category, data.subcategory, data.location].filter(Boolean).join(" · ") ||
    `${kind} listing on SokoniArena`;
  const description = truncate(descSrc);
  const image = pickImage(data);
  const price = Number(data.price);
  const currency = data.currency || "KES";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": kind === "event" ? "Event" : kind === "service" ? "Service" : "Product",
    name: data.title,
    description,
    image: [image],
    url: canonical,
    ...(data.category ? { category: data.category } : {}),
  };
  if (kind === "product" && Number.isFinite(price) && price > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability:
        data.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonical,
    };
  }

  const body = `
<h1>${esc(data.title)}</h1>
${Number.isFinite(price) && price > 0 ? `<p><strong>${esc(currency)} ${price.toLocaleString()}</strong></p>` : ""}
${data.location ? `<p>📍 ${esc(data.location)}</p>` : ""}
${data.category ? `<p>Category: ${esc(data.category)}${data.subcategory ? ` › ${esc(data.subcategory)}` : ""}</p>` : ""}
${image ? `<img src="${esc(image)}" alt="${esc(data.title)}" width="600" />` : ""}
<p>${esc(data.description || "")}</p>`;

  return new Response(
    htmlShell({ title, description, canonical, image, jsonLd, bodyContent: body, ogType: "product" }),
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } },
  );
}

async function renderShop(slug: string) {
  const canonical = `${SITE_URL}/shop/${slug}`;
  const { data: shop, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !shop) return notFound(canonical);

  const title = `${shop.name} · SokoniArena Shop`;
  const description = truncate(
    shop.bio || shop.description || `Browse products and services from ${shop.name} on SokoniArena.`,
  );
  const image = pickImage(shop);

  // Pull a few recent listings for crawlable internal links
  const { data: listings } = await supabase
    .from("listings_public")
    .select("id, title, listing_type, price, currency")
    .eq("shop_id", shop.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(20);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    description,
    image: [image],
    url: canonical,
    ...(shop.location ? { address: { "@type": "PostalAddress", addressLocality: shop.location } } : {}),
    ...(shop.phone ? { telephone: shop.phone } : {}),
  };

  const itemsHtml = (listings ?? [])
    .map((l: any) => {
      const path = `${l.listing_type || "product"}s`;
      return `<li><a href="${SITE_URL}/${path}/${esc(l.id)}">${esc(l.title)}</a>${
        l.price ? ` — ${esc(l.currency || "KES")} ${Number(l.price).toLocaleString()}` : ""
      }</li>`;
    })
    .join("");

  const body = `
<h1>${esc(shop.name)}</h1>
${image ? `<img src="${esc(image)}" alt="${esc(shop.name)}" width="400" />` : ""}
<p>${esc(shop.bio || shop.description || "")}</p>
${shop.location ? `<p>📍 ${esc(shop.location)}</p>` : ""}
${itemsHtml ? `<h2>Listings</h2><ul>${itemsHtml}</ul>` : ""}`;

  return new Response(
    htmlShell({ title, description, canonical, image, jsonLd, bodyContent: body, ogType: "profile" }),
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } },
  );
}

async function renderCategory(kind: "product" | "service" | "event", category: string) {
  const canonical = `${SITE_URL}/${kind}s?category=${encodeURIComponent(category)}`;
  const { data: listings } = await supabase
    .from("listings_public")
    .select("id, title, price, currency, location, listing_type")
    .ilike("category", category)
    .eq("listing_type", kind)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(50);

  const title = `${category} ${kind}s · SokoniArena`;
  const description = truncate(
    `Browse ${listings?.length ?? 0}+ ${category} ${kind}s on SokoniArena. Buy and sell across Kenya.`,
  );

  const items = (listings ?? [])
    .map(
      (l: any) =>
        `<li><a href="${SITE_URL}/${kind}s/${esc(l.id)}">${esc(l.title)}</a>${
          l.price ? ` — ${esc(l.currency || "KES")} ${Number(l.price).toLocaleString()}` : ""
        }${l.location ? ` · ${esc(l.location)}` : ""}</li>`,
    )
    .join("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
  };

  const body = `<h1>${esc(category)} ${esc(kind)}s</h1>${items ? `<ul>${items}</ul>` : "<p>No items yet.</p>"}`;

  return new Response(
    htmlShell({ title, description, canonical, image: DEFAULT_IMAGE, jsonLd, bodyContent: body }),
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=3600" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Caller passes ?path=/products/abc123 (or /shop/foo, /services?category=Cars, etc.)
    const target = url.searchParams.get("path") || "/";
    const u = new URL(target, SITE_URL);
    const path = u.pathname.replace(/\/+$/, "") || "/";

    // Listings: /products/:id, /services/:id, /events/:id
    const listingMatch = path.match(/^\/(products|services|events)\/([^/]+)$/);
    if (listingMatch) {
      const kind = listingMatch[1].slice(0, -1) as "product" | "service" | "event";
      return await renderListing(listingMatch[2], kind);
    }

    // Shop: /shop/:slug
    const shopMatch = path.match(/^\/shop\/([^/]+)$/);
    if (shopMatch) return await renderShop(shopMatch[1]);

    // Category landing: /products | /services | /events with ?category=
    const cat = u.searchParams.get("category");
    const listingPage = path.match(/^\/(products|services|events)$/);
    if (listingPage && cat) {
      const kind = listingPage[1].slice(0, -1) as "product" | "service" | "event";
      return await renderCategory(kind, cat);
    }

    return notFound(`${SITE_URL}${path}`);
  } catch (e) {
    console.error("prerender error", e);
    return new Response("Internal error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});