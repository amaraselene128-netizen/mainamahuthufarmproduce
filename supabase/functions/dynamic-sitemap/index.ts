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
  } else if (type === "products") {
    xml += `  <url>\n    <loc>${siteUrl}/products</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    const { data: listings, error } = await supabase
      .from("listings_public")
      .select("id, updated_at, listing_type")
      .eq("status", "available")
      .eq("listing_type", "product")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && listings) {
      for (const item of listings) {
        const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
        xml += `  <url>\n    <loc>${siteUrl}/products/${item.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    }
  } else if (type === "services") {
    xml += `  <url>\n    <loc>${siteUrl}/services</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    const { data: listings, error } = await supabase
      .from("listings_public")
      .select("id, updated_at")
      .eq("status", "available")
      .eq("listing_type", "service")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && listings) {
      for (const item of listings) {
        const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
        xml += `  <url>\n    <loc>${siteUrl}/services/${item.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    }
  } else if (type === "events") {
    xml += `  <url>\n    <loc>${siteUrl}/events</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

    const { data: listings, error } = await supabase
      .from("listings_public")
      .select("id, updated_at")
      .eq("status", "available")
      .eq("listing_type", "event")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && listings) {
      for (const item of listings) {
        const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
        xml += `  <url>\n    <loc>${siteUrl}/events/${item.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
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
