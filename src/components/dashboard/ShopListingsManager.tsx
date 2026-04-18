import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Megaphone, Plus, Edit, Trash2, Loader2, Search, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ListingForm } from "./ListingForm";
import { parseImages } from "@/lib/utils";

interface ShopListingsManagerProps {
  shopId: string;
  shopName: string;
}

export function ShopListingsManager({ shopId, shopName }: ShopListingsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchListings = async () => {
    if (!user) return;
    setIsLoading(true);
    // Show all listings owned by user OR attached to the shop, so legacy/pre-shop
    // listings remain visible and editable by the owner.
    const { data } = await supabase
      .from("listings")
      .select("*")
      .or(`shop_id.eq.${shopId},user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setListings(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchListings(); }, [shopId, user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
  };

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setIsFormOpen(true); };
  const handleSuccess = () => { setIsFormOpen(false); setEditing(null); fetchListings(); };

  const filtered = listings.filter((l) =>
    l.title?.toLowerCase().includes(search.toLowerCase())
  );

  const needsDetails = (l: any) =>
    !l.shop_id || !l.category || (!l.price && !l.is_free);

  const typePath = (t: string) =>
    t === "service" ? "services" : t === "event" ? "events" : "products";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                {shopName} Listings & Ads
              </CardTitle>
              <CardDescription>
                Every shop ad is a full listing with price, category, contacts and images — same as normal listings.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />New Listing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No listings yet. Click "New Listing" to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((l) => {
                const img = parseImages(l.images)?.[0];
                const incomplete = needsDetails(l);
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0">
                      {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{l.title || "Untitled"}</p>
                        <Badge variant="secondary" className="text-xs">{l.listing_type}</Badge>
                        {l.is_featured && <Badge className="text-xs">Featured</Badge>}
                        {!l.shop_id && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <AlertCircle className="h-3 w-3" />Not in shop
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>
                          {l.is_free
                            ? "FREE"
                            : l.price
                            ? `KES ${Number(l.price).toLocaleString()}`
                            : "No price"}
                        </span>
                        <span>•</span>
                        <span>{l.category || "No category"}</span>
                        <span>•</span>
                        <span>{l.location || "No location"}</span>
                        <span>•</span>
                        <span>{format(new Date(l.created_at), "MMM d, yyyy")}</span>
                      </div>
                      {incomplete && (
                        <p className="text-xs text-destructive mt-1">
                          ⚠ Missing details — click Edit to add price, category & shop link.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/${typePath(l.listing_type)}/${l.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(l.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Listing" : "Create New Listing"}</DialogTitle>
            <DialogDescription>
              Fill in all details — price, category, images. This will appear in your shop and across the marketplace.
            </DialogDescription>
          </DialogHeader>
          <ListingForm
            listing={editing}
            shopId={shopId}
            onSuccess={handleSuccess}
            onCancel={() => { setIsFormOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
