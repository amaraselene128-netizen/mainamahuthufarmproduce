import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useShopBySlug, useShopFollow } from "@/hooks/useShops";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { ListingCard } from "@/components/listings/ListingCard";

import { ShopProfileEditor } from "@/components/shops/ShopProfileEditor";
import { ShopJsonLd } from "@/components/seo/ShopJsonLd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Star, Users, Eye, UserPlus, UserMinus, Package,
  Sparkles, Calendar, Loader2, MessageCircle, Store, CheckCircle,
  Crown, Phone, Mail, Plus, Settings, Pencil
} from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedin, FaTelegram } from "react-icons/fa6";
import { format } from "date-fns";
import { cn, parseImages } from "@/lib/utils";

interface ShopListing {
  id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  images: string[];
  location: string;
  listing_type: "product" | "service" | "event";
  is_sponsored: boolean;
  is_featured: boolean;
  is_free: boolean;
  favorites_count: number | null;
  event_date: string | null;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export default function ShopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { shop, isLoading: shopLoading, refetch: refetchShop } = useShopBySlug(slug);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, isLoading: followLoading, followersCount } = useShopFollow(shop?.id);

  const [listings, setListings] = useState<ShopListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [tab, setTab] = useState("products");
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const isOwner = user?.id === shop?.user_id;

  const fetchListings = async () => {
    if (!shop) return;
    const { data } = await supabase
      .from("listings_public")
      .select("id, title, price, original_price, images, location, listing_type, is_sponsored, is_featured, is_free, favorites_count, event_date")
      .eq("shop_id", shop.id)
      .eq("status", "available")
      .order("created_at", { ascending: false });
    setListings((data as ShopListing[]) || []);
    setListingsLoading(false);
  };

  useEffect(() => {
    if (!shop) return;
    fetchListings();
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("shop_reviews")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });
      if (data) {
        const userIds = data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setReviews(
          data.map((r: any) => ({
            ...r,
            username: profileMap.get(r.user_id)?.username || "User",
            avatar_url: profileMap.get(r.user_id)?.avatar_url,
          }))
        );
      }
    };
    fetchReviews();
    supabase.from("shops").update({ views_count: (shop.views_count || 0) + 1 }).eq("id", shop.id);
  }, [shop]);

  const handleFollow = async () => {
    await toggleFollow();
  };

  const handleSubmitReview = async () => {
    if (!user || !shop) {
      toast({ title: "Sign in to leave a review", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase
      .from("shop_reviews")
      .upsert({ shop_id: shop.id, user_id: user.id, rating: reviewRating, comment: reviewText || null }, { onConflict: "shop_id,user_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!" });
      setReviewText("");
      const { data } = await supabase.from("shop_reviews").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });
      if (data) {
        const userIds = data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase.from("profiles_public").select("user_id, username, avatar_url").in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setReviews(data.map((r: any) => ({ ...r, username: profileMap.get(r.user_id)?.username || "User", avatar_url: profileMap.get(r.user_id)?.avatar_url })));
      }
    }
    setSubmittingReview(false);
  };

  const filteredListings = listings.filter((l) => {
    if (tab === "products") return l.listing_type === "product";
    if (tab === "services") return l.listing_type === "service";
    if (tab === "events") return l.listing_type === "event";
    return true;
  });

  const mapListing = (listing: ShopListing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price ?? undefined,
    originalPrice: listing.original_price ?? undefined,
    image: parseImages(listing.images)?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&q=80",
    location: listing.location || "",
    category: listing.listing_type as "product" | "service" | "event",
    isSponsored: listing.is_sponsored || false,
    isFeatured: listing.is_featured || false,
    isFree: listing.is_free || false,
    eventDate: listing.event_date ? format(new Date(listing.event_date), "MMM d") : undefined,
  });

  const socialLinks = useMemo(() => {
    if (!shop) return [];
    const links = [];
    if (shop.whatsapp) links.push({ icon: FaWhatsapp, href: `https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}`, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20", label: "WhatsApp" });
    if (shop.facebook) links.push({ icon: FaFacebook, href: shop.facebook, color: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20", label: "Facebook" });
    if (shop.instagram) links.push({ icon: FaInstagram, href: shop.instagram, color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20", label: "Instagram" });
    if (shop.twitter) links.push({ icon: FaXTwitter, href: shop.twitter, color: "bg-foreground/10 text-foreground hover:bg-foreground/20", label: "X" });
    if (shop.tiktok) links.push({ icon: FaTiktok, href: shop.tiktok, color: "bg-foreground/10 text-foreground hover:bg-foreground/20", label: "TikTok" });
    if (shop.youtube) links.push({ icon: FaYoutube, href: shop.youtube, color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", label: "YouTube" });
    if (shop.linkedin) links.push({ icon: FaLinkedin, href: shop.linkedin, color: "bg-blue-700/10 text-blue-700 hover:bg-blue-700/20", label: "LinkedIn" });
    if (shop.telegram) links.push({ icon: FaTelegram, href: shop.telegram, color: "bg-sky-500/10 text-sky-500 hover:bg-sky-500/20", label: "Telegram" });
    return links;
  }, [shop]);

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
          <p className="text-muted-foreground mb-4">This shop doesn't exist or has been deactivated.</p>
          <Button asChild><Link to="/shops">Browse Shops</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ShopJsonLd shop={shop} listingsCount={listings.length} />
      {/* Standalone shop header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="font-semibold text-sm">{shop.name}</span>
            {shop.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button size="sm" onClick={() => navigate("/dashboard?tab=shop&manageAds=1")} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add Listing</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowProfileEditor(true)} className="gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit Shop</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/shops"><Store className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-48 md:h-72 overflow-hidden">
        {shop.cover_image_url ? (
          <img src={shop.cover_image_url} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-accent/20 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        {isOwner && (
          <button
            onClick={() => setShowProfileEditor(true)}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/70 backdrop-blur hover:bg-background/90 transition-colors"
            title="Edit cover image"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="container relative -mt-20 pb-12">
        {/* Shop Header */}
        <div className="flex flex-col md:flex-row gap-5 items-start mb-6">
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-lg shrink-0">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-4xl">
                {shop.name.charAt(0)}
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => setShowProfileEditor(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                title="Edit logo"
              >
                <Pencil className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{shop.name}</h1>
              {shop.is_verified && <CheckCircle className="h-6 w-6 text-primary fill-primary/20" />}
              {shop.is_promoted && <Crown className="h-5 w-5 text-gold" />}
            </div>
            {shop.description && (
              <p className="text-muted-foreground mb-3 max-w-2xl text-sm">{shop.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              {shop.location && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{shop.location}</span>
              )}
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{followersCount} followers</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{shop.views_count} views</span>
              <span className="flex items-center gap-1"><Package className="h-4 w-4" />{listings.length} listings</span>
              {shop.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {Number(shop.rating).toFixed(1)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isOwner && (
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} disabled={followLoading} size="sm">
                  {isFollowing ? <UserMinus className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              {shop.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${shop.phone}`}><Phone className="h-4 w-4 mr-1" />Call</a>
                </Button>
              )}
              {shop.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${shop.email}`}><Mail className="h-4 w-4 mr-1" />Email</a>
                </Button>
              )}
              {isOwner && (
                <Button size="sm" variant="default" onClick={() => navigate("/dashboard?tab=shop&manageAds=1")} className="gap-1">
                  <Plus className="h-4 w-4" />Add Listing
                </Button>
              )}
            </div>

            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {socialLinks.map(({ icon: Icon, href, color, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("p-2.5 rounded-xl transition-colors", color)}
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shop Ads Banner */}
        <ShopAdsBanner shopId={shop.id} />

        {/* Listings Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full max-w-lg mb-6">
            <TabsTrigger value="products" className="flex-1 gap-1"><Package className="h-4 w-4" />Products</TabsTrigger>
            <TabsTrigger value="services" className="flex-1 gap-1"><Sparkles className="h-4 w-4" />Services</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 gap-1"><Calendar className="h-4 w-4" />Events</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 gap-1"><MessageCircle className="h-4 w-4" />Reviews</TabsTrigger>
          </TabsList>

          {["products", "services", "events"].map((t) => (
            <TabsContent key={t} value={t} className="mt-0">
              {listingsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[4/3] rounded-xl" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredListings.map((l) => (
                    <ListingCard key={l.id} {...mapListing(l)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {isOwner ? (
                    <div>
                      <p className="mb-3">No {t} in your shop yet</p>
                      <Button onClick={() => navigate("/dashboard?tab=shop&manageAds=1")} className="gap-1">
                        <Plus className="h-4 w-4" />Add Your First Listing
                      </Button>
                    </div>
                  ) : (
                    `No ${t} in this shop yet`
                  )}
                </div>
              )}
            </TabsContent>
          ))}

          <TabsContent value="reviews" className="mt-0">
            {user && (
              <div className="mb-8 p-4 rounded-xl border bg-card">
                <h3 className="font-semibold mb-3">Leave a Review</h3>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star className={cn("h-6 w-6 transition-colors", s <= reviewRating ? "fill-gold text-gold" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Write your review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="mb-3"
                />
                <Button onClick={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Submit Review
                </Button>
              </div>
            )}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {review.avatar_url ? (
                          <img src={review.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{review.username?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.username}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "fill-gold text-gold" : "text-muted-foreground")} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No reviews yet</div>
            )}
          </TabsContent>
        </Tabs>
      </div>


      {/* Edit Shop Profile Dialog */}
      <Dialog open={showProfileEditor} onOpenChange={setShowProfileEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop Profile</DialogTitle>
          </DialogHeader>
          <ShopProfileEditor
            shop={shop}
            onSuccess={() => {
              setShowProfileEditor(false);
              refetchShop();
            }}
            onCancel={() => setShowProfileEditor(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShopAdsBanner({ shopId }: { shopId: string }) {
  const [ads, setAds] = useState<Array<{ id: string; title: string; description: string | null; image_url: string | null; link_url: string | null }>>([]);
  const [selectedAd, setSelectedAd] = useState<typeof ads[0] | null>(null);

  useEffect(() => {
    supabase
      .from("shop_ads")
      .select("id, title, description, image_url, link_url")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setAds(data); });
  }, [shopId]);

  if (ads.length === 0) return null;

  return (
    <>
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {ads.map((ad) => (
          <button
            key={ad.id}
            onClick={() => setSelectedAd(ad)}
            className="block rounded-xl overflow-hidden border hover:shadow-md transition-shadow text-left bg-card"
          >
            {ad.image_url && (
              <img src={ad.image_url} alt={ad.title} className="w-full aspect-[4/3] object-cover" />
            )}
            <div className="p-2">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] shrink-0">Ad</Badge>
                <p className="font-medium text-xs line-clamp-1">{ad.title}</p>
              </div>
              {ad.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{ad.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Ad Detail Dialog */}
      <Dialog open={!!selectedAd} onOpenChange={() => setSelectedAd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Sponsored</Badge>
              {selectedAd?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedAd?.image_url && (
            <img src={selectedAd.image_url} alt={selectedAd.title} className="w-full rounded-lg object-cover max-h-80" />
          )}
          {selectedAd?.description && (
            <p className="text-sm text-muted-foreground">{selectedAd.description}</p>
          )}
          {selectedAd?.link_url && (
            <Button asChild className="w-full">
              <a href={selectedAd.link_url} target="_blank" rel="noopener noreferrer">
                Visit Link
              </a>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
