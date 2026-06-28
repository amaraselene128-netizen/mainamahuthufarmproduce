import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db, supabase } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Play, Coins, Crown, Sparkles, Tv } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { AdPlayer } from "@/components/ads/AdPlayer";
import { AdCTA } from "@/components/ads/AdCTA";
import {
  formatCents, REWARD_CENTS, TIER_PRICE_CENTS, tierProgress, type Tier, type AdDuration,
} from "@/lib/ads";
import { deviceFingerprint } from "@/lib/fingerprint";
import { TierBadgeImg } from "@/components/site/TierBadgeImg";

type Ad = {
  id: string;
  kind: "ad" | "campaign";
  title: string;
  description: string | null;
  video_url: string;
  destination_url: string;
  button_text: string;
  duration_seconds: AdDuration;
  spent_cents: number;
  budget_cents: number;
};

function EarnAds() {
  const { user, profile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState(0);
  const [tier, setTier] = useState<Tier>("bronze");
  const [active, setActive] = useState<Ad | null>(null);
  const [showCta, setShowCta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTier, setHasTier] = useState(false);
  const [activeTier, setActiveTier] = useState<Tier | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [adsRes, campRes, viewsRes, campViewsRes, creditRes, subRes] = await Promise.all([
      db.from("advertisements")
        .select("id,title,description,video_url,destination_url,button_text,duration_seconds,spent_cents,budget_cents,country_targeting")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      db.from("market_campaigns")
        .select("id,title,description,video_url,video_file_url,website_url,social_url,duration_seconds,target_countries,promotion_type")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      db.from("ad_views").select("ad_id").eq("user_id", user.id).eq("completed", true),
      db.from("campaign_views").select("campaign_id").eq("user_id", user.id).eq("completed", true),
      db.from("tier_credits").select("balance_cents").eq("user_id", user.id).maybeSingle(),
      db.from("referral_subscriptions").select("id,active,expires_at,referral_plans(tier)").eq("user_id", user.id).maybeSingle(),
    ]);
    const country = profile?.country_code?.toUpperCase() ?? null;
    const adList: Ad[] = ((adsRes.data as any[]) ?? [])
      .filter((a) => a.spent_cents < a.budget_cents)
      .filter((a) => !a.country_targeting?.length || (country && a.country_targeting.map((c: string) => c.toUpperCase()).includes(country)))
      .map((a) => ({ ...a, kind: "ad" as const }));
    const campList: Ad[] = ((campRes.data as any[]) ?? [])
      .filter((c) => !c.target_countries?.length || (country && c.target_countries.map((x: string) => x.toUpperCase()).includes(country)))
      .map((c) => {
        const video = c.video_file_url || c.video_url || c.social_url || c.website_url || "";
        const dest = c.website_url || c.social_url || c.video_url || "#";
        const dur = (c.duration_seconds ?? 30) as AdDuration;
        return {
          id: c.id,
          kind: "campaign" as const,
          title: c.title,
          description: c.description,
          video_url: video,
          destination_url: dest,
          button_text: "Visit",
          duration_seconds: (([15,30,45,60] as number[]).includes(dur) ? dur : 30) as AdDuration,
          spent_cents: 0,
          budget_cents: 1,
        };
      })
      .filter((c) => !!c.video_url);
    setAds([...adList, ...campList]);
    const done = new Set<string>();
    ((viewsRes.data as any[]) ?? []).forEach((v) => done.add(`ad:${v.ad_id}`));
    ((campViewsRes.data as any[]) ?? []).forEach((v) => done.add(`campaign:${v.campaign_id}`));
    setCompletedIds(done);
    setBalance(Number((creditRes.data as any)?.balance_cents ?? 0));
    const sub = subRes.data as any;
    const tierName = (sub?.referral_plans?.tier ?? profile?.active_tier) as Tier | undefined;
    const tierLive = Boolean(profile?.active_tier) || (Boolean(sub?.id) && sub?.active !== false && (!sub?.expires_at || new Date(sub.expires_at) > new Date()));
    setHasTier(tierLive);
    setActiveTier(tierLive ? tierName ?? null : null);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  const available = useMemo(() => ads.filter((a) => !completedIds.has(`${a.kind}:${a.id}`)), [ads, completedIds]);
  const prog = tierProgress(balance, tier);

  async function creditView(ad: Ad) {
    const fp = deviceFingerprint();
    const payload =
      ad.kind === "campaign"
        ? { campaign_id: ad.id, kind: "campaign", watched_seconds: ad.duration_seconds, fingerprint: fp }
        : { ad_id: ad.id, kind: "ad", watched_seconds: ad.duration_seconds, fingerprint: fp };
    const { data, error } = await supabase.functions.invoke("request-credit-ad-view", { body: payload });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Could not credit view");
      return;
    }
    setBalance((data as any).balance_cents ?? balance);
    setCompletedIds((s) => new Set(s).add(`${ad.kind}:${ad.id}`));
    const paidTo = (data as any).paid_to;
    toast.success(
      paidTo === "wallet"
        ? `Earned ${formatCents(REWARD_CENTS[ad.duration_seconds])} to your wallet`
        : `Earned ${formatCents(REWARD_CENTS[ad.duration_seconds])} tier credit`
    );
    setShowCta(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Tv className="size-7 text-primary" /> Earn by watching ads
        </h1>
        {!hasTier && (
          <Link
            to="/dashboard/earn/unlock"
            className="text-xs rounded-lg bg-gradient-gold text-primary-foreground px-3 py-2 font-semibold inline-flex items-center gap-1.5"
          >
            <Crown className="size-3.5" /> Unlock tier
          </Link>
        )}
      </div>

      {hasTier ? (
        <div className="rounded-2xl border hairline bg-secondary/10 text-secondary px-4 py-3 text-sm flex items-center gap-2">
          <TierBadgeImg tier={activeTier} size={42} />
          <Coins className="size-4" /> Tier active — every completed ad or campaign pays real money straight to your wallet.
        </div>
      ) : (
        <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <Coins className="size-5 text-primary" />
              <span className="font-display text-2xl font-semibold text-gradient-gold">{formatCents(balance)}</span>
              <span className="text-xs text-muted-foreground">optional tier credits earned from ads</span>
            </div>
            <div className="flex rounded-xl border border-input overflow-hidden text-xs">
              {(["bronze","silver","gold"] as Tier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-3 py-1.5 capitalize ${tier === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                >
                  {t} · {formatCents(TIER_PRICE_CENTS[t])}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress to {tier} ({formatCents(prog.price)})</span>
              <span>{formatCents(balance)} / {formatCents(prog.price)} · {prog.pct}%</span>
            </div>
            <Progress value={prog.pct} />
            {prog.remaining === 0 ? (
              <Link to="/dashboard/earn/unlock" className="mt-2 inline-block text-xs font-semibold text-secondary">
                Optional: unlock {tier} now →
              </Link>
            ) : (
              <div className="mt-2 text-xs text-muted-foreground">
                Optional tier upgrade progress: {formatCents(prog.remaining)} remaining to unlock {tier}.
              </div>
            )}
          </div>
        </div>
      )}


      {active ? (
        <div className="space-y-3">
          <AdPlayer
            videoUrl={active.video_url}
            durationSeconds={active.duration_seconds}
            destinationUrl={active.destination_url}
            onCtaClick={() => setShowCta(true)}
            onCompleted={() => creditView(active)}
            onAborted={(r) => toast.error(`Not credited: ${r}`)}
          />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">{active.title}</div>
              <div className="text-xs text-muted-foreground">
                {active.duration_seconds}s · earn {formatCents(REWARD_CENTS[active.duration_seconds])}
                {hasTier ? " cash" : " optional tier credit"}
              </div>
            </div>
            <button
              onClick={() => { setActive(null); setShowCta(false); load(); }}
              className="text-xs rounded-lg border border-input px-3 py-1.5"
            >
              Close
            </button>
          </div>
          {showCta && user && (
            <AdCTA
              adId={active.id}
              userId={user.id}
              destinationUrl={active.destination_url}
              buttonText={active.button_text}
              onClose={() => setShowCta(false)}
            />
          )}
        </div>
      ) : loading ? (
        <div className="text-muted-foreground">Loading ads…</div>
      ) : available.length === 0 ? (
        <div className="rounded-2xl border hairline bg-card p-10 text-center">
          <Sparkles className="size-6 mx-auto text-primary mb-2" />
          <div className="font-semibold">No ads available right now</div>
          <div className="text-sm text-muted-foreground mt-1">
            Check back soon — new campaigns go live throughout the day.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((a) => (
            <div key={a.id} className="rounded-2xl border hairline bg-card p-4 shadow-card space-y-3">
              <div className="aspect-video rounded-xl bg-black/80 grid place-items-center text-white/70 text-xs">
                <Play className="size-8" />
              </div>
              <div>
                <div className="font-semibold truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.description}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{a.duration_seconds}s · earn {formatCents(REWARD_CENTS[a.duration_seconds])}{hasTier ? " cash" : " optional tier credit"}</span>
                <button
                  onClick={() => { setActive(a); setShowCta(false); }}
                  className="text-xs rounded-lg bg-primary text-primary-foreground px-3 py-1.5 font-semibold"
                >
                  Watch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EarnAds;
