import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function ShopFeaturedRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data } = await (supabase.from("shop_featured_requests" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        (data as any[]).map(async (r: any) => {
          const { data: shop } = await supabase
            .from("shops").select("name, slug").eq("id", r.shop_id).maybeSingle();
          const { data: profile } = await supabase
            .from("profiles").select("username, email").eq("user_id", r.user_id).maybeSingle();
          return { ...r, shop, profile };
        })
      );
      setRequests(enriched);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (r: any, status: "approved" | "rejected") => {
    setProcessingId(r.id);
    const { error } = await (supabase.from("shop_featured_requests" as any) as any)
      .update({
        status,
        admin_notes: notes[r.id] || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (!error && status === "approved") {
      const until = new Date();
      until.setDate(until.getDate() + (r.duration_days || 7));
      await supabase.from("shops").update({
        is_featured: true,
        featured_until: until.toISOString(),
      }).eq("id", r.shop_id);
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      fetchRequests();
    }
    setProcessingId(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        Featured Shop Requests ({requests.length})
      </h3>
      {requests.length === 0 ? (
        <p className="text-muted-foreground text-sm">No featured shop requests yet.</p>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{r.shop?.name || "Unknown shop"}</p>
                  <p className="text-sm text-muted-foreground">
                    By {r.profile?.username || r.profile?.email || "Unknown"} • {r.duration_days} days
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(r.requested_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                  {r.status}
                </Badge>
              </div>
              {r.status === "pending" && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Admin notes (optional)"
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(r, "approved")} disabled={processingId === r.id}>
                      {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(r, "rejected")} disabled={processingId === r.id}>
                      <XCircle className="h-4 w-4" />Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
