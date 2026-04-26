import { memo, useMemo } from "react";
import { format } from "date-fns";
import { ListingCard } from "@/components/listings/ListingCard";
import { useSellerContacts } from "@/hooks/useSellerContacts";
import { parseImages } from "@/lib/utils";

type AnyListing = any;

interface Props {
  listings: AnyListing[];
  category: "product" | "service" | "event";
  fallbackImage?: string;
}

/**
 * Grid that batch-fetches seller phone/whatsapp for every listing
 * and renders ListingCards with the call/whatsapp buttons enabled.
 */
export const ListingsGridWithContacts = memo(function ListingsGridWithContacts({
  listings,
  category,
  fallbackImage = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&q=80",
}: Props) {
  const userIds = useMemo(
    () => listings.map((l) => l.user_id).filter(Boolean),
    [listings]
  );
  const contacts = useSellerContacts(userIds);

  return (
    <div className="listing-grid">
      {listings.map((listing) => {
        const seller = contacts[listing.user_id];
        return (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.price || undefined}
            originalPrice={listing.original_price || undefined}
            image={parseImages(listing.images)?.[0] || fallbackImage}
            location={listing.location}
            category={category}
            isSponsored={listing.is_sponsored || false}
            isFeatured={listing.is_featured || false}
            isFree={listing.is_free || false}
            rating={listing.favorites_count ? Math.min(5, 4 + listing.favorites_count * 0.1) : undefined}
            eventDate={listing.event_date ? format(new Date(listing.event_date), "MMM d") : undefined}
            sellerPhone={seller?.phone}
            sellerWhatsapp={seller?.whatsapp}
          />
        );
      })}
    </div>
  );
});
