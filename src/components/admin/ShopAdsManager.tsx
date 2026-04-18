import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Plus, Edit, Trash2, Loader2, Search, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ListingForm } from "@/components/dashboard/ListingForm";
import { parseImages } from "@/lib/utils";

/**
 * ShopAdsManager — admin & per-shop view of shop advertisements.
 *
 * IMPORTANT: A "shop ad" is just a regular `listings` row attached to a shop.
 * This guarantees ads have price, category, location, contacts, images and
 * appear in shop pages + marketplace exactly like any other listing.
 *
 * The legacy `shop_ads` table is no longer used here — all create/edit goes
 * through the unified `ListingForm`.
 */

interface ShopAdsManagerProps {
  shopId?: string;
  shopName?: string;
  isAdmin?: boolean;
}

export function ShopAdsManager({ shopId, shopName, isAdmin = false }: ShopAdsManagerProps) {
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [shopMap, setShopMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [defaultShopId, setDefaultShopId] = useState<string | null>(shopId || null);

  const fetchListings = async () => {
    setIsLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .not("shop_id", "is", null)
      .order("created_at", { ascending: false });

    if (shopId) query = query.eq("shop_id", shopId);

    const { data } = await query;
    const rows = data || [];
    setListings(rows);

    // Map shop names for admin view
    if (isAdmin && !shopId && rows.length > 0) {
      const ids = [...new Set(rows.map((r: any) => r.shop_id).filter(Boolean))];
      const { data: shopsData } = await supabase.from("shops").select("id, name").in("id", ids);
      setShopMap(new Map((shopsData || []).map((s: any) => [s.id, s.name])));
    }

    setIsLoading(false);
  };

  useEffect(() => { fetchListings(); }, [shopId]);

  // For admin creating a new ad without a preselected shop, pick the first shop
  useEffect(() => {
    if (!isAdmin || shopId) return;
    supabase.from("shops").select("id").eq("is_active", true).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.id) setDefaultShopId(data.id); });
  }, [isAdmin, shopId]);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setIsFormOpen(true); };
  const handleSuccess = () => { setIsFormOpen(false); setEditing(null); fetchListings(); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing/ad? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      fetchListings();
    }
  };

  const toggleStatus = async (l: any) => {
    const newStatus = l.status === "available" ? "draft" : "available";
    await supabase.from("listings").update({ status: newStatus }).eq("id", l.id);
    fetchListings();
  };

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      (shopMap.get(l.shop_id) || "").toLowerCase().includes(q)
    );
  });

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
                {shopName ? `${shopName} Ads` : "Shop Advertisements"}
              </CardTitle>
              <CardDescription>
                Every ad is a full listing — price, category, contacts & images included.
                Visible across the shop page and the entire marketplace.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />New Ad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No shop ads yet. Create your first one!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad / Listing</TableHead>
                  {isAdmin && !shopId && <TableHead>Shop</TableHead>}
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const img = parseImages(l.images)?.[0];
                  const incomplete = !l.category || (!l.price && !l.is_free);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                            {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{l.title || "Untitled"}</p>
                              <Badge variant="secondary" className="text-xs">{l.listing_type}</Badge>
                              {l.is_featured && <Badge className="text-xs">Featured</Badge>}
                              {l.is_sponsored && <Badge variant="outline" className="text-xs">Sponsored</Badge>}
                            </div>
                            {incomplete && (
                              <p className="text-xs text-destructive mt-0.5 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Missing details — click Edit
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {isAdmin && !shopId && <TableCell className="text-sm">{shopMap.get(l.shop_id) || "—"}</TableCell>}
                      <TableCell className="text-sm">
                        {l.is_free ? "FREE" : l.price ? `KES ${Number(l.price).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{l.category || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "available" ? "default" : "destructive"}>
                          {l.status === "available" ? "Active" : l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(l.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/${typePath(l.listing_type)}/${l.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(l)}>
                          {l.status === "available" ? "Pause" : "Resume"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ad / Listing" : "Create New Ad / Listing"}</DialogTitle>
            <DialogDescription>
              Fill in all details — price, category, images, location. Your ad will appear in the shop and across the marketplace.
            </DialogDescription>
          </DialogHeader>
          <ListingForm
            listing={editing}
            shopId={shopId || defaultShopId || undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setIsFormOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
