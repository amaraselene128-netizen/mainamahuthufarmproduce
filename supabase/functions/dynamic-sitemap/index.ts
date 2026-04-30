import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "shops";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const siteUrl = "https://sokoniarena.co.ke";
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  if (type === "shops") {
    // Add the shops listing page
    xml += `  <url>\n    <loc>${siteUrl}/shops</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    // Fetch all active shops
    const { data: shops, error } = await supabase
      .from("shops")
      .select("slug, updated_at, name")
      .eq("is_active", true)
      .order("followers_count", { ascending: false });

    if (!error && shops) {
      for (const shop of shops) {
        const lastmod = shop.updated_at ? shop.updated_at.split("T")[0] : today;
        xml += `  <url>\n    <loc>${siteUrl}/shop/${shop.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }
  } else if (type === "products" || type === "services" || type === "events") {
    const kind = type.slice(0, -1); // product | service | event
    xml += `  <url>\n    <loc>${siteUrl}/${type}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    // Paginate to include ALL listings (Supabase caps at 1000 per query)
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: listings, error } = await supabase
        .from("listings_public")
        .select("id, updated_at")
        .eq("status", "available")
        .eq("listing_type", kind)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !listings || listings.length === 0) break;
      for (const item of listings) {
        const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
        xml += `  <url>\n    <loc>${siteUrl}/${type}/${item.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      if (listings.length < PAGE) break;
      from += PAGE;
      if (from >= 50000) break; // sitemap spec cap
    }
  } else if (type === "index") {
    // Return sitemap index
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    for (const t of ["shops", "products", "services", "events"]) {
      xml += `  <sitemap>\n    <loc>${siteUrl}/sitemap-dynamic-${t}.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    }
    // Also include static pages sitemap
    xml += `  <sitemap>\n    <loc>${siteUrl}/sitemap-pages.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    xml += `</sitemapindex>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
