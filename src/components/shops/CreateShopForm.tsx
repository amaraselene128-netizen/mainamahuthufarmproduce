import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import { sectionLabelsForType } from "@/lib/categories";
const SHOP_CATEGORIES = sectionLabelsForType("all");

interface CreateShopFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateShopForm({ onSuccess, onCancel }: CreateShopFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAccountDetails, setUseAccountDetails] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", category: "", location: "",
    phone: "", whatsapp: "", facebook: "", instagram: "", twitter: "",
    tiktok: "", youtube: "", linkedin: "", telegram: "",
  });

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  useEffect(() => {
    if (useAccountDetails && profile) {
      setForm((f) => ({
        ...f,
        location: profile.location || f.location,
        phone: profile.phone || f.phone,
        whatsapp: profile.phone || f.whatsapp,
      }));
    }
  }, [useAccountDetails, profile]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: generateSlug(name) }));
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("shop_creation_requests").insert({
      user_id: user.id,
      shop_name: form.name.trim(),
      shop_slug: form.slug.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      location: form.location.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      facebook: form.facebook.trim() || null,
      instagram: form.instagram.trim() || null,
      twitter: form.twitter.trim() || null,
      tiktok: form.tiktok.trim() || null,
      youtube: form.youtube.trim() || null,
      linkedin: form.linkedin.trim() || null,
      telegram: form.telegram.trim() || null,
      use_account_details: useAccountDetails,
    });

    if (error) {
      toast({
        title: "Error submitting request",
        description: error.message.includes("duplicate") ? "A request for this shop name already exists" : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Shop request submitted! 🎉", description: "Your request is pending admin approval." });
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
        <Checkbox
          id="use-account"
          checked={useAccountDetails}
          onCheckedChange={(checked) => setUseAccountDetails(checked === true)}
        />
        <Label htmlFor="use-account" className="text-sm cursor-pointer">
          Use my account details as admin details
        </Label>
      </div>

      <div>
        <Label htmlFor="shop-name">Shop Name *</Label>
        <Input id="shop-name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Awesome Shop" required />
      </div>
      <div>
        <Label htmlFor="shop-slug">Shop URL</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
          sokoniarena.co.ke/shop/<span className="text-foreground font-medium">{form.slug || "your-shop"}</span>
        </div>
        <Input id="shop-slug" value={form.slug} onChange={(e) => updateField("slug", generateSlug(e.target.value))} placeholder="my-awesome-shop" />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {SHOP_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="shop-description">Description</Label>
        <Textarea id="shop-description" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Tell buyers about your shop..." rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Nairobi, Kenya" /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+254..." /></div>
        <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="+254..." /></div>
      </div>
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Social Media Links (optional)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => updateField("facebook", e.target.value)} placeholder="https://facebook.com/..." /></div>
          <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} placeholder="https://instagram.com/..." /></div>
          <div><Label>Twitter / X</Label><Input value={form.twitter} onChange={(e) => updateField("twitter", e.target.value)} placeholder="https://x.com/..." /></div>
          <div><Label>TikTok</Label><Input value={form.tiktok} onChange={(e) => updateField("tiktok", e.target.value)} placeholder="https://tiktok.com/@..." /></div>
          <div><Label>YouTube</Label><Input value={form.youtube} onChange={(e) => updateField("youtube", e.target.value)} placeholder="https://youtube.com/..." /></div>
          <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} placeholder="https://linkedin.com/..." /></div>
          <div><Label>Telegram</Label><Input value={form.telegram} onChange={(e) => updateField("telegram", e.target.value)} placeholder="https://t.me/..." /></div>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-sm text-amber-700 dark:text-amber-300">
        ⚠️ Your shop request will be reviewed by the admin team. You'll be notified once approved.
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Submit Request
        </Button>
      </div>
    </form>
  );
}
