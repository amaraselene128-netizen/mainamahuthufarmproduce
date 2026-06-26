// Rewarded ad program constants — keep in sync with the SQL `credit_ad_view` RPC.
export const AD_DURATIONS = [15, 30, 45, 60] as const;
export type AdDuration = (typeof AD_DURATIONS)[number];

// User reward per completed view (cents).
export const REWARD_CENTS: Record<AdDuration, number> = { 15: 1, 30: 2, 45: 3, 60: 4 };

// Advertiser pays (cents). Advertiser cost = user reward + 4¢.
export const ADVERTISER_CENTS: Record<AdDuration, number> = { 15: 5, 30: 6, 45: 7, 60: 8 };

// Bronze $100, Silver $1000, Gold $10000 — keep in sync with public.referral_plans.price_cents.
export const TIER_PRICE_CENTS = { bronze: 10000, silver: 100000, gold: 1000000 } as const;
// Optional monthly subscription tier (half-price recurring access).
export const TIER_MONTHLY_CENTS = { bronze: 5000, silver: 50000, gold: 500000 } as const;
export type Tier = keyof typeof TIER_PRICE_CENTS;

export const BUTTON_TEXT_OPTIONS = [
  "Install Now",
  "Download",
  "Visit Site",
  "Watch on YouTube",
  "Learn More",
  "Play Now",
] as const;

export function formatCents(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

export function viewsForBudget(budgetCents: number, dur: AdDuration): number {
  return Math.floor(budgetCents / ADVERTISER_CENTS[dur]);
}

export function tierProgress(balanceCents: number, tier: Tier) {
  const price = TIER_PRICE_CENTS[tier];
  const pct = Math.min(100, Math.round((balanceCents / price) * 100));
  return { price, pct, remaining: Math.max(0, price - balanceCents) };
}
