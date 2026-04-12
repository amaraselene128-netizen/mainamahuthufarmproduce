import { Helmet } from "react-helmet-async";
import type { Shop } from "@/hooks/useShops";

interface ShopJsonLdProps {
  shop: Shop;
  listingsCount?: number;
}

export function ShopJsonLd({ shop, listingsCount = 0 }: ShopJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    description: shop.description || `Shop on SokoniArena - ${shop.name}`,
    url: `https://sokoniarena.co.ke/shop/${shop.slug}`,
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

  return (
    <Helmet>
      <title>{shop.name} | SokoniArena Kenya</title>
      <meta
        name="description"
        content={
          shop.description ||
          `Discover ${shop.name} on SokoniArena - Kenya's trusted marketplace. Browse products, services & events.`
        }
      />
      <link rel="canonical" href={`https://sokoniarena.co.ke/shop/${shop.slug}`} />
      <meta property="og:title" content={`${shop.name} | SokoniArena`} />
      <meta
        property="og:description"
        content={shop.description || `Shop at ${shop.name} on SokoniArena Kenya`}
      />
      <meta property="og:url" content={`https://sokoniarena.co.ke/shop/${shop.slug}`} />
      {shop.cover_image_url && <meta property="og:image" content={shop.cover_image_url} />}
      <meta property="og:type" content="business.business" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
