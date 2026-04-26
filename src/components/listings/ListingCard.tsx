import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Clock, ShoppingCart, Phone, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ListingCardProps {
  id: string;
  title: string;
  price?: number;
  originalPrice?: number;
  image: string;
  location: string;
  category: "product" | "service" | "event";
  isSponsored?: boolean;
  isFeatured?: boolean;
  rating?: number;
  eventDate?: string;
  isFree?: boolean;
  /** Seller phone in international format (digits + optional +) */
  sellerPhone?: string | null;
  /** Seller WhatsApp number (digits only) */
  sellerWhatsapp?: string | null;
}

function computeDiscount(original?: number, current?: number): number | null {
  if (!original || !current || original <= 0 || current >= original) return null;
  return Math.round(((original - current) / original) * 100);
}

export const ListingCard = memo(function ListingCard({
  id,
  title,
  price,
  originalPrice,
  image,
  location,
  category,
  isSponsored = false,
  isFeatured = false,
  rating,
  eventDate,
  isFree = false,
  sellerPhone,
  sellerWhatsapp,
}: ListingCardProps) {
  const categoryPath = category === "product" ? "products" : category === "service" ? "services" : "events";
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCart, addToCart } = useCart();
  const isFav = isFavorite(id);
  const inCart = isInCart(id);
  const discount = computeDiscount(originalPrice, price);

  const phoneClean = (sellerPhone || "").replace(/[^0-9+]/g, "");
  const waClean = (sellerWhatsapp || sellerPhone || "").replace(/[^0-9]/g, "");

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  }, [id, toggleFavorite]);

  const handleCartClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(id);
  }, [id, addToCart]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Link to={`/${categoryPath}/${id}`} className="group">
      <article className="listing-card flex flex-col h-full">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage
            src={image}
            alt={title}
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
            width={400}
            priority={false}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Discount Red Banner (top-left corner) */}
          {discount !== null && (
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-br-md shadow-md">
                -{discount}%
              </div>
            </div>
          )}

          {/* Badges */}
          <div className={cn(
            "absolute top-1.5 flex flex-wrap gap-1",
            discount !== null ? "left-12" : "left-1.5"
          )}>
            {isSponsored && (
              <span className="sponsored-badge">
                <Star className="h-3 w-3" />
                <span className="hidden sm:inline">Sponsored</span>
              </span>
            )}
            {isFeatured && (
              <Badge variant="secondary" className="bg-lavender text-lavender-foreground text-[10px] sm:text-xs px-1.5">
                Featured
              </Badge>
            )}
            {category === "event" && eventDate && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px] sm:text-xs px-1.5">
                <Clock className="h-3 w-3 mr-0.5" />
                {eventDate}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
            <Button
              variant="glass"
              size="icon"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-opacity",
                isFav ? "opacity-100" : "opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isFav && "fill-destructive text-destructive")} />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-opacity",
                inCart ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
              )}
              onClick={handleCartClick}
            >
              <ShoppingCart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", inCart && "fill-primary text-primary")} />
            </Button>
          </div>

          {/* Contact Buttons (bottom overlay) — always visible */}
          {(phoneClean || waClean) && (
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              {phoneClean && (
                <a
                  href={`tel:${phoneClean}`}
                  onClick={stop}
                  aria-label="Call seller"
                  className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 ring-2 ring-white/70"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              )}
              {waClean && (
                <a
                  href={`https://wa.me/${waClean}?text=${encodeURIComponent(`Hi, I'm interested in your listing: ${title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={stop}
                  aria-label="WhatsApp seller"
                  className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-md hover:opacity-90 ring-2 ring-white/70"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2 sm:p-3">
          {/* Title */}
          <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-1.5 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {/* Price & Rating */}
          <div className="mt-auto flex items-end justify-between gap-1">
            <div className="min-w-0">
              {isFree ? (
                <span className="text-primary font-bold text-xs sm:text-sm">FREE</span>
              ) : price ? (
                <>
                  {originalPrice && originalPrice > price && (
                    <span className="price-original block text-[10px] sm:text-sm">KES {originalPrice.toLocaleString()}</span>
                  )}
                  <span className={cn(
                    "price-current text-sm sm:text-lg",
                    originalPrice && originalPrice > price && "text-accent"
                  )}>
                    KES {price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-[10px] sm:text-sm">Contact for price</span>
              )}
            </div>

            {rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-gold text-gold" />
                <span className="text-[10px] sm:text-xs font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});
