import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useMyShop } from "@/hooks/useShops";
import { CreateShopForm } from "@/components/shops/CreateShopForm";
import { ShopPromotionButton } from "@/components/dashboard/ShopPromotionButton";
import { ShopAdsManager } from "@/components/admin/ShopAdsManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Store, Plus, Eye, Users, Star, MapPin, ExternalLink, Loader2, Crown, Megaphone, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function MyShopPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { shop, isLoading, refetch } = useMyShop();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [linking, setLinking] = useState(false);
  const [searchParams] = useSearchParams();

  const linkOrphanListings = async () => {
    if (!user || !shop) return;
    setLinking(true);
    const { data, error } = await supabase
      .from("listings")
      .update({ shop_id: shop.id })
      .eq("user_id", user.id)
      .is("shop_id", null)
      .select("id");
    setLinking(false);
    if (error) {
      toast({ title: "Failed to link listings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${data?.length || 0} listing(s) linked to your shop` });
      refetch();
    }
  };

  useEffect(() => {
    if (searchParams.get("manageAds") === "1") {
      setShowAds(true);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shop) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Store className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">Create Your Shop</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Launch your own branded shop within SokoniArena. Your request will be reviewed by the admin team.
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-1" />
                Request Shop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request a Shop</DialogTitle>
                <DialogDescription>Submit your shop details for admin approval</DialogDescription>
              </DialogHeader>
              <CreateShopForm
                onSuccess={() => { setIsCreateOpen(false); refetch(); }}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-xl font-bold">{shop.name}</h3>
              {shop.is_promoted && <Crown className="h-5 w-5 text-gold fill-gold/20" />}
            </div>
            {shop.description && (
              <p className="text-muted-foreground text-sm mb-3">{shop.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {shop.location && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{shop.location}</span>
              )}
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{shop.followers_count} followers</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{shop.views_count} views</span>
              {shop.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" />{Number(shop.rating).toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button asChild>
                <Link to={`/shop/${shop.slug}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />View Shop
                </Link>
              </Button>
              <ShopPromotionButton shopId={shop.id} shopName={shop.name} />
              <Button variant="outline" onClick={() => setShowAds(!showAds)}>
                <Megaphone className="h-4 w-4 mr-1" />
                {showAds ? "Hide Ads" : "Manage Ads"}
              </Button>
              <Button variant="outline" onClick={linkOrphanListings} disabled={linking}>
                {linking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
                Link My Listings to Shop
              </Button>
            </div>
          </div>
        </div>

        {showAds && (
          <div className="mt-6 border-t pt-6">
            <ShopAdsManager shopId={shop.id} shopName={shop.name} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
