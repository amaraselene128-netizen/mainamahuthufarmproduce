import { Helmet } from "react-helmet-async";

interface ListingJsonLdProps {
  id: string;
  title: string;
  description: string;
  listingType: "product" | "service" | "event";
  price: number | null;
  originalPrice?: number | null;
  isFree?: boolean | null;
  images: string[];
  location: string;
  category?: string | null;
  sellerName?: string;
  createdAt: string;
}

export function ListingJsonLd({
  id,
  title,
  description,
  listingType,
  price,
  originalPrice,
  isFree,
  images,
  location,
  sellerName,
  createdAt,
}: ListingJsonLdProps) {
  const categoryPath = listingType === "product" ? "products" : listingType === "service" ? "services" : "events";
  const url = `https://sokoniarena.co.ke/${categoryPath}/${id}`;
  const metaDesc = description?.slice(0, 155) || `${title} - Available on SokoniArena Kenya`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": listingType === "event" ? "Event" : "Product",
    name: title,
    description: description || `${title} on SokoniArena`,
    url,
    image: images?.length ? images : undefined,
  };

  if (listingType !== "event") {
    // Add offers to satisfy Google's Product snippet requirements
    jsonLd.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "KES",
      price: isFree ? "0" : price ? String(price) : undefined,
      availability: "https://schema.org/InStock",
      seller: sellerName
        ? { "@type": "Organization", name: sellerName }
        : undefined,
    };

    if (originalPrice && price && originalPrice > price) {
      jsonLd.offers = {
        ...(jsonLd.offers as Record<string, unknown>),
        priceValidUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
      };
    }
  }

  if (listingType === "event") {
    jsonLd.location = {
      "@type": "Place",
      name: location,
      address: { "@type": "PostalAddress", addressLocality: location, addressCountry: "KE" },
    };
  }

  return (
    <Helmet>
      <title>{`${title} | SokoniArena Kenya`}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={`${title} | SokoniArena`} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={url} />
      {images?.[0] && <meta property="og:image" content={images[0]} />}
      <meta property="og:type" content={listingType === "event" ? "event" : "product"} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
