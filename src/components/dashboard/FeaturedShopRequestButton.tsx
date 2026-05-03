import { useEffect, useState } from "react";
import { Sparkles, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/untyped-client";

interface Props {
  shopId: string;
  shopName: string;
}

export function FeaturedShopRequestButton({ shopId, shopName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [duration, setDuration] = useState("7");

  useEffect(() => {
    if (!user || !shopId) return;
    (supabase.from("shop_featured_requests" as any) as any)
      .select("*")
      .eq("shop_id", shopId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => setExisting(data));
  }, [user, shopId]);

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await (supabase.from("shop_featured_requests" as any) as any).insert({
      shop_id: shopId,
      user_id: user.id,
      duration_days: parseInt(duration),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "Pending admin approval." });
      setIsOpen(false);
      const { data } = await (supabase.from("shop_featured_requests" as any) as any)
        .select("*").eq("shop_id", shopId).eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      setExisting(data);
    }
    setIsLoading(false);
  };

  if (existing) {
    const cfg: Record<string, any> = {
      pending: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "Pending" },
      approved: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Featured" },
      rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Declined" },
    };
    const c = cfg[existing.status] || cfg.pending;
    const Icon = c.icon;
    return <Badge className={c.color}><Icon className="h-3 w-3 mr-1" />Featured: {c.label}</Badge>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4" />Promote to Featured List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to Featured Shops List</DialogTitle>
          <DialogDescription>
            Request to add "{shopName}" to the hand-picked Elite Storefronts shown after Featured Listings. Admin approval required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Featured List Benefits:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Hand-picked placement after Featured Listings</li>
              <li>• Premium gradient title showcase</li>
              <li>• 3× more shop visits on average</li>
              <li>• Verified trust signal for buyers</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
