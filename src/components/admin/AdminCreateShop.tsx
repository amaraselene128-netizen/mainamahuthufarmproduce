import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/untyped-client";

import { sectionLabelsForType } from "@/lib/categories";
const SHOP_CATEGORIES = sectionLabelsForType("all");

export function AdminCreateShop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", category: "", location: "",
    phone: "", email: "", whatsapp: "", facebook: "", instagram: "",
    twitter: "", tiktok: "", youtube: "", linkedin: "", telegram: "",
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const handleNameChange = (name: string) => setForm((f) => ({ ...f, name, slug: generateSlug(name) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from("shops").insert({
      user_id: user.id,
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
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop created by admin! 🎉" });
      setIsOpen(false);
      setForm({ name: "", slug: "", description: "", category: "", location: "", phone: "", email: "", whatsapp: "", facebook: "", instagram: "", twitter: "", tiktok: "", youtube: "", linkedin: "", telegram: "" });
    }
    setIsSubmitting(false);
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" />Create Shop</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shop (Admin)</DialogTitle>
          <DialogDescription>Create a new shop directly as admin</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Shop Name *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Shop Name" required />
            </div>
            <div>
              <Label>URL Slug</Label>
              <Input value={form.slug} onChange={(e) => updateField("slug", generateSlug(e.target.value))} placeholder="shop-name" />
            </div>
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
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Shop description..." rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Nairobi, Kenya" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+254..." /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="shop@email.com" /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="+254..." /></div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Social Media Links (optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => updateField("facebook", e.target.value)} placeholder="https://facebook.com/..." /></div>
              <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} placeholder="https://instagram.com/..." /></div>
              <div><Label>Twitter / X</Label><Input value={form.twitter} onChange={(e) => updateField("twitter", e.target.value)} placeholder="https://x.com/..." /></div>
              <div><Label>TikTok</Label><Input value={form.tiktok} onChange={(e) => updateField("tiktok", e.target.value)} placeholder="https://tiktok.com/@..." /></div>
              <div><Label>YouTube</Label><Input value={form.youtube} onChange={(e) => updateField("youtube", e.target.value)} placeholder="https://youtube.com/..." /></div>
              <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} placeholder="https://linkedin.com/..." /></div>
              <div><Label>Telegram</Label><Input value={form.telegram} onChange={(e) => updateField("telegram", e.target.value)} placeholder="https://t.me/..." /></div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Create Shop
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
