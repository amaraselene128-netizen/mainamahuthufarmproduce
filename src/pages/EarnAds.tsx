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

type Ad = {
  id: string;
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

  const tierActive = Boolean((profile as any)?.active_tier);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [adsRes, viewsRes, creditRes, walletRes] = await Promise.all([
      db.from("advertisements")
        .select("id,title,description,video_url,destination_url,button_text,duration_seconds,spent_cents,budget_cents,country_targeting")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      db.from("ad_views").select("ad_id").eq("user_id", user.id).eq("completed", true),
      db.from("tier_credits").select("balance_cents").eq("user_id", user.id).maybeSingle(),
      db.from("wallets").select("available").eq("user_id", user.id).maybeSingle(),
    ]);
    const country = profile?.country_code ?? null;
    const list = ((adsRes.data as any[]) ?? [])
      .filter((a) => a.spent_cents < a.budget_cents)
      .filter((a) => !a.country_targeting?.length || (country && a.country_targeting.includes(country)));
    setAds(list as Ad[]);
    setCompletedIds(new Set(((viewsRes.data as any[]) ?? []).map((v) => v.ad_id)));
    if (tierActive) {
      setBalance(Math.round(Number((walletRes.data as any)?.available ?? 0) * 100));
    } else {
      setBalance(Number((creditRes.data as any)?.balance_cents ?? 0));
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id, tierActive]);

  const available = useMemo(() => ads.filter((a) => !completedIds.has(a.id)), [ads, completedIds]);
  const prog = tierProgress(balance, tier);

  async function creditView(ad: Ad) {
    const fp = deviceFingerprint();
    const { data, error } = await supabase.functions.invoke("request-credit-ad-view", {
      body: { ad_id: ad.id, watched_seconds: ad.duration_seconds, fingerprint: fp },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Could not credit view");
      return;
    }
    const d = data as any;
    setBalance(d.balance_cents);
    setCompletedIds((s) => new Set(s).add(ad.id));
    const dest = d.destination === "wallet" ? "to wallet" : "tier credit";
    toast.success(`Earned ${formatCents(REWARD_CENTS[ad.duration_seconds])} ${dest}`);
    setShowCta(true);
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Tv className="size-7 text-primary" /> Earn by watching ads
        </h1>
        <Link
          to="/dashboard/earn/unlock"
          className="text-xs rounded-lg bg-gradient-gold text-primary-foreground px-3 py-2 font-semibold inline-flex items-center gap-1.5"
        >
          <Crown className="size-3.5" /> Unlock tier
        </Link>
      </div>

      <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            <span className="font-display text-2xl font-semibold text-gradient-gold">{formatCents(balance)}</span>
            <span className="text-xs text-muted-foreground">tier credits (non-withdrawable)</span>
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
              You can unlock {tier} now →
            </Link>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">
              {formatCents(prog.remaining)} remaining to unlock {tier}.
            </div>
          )}
        </div>
      </div>

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
                <span className="text-xs text-muted-foreground">{a.duration_seconds}s · earn {formatCents(REWARD_CENTS[a.duration_seconds])}</span>
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
