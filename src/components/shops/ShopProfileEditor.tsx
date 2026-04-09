import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryImageUpload } from "@/components/shared/CloudinaryImageUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/untyped-client";
import { Loader2 } from "lucide-react";
import type { Shop } from "@/hooks/useShops";

interface ShopProfileEditorProps {
  shop: Shop;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ShopProfileEditor({ shop, onSuccess, onCancel }: ShopProfileEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: shop.name,
    description: shop.description || "",
    location: shop.location || "",
    phone: shop.phone || "",
    email: shop.email || "",
    category: shop.category || "",
    whatsapp: shop.whatsapp || "",
    facebook: shop.facebook || "",
    instagram: shop.instagram || "",
    twitter: shop.twitter || "",
    tiktok: shop.tiktok || "",
    youtube: shop.youtube || "",
    linkedin: shop.linkedin || "",
    telegram: shop.telegram || "",
  });
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || "");
  const [coverUrl, setCoverUrl] = useState(shop.cover_image_url || "");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        phone: form.phone || null,
        email: form.email || null,
        category: form.category || null,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        whatsapp: form.whatsapp || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        twitter: form.twitter || null,
        tiktok: form.tiktok || null,
        youtube: form.youtube || null,
        linkedin: form.linkedin || null,
        telegram: form.telegram || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shop.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop updated!" });
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Images */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block text-xs">Shop Logo</Label>
          <CloudinaryImageUpload value={logoUrl} onChange={setLogoUrl} aspectRatio="aspect-square" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Cover Image</Label>
          <CloudinaryImageUpload value={coverUrl} onChange={setCoverUrl} aspectRatio="aspect-video" />
        </div>
      </div>

      <div className="grid gap-3">
        <div>
          <Label htmlFor="shop-name" className="text-xs">Shop Name *</Label>
          <Input id="shop-name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="shop-desc" className="text-xs">Description</Label>
          <Textarea id="shop-desc" value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={form.category} onChange={(e) => handleChange("category", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} type="email" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <Label className="text-xs font-semibold mb-2 block">Social Links</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["whatsapp", "facebook", "instagram", "twitter", "tiktok", "youtube", "linkedin", "telegram"] as const).map((key) => (
            <div key={key}>
              <Label className="text-xs capitalize">{key}</Label>
              <Input
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={key === "whatsapp" ? "+254..." : `https://...`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
