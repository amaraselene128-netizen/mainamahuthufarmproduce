// Admin user actions: suspend, ban, unsuspend, unban, grant tier.
import { requireAdmin, json, corsHeaders } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: { action?: string; user_id?: string; value?: boolean; tier?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, user_id, value, tier } = body;
  if (!action || !user_id) return json({ error: "action and user_id required" }, 400);

  if (action === "set_suspended" || action === "set_banned") {
    const field = action === "set_suspended" ? "is_suspended" : "is_banned";
    const { error } = await ctx.admin
      .from("profiles")
      .update({ [field]: Boolean(value) })
      .eq("user_id", user_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "grant_tier") {
    if (!tier || !["bronze", "silver", "gold"].includes(tier)) {
      return json({ error: "Invalid tier" }, 400);
    }
    // Find the matching plan
    const { data: plan, error: planErr } = await ctx.admin
      .from("referral_plans")
      .select("id")
      .eq("tier", tier)
      .eq("active", true)
      .maybeSingle();
    if (planErr) return json({ error: planErr.message }, 500);
    if (!plan) return json({ error: `No active ${tier} plan configured` }, 400);

    // Upsert subscription (only uses columns that exist in referral_subscriptions)
    const { error: subErr } = await ctx.admin
      .from("referral_subscriptions")
      .upsert(
        { user_id, plan_id: (plan as { id: string }).id },
        { onConflict: "user_id" },
      );
    if (subErr) return json({ error: subErr.message }, 500);
    return json({ ok: true });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});

void corsHeaders;
