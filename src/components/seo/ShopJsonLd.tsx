import { Helmet } from "react-helmet-async";
import type { Shop } from "@/hooks/useShops";

interface ShopJsonLdProps {
  shop: Shop;
  listingsCount?: number;
}

export function ShopJsonLd({ shop, listingsCount = 0 }: ShopJsonLdProps) {
  const shopUrl = `https://sokoniarena.co.ke/shop/${shop.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    alternateName: [shop.name, `${shop.name} Sokoni`, `${shop.name} on Sokoni Arena`],
    description: shop.description || `Shop on SokoniArena - ${shop.name}`,
    url: shopUrl,
    image: shop.logo_url || shop.cover_image_url || undefined,
    address: shop.location
      ? {
          "@type": "PostalAddress",
          addressLocality: shop.location,
          addressCountry: "KE",
        }
      : undefined,
    telephone: shop.phone || undefined,
    email: shop.email || undefined,
    aggregateRating:
      shop.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(shop.rating).toFixed(1),
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    numberOfItems: listingsCount,
    sameAs: [
      shop.facebook,
      shop.instagram,
      shop.twitter,
      shop.youtube,
      shop.linkedin,
      shop.tiktok,
      shop.telegram,
    ].filter(Boolean),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sokoniarena.co.ke/" },
      { "@type": "ListItem", position: 2, name: "Shops", item: "https://sokoniarena.co.ke/shops" },
      { "@type": "ListItem", position: 3, name: shop.name, item: shopUrl },
    ],
  };

  return (
    <Helmet>
      <title>{`${shop.name} | Sokoni Arena Kenya`}</title>
      <meta
        name="description"
        content={
          shop.description ||
          `${shop.name} on Sokoni Arena (Sokoni) — Kenya's trusted marketplace. Browse products, services & events from ${shop.name}.`
        }
      />
      <meta name="keywords" content={`${shop.name}, ${shop.name} sokoni, ${shop.name} kenya, sokoni shops, sokoni arena`} />
      <link rel="canonical" href={shopUrl} />
      <meta property="og:title" content={`${shop.name} | Sokoni Arena`} />
      <meta
        property="og:description"
        content={shop.description || `Shop at ${shop.name} on Sokoni Arena Kenya`}
      />
      <meta property="og:url" content={shopUrl} />
      {shop.cover_image_url && <meta property="og:image" content={shop.cover_image_url} />}
      <meta property="og:type" content="business.business" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
    </Helmet>
  );
}
