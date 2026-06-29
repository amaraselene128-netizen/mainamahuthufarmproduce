import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, X, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "egmtasks.tier-reminder.dismissed-at";
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const FIRST_DELAY_MS = 25 * 1000; // give the dashboard time to settle first

export function TierReminderPopup() {
  const { user } = useAuth();
  const [hasTier, setHasTier] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  // Determine whether the user already has an active tier subscription.
  useEffect(() => {
    let cancelled = false;
    if (!user) { setHasTier(null); return; }
    (async () => {
      // Best-effort cleanup of expired rows so the badge reflects reality.
      try { await db.rpc("purge_expired_subscriptions" as any); } catch { /* ignore */ }
      const { data } = await db
        .from("referral_subscriptions")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const row = data as any;
      const active = !!row && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now());
      setHasTier(active);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Pop every 10 minutes for users without a tier.
  useEffect(() => {
    if (hasTier !== false) return;
    const shouldShow = () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      return Date.now() - last >= INTERVAL_MS;
    };
    const firstTimer = setTimeout(() => {
      if (shouldShow()) setOpen(true);
    }, FIRST_DELAY_MS);
    const id = setInterval(() => {
      if (shouldShow()) setOpen(true);
    }, INTERVAL_MS);
    return () => { clearTimeout(firstTimer); clearInterval(id); };
  }, [hasTier]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  }

  if (!open || hasTier !== false) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-md w-full rounded-2xl border hairline bg-card shadow-luxe p-5 relative">
        <button
          onClick={dismiss}
          aria-label="Dismiss reminder"
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 text-primary p-2">
            <Crown className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold flex items-center gap-2">
              Unlock a referral tier
              <Sparkles className="size-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              Tier members earn cash directly to their wallet for every ad watched,
              get higher-paying tasks, and earn referral commissions across three generations.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/dashboard/earn/unlock"
                onClick={dismiss}
                className="rounded-lg bg-gradient-gold text-primary-foreground px-3 py-2 text-xs font-semibold shadow-card"
              >
                Learn more
              </Link>
              <button
                onClick={dismiss}
                className="rounded-lg border border-input px-3 py-2 text-xs font-semibold hover:bg-accent"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
