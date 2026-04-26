import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudinaryImageUpload } from "@/components/shared/CloudinaryImageUpload";
import { Store, Edit, Loader2, Search, CheckCircle, XCircle, UserCog } from "lucide-react";
import { format } from "date-fns";
import type { Shop } from "@/hooks/useShops";

import { sectionLabelsForType } from "@/lib/categories";
const SHOP_CATEGORIES = sectionLabelsForType("all");

export function AdminShopEditor() {
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchShops = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setShops(data as Shop[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchShops(); }, []);

  const openEditor = async (shop: Shop) => {
    setEditingShop(shop);
    setForm({
      name: shop.name || "",
      slug: shop.slug || "",
      description: shop.description || "",
      category: shop.category || "",
      location: shop.location || "",
      phone: shop.phone || "",
      email: shop.email || "",
      whatsapp: shop.whatsapp || "",
      facebook: shop.facebook || "",
      instagram: shop.instagram || "",
      twitter: shop.twitter || "",
      tiktok: shop.tiktok || "",
      youtube: shop.youtube || "",
      linkedin: shop.linkedin || "",
      telegram: shop.telegram || "",
      logo_url: shop.logo_url || "",
      cover_image_url: shop.cover_image_url || "",
    });
    // Fetch current owner email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", shop.user_id)
      .maybeSingle();
    setOwnerEmail(profile?.email || "");
  };

  const handleTransferOwnership = async () => {
    if (!editingShop || !ownerEmail.trim()) return;
    setIsTransferring(true);

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", ownerEmail.trim())
      .maybeSingle();

    if (!profile) {
      toast({ title: "User not found", description: "No user with that email exists", variant: "destructive" });
      setIsTransferring(false);
      return;
    }

    const { error } = await supabase
      .from("shops")
      .update({ user_id: profile.user_id })
      .eq("id", editingShop.id);

    if (error) {
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ownership transferred ✅" });
      fetchShops();
    }
    setIsTransferring(false);
  };

  const handleSave = async () => {
    if (!editingShop) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        location: form.location.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        facebook: form.facebook.trim() || null,
        instagram: form.instagram.trim() || null,
        twitter: form.twitter.trim() || null,
        tiktok: form.tiktok.trim() || null,
        youtube: form.youtube.trim() || null,
        linkedin: form.linkedin.trim() || null,
        telegram: form.telegram.trim() || null,
        logo_url: form.logo_url.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      })
      .eq("id", editingShop.id);

    if (error) {
      toast({ title: "Error updating shop", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop updated successfully! ✅" });
      setEditingShop(null);
      fetchShops();
    }
    setIsSaving(false);
  };

  const toggleActive = async (shop: Shop) => {
    const { error } = await supabase
      .from("shops")
      .update({ is_active: !shop.is_active })
      .eq("id", shop.id);
    if (!error) {
      toast({ title: `Shop ${shop.is_active ? "deactivated" : "activated"}` });
      fetchShops();
    }
  };

  const toggleVerified = async (shop: Shop) => {
    const { error } = await supabase
      .from("shops")
      .update({ is_verified: !shop.is_verified })
      .eq("id", shop.id);
    if (!error) {
      toast({ title: `Shop ${shop.is_verified ? "unverified" : "verified"} ✅` });
      fetchShops();
    }
  };

  const filtered = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />All Shops</CardTitle>
          <CardDescription>Full control over all shops — edit details, contacts, images, ownership, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shops..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {shop.logo_url && (
                        <img src={shop.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      )}
                      {shop.name}
                      {shop.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{shop.category || "—"}</Badge></TableCell>
                  <TableCell>{shop.location || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={shop.is_active ? "default" : "destructive"}>
                      {shop.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(shop.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditor(shop)}>
                      <Edit className="h-4 w-4 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(shop)}>
                      {shop.is_active ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      {shop.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleVerified(shop)}>
                      {shop.is_verified ? "Unverify" : "Verify ✅"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingShop} onOpenChange={(open) => !open && setEditingShop(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop: {editingShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ownership Transfer */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="h-5 w-5 text-primary" />
                <p className="font-medium">Shop Ownership</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Owner email address"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleTransferOwnership}
                  disabled={isTransferring}
                >
                  {isTransferring && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Transfer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Change the owner by entering the new owner's email address
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Shop Name</Label><Input value={form.name} onChange={(e) => updateField("name", e.target.value)} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} /></div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{SHOP_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => updateField("location", e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} /></div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Social Media</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => updateField("facebook", e.target.value)} /></div>
                <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} /></div>
                <div><Label>Twitter / X</Label><Input value={form.twitter} onChange={(e) => updateField("twitter", e.target.value)} /></div>
                <div><Label>TikTok</Label><Input value={form.tiktok} onChange={(e) => updateField("tiktok", e.target.value)} /></div>
                <div><Label>YouTube</Label><Input value={form.youtube} onChange={(e) => updateField("youtube", e.target.value)} /></div>
                <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} /></div>
                <div><Label>Telegram</Label><Input value={form.telegram} onChange={(e) => updateField("telegram", e.target.value)} /></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Images (upload directly)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Shop Logo</Label>
                  <CloudinaryImageUpload
                    value={form.logo_url}
                    onChange={(url) => updateField("logo_url", url)}
                    label="Upload Logo"
                    aspectRatio="aspect-square"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Cover Image</Label>
                  <CloudinaryImageUpload
                    value={form.cover_image_url}
                    onChange={(url) => updateField("cover_image_url", url)}
                    label="Upload Cover"
                    aspectRatio="aspect-video"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingShop(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
