import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  theme: string;
  is_active: boolean;
  is_verified: boolean;
  followers_count: number;
  views_count: number;
  rating: number;
  location: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  is_promoted: boolean;
  promoted_until: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

export function useShops(limit?: number) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      let query = supabase
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("followers_count", { ascending: false });

      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (!error && data) setShops(data as Shop[]);
      setIsLoading(false);
    };
    fetchShops();
  }, [limit]);

  return { shops, isLoading };
}

export function usePromotedShops(limit: number = 10) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      // First try promoted shops, then fill with top shops by followers
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("is_promoted", { ascending: false })
        .order("followers_count", { ascending: false })
        .limit(limit);
      if (!error && data) setShops(data as Shop[]);
      setIsLoading(false);
    };
    fetchShops();
  }, [limit]);

  return { shops, isLoading };
}

export function useShopBySlug(slug: string | undefined) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShop = useCallback(async () => {
    if (!slug) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!error && data) setShop(data as Shop);
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  return { shop, isLoading, refetch: fetchShop };
}

export function useMyShop() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShop = useCallback(async () => {
    if (!user) { setShop(null); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) setShop(data as Shop);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  return { shop, isLoading, refetch: fetchShop };
}

export function useShopFollow(shopId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFollowState = useCallback(async () => {
    if (!shopId) {
      setIsFollowing(false);
      setFollowersCount(0);
      return;
    }

    const [countResult, followResult] = await Promise.all([
      supabase
        .from("shop_followers")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      user
        ? supabase
            .from("shop_followers")
            .select("id")
            .eq("shop_id", shopId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (!countResult.error) {
      setFollowersCount(countResult.count || 0);
    }

    if (!followResult.error) {
      setIsFollowing(!!followResult.data);
    } else if (!user) {
      setIsFollowing(false);
    }
  }, [shopId, user]);

  useEffect(() => {
    void fetchFollowState();
  }, [fetchFollowState]);

  const toggleFollow = async () => {
    if (!user || !shopId) {
      toast({ title: "Sign in to follow shops", variant: "destructive" });
      return false;
    }

    setIsLoading(true);
    const previousFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    setIsFollowing(!previousFollowing);
    setFollowersCount(Math.max(0, previousFollowersCount + (previousFollowing ? -1 : 1)));

    const { error } = previousFollowing
      ? await supabase.from("shop_followers").delete().eq("shop_id", shopId).eq("user_id", user.id)
      : await supabase.from("shop_followers").insert({ shop_id: shopId, user_id: user.id });

    if (error) {
      setIsFollowing(previousFollowing);
      setFollowersCount(previousFollowersCount);
      toast({
        title: "Could not update follow status",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }

    // Sync followers_count on the shops table so it stays consistent everywhere
    const newCount = Math.max(0, previousFollowersCount + (previousFollowing ? -1 : 1));
    await supabase.from("shops").update({ followers_count: newCount }).eq("id", shopId);

    toast({
      title: previousFollowing ? "Shop unfollowed" : "Shop followed",
      description: previousFollowing
        ? "You will no longer receive updates from this shop."
        : "You'll now see updates from this shop more easily.",
    });

    await fetchFollowState();
    setIsLoading(false);
    return true;
  };

  return { isFollowing, toggleFollow, isLoading, followersCount, refreshFollowState: fetchFollowState };
}
