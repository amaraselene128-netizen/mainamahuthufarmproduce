// Admin user actions: suspend, ban, grant tier.
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

  const { action, user_id, value } = body;
  if (!action || !user_id) return json({ error: "action and user_id required" }, 400);

  if (action === "set_suspended" || action === "set_banned") {
    const field = action === "set_suspended" ? "suspended" : "banned";
    const { error } = await ctx.admin
      .from("profiles")
      .update({ [field]: Boolean(value) })
      .eq("id", user_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "grant_tier") {
    const tier = String(body.tier ?? "").toLowerCase();
    if (!["bronze", "silver", "gold"].includes(tier)) return json({ error: "Valid tier required" }, 400);

    const { data: plan, error: planError } = await ctx.admin
      .from("referral_plans")
      .select("id,tier")
      .eq("tier", tier)
      .eq("active", true)
      .maybeSingle();
    if (planError) return json({ error: planError.message }, 500);
    if (!plan?.id) return json({ error: `Plan not found for ${tier}` }, 404);

    const { error: subError } = await ctx.admin
      .from("referral_subscriptions")
      .upsert({ user_id, plan_id: plan.id, active: true, expires_at: null }, { onConflict: "user_id" });
    if (subError) return json({ error: subError.message }, 500);

    const { error: profileError } = await ctx.admin
      .from("profiles")
      .update({ active_tier: tier })
      .eq("id", user_id);
    if (profileError) return json({ error: profileError.message }, 500);

    return json({ ok: true, tier });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});

// Ensure OPTIONS handled (requireAdmin returns early)
export {};
void corsHeaders;
