// Captures a PayPal order and activates the user's tier subscription on success.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function paypalBase() {
  return (Deno.env.get("PAYPAL_ENV") ?? "live") === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function paypalToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("Missing PayPal credentials");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${id}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const j = await res.json();
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u.user) return json({ error: "Invalid token" }, 401);

    const { order_id, tier } = (await req.json()) as { order_id?: string; tier?: string };
    if (!order_id || !tier) return json({ error: "order_id and tier required" }, 400);

    const token = await paypalToken();
    const capRes = await fetch(`${paypalBase()}/v2/checkout/orders/${order_id}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const capture = await capRes.json();
    if (!capRes.ok || capture.status !== "COMPLETED") {
      return json({ error: capture?.message ?? "Capture failed" }, 502);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: plan, error: planErr } = await admin
      .from("referral_plans")
      .select("id")
      .eq("tier", tier)
      .eq("active", true)
      .maybeSingle();
    if (planErr || !plan) return json({ error: planErr?.message ?? "Plan missing" }, 500);

    const { error: subErr } = await admin
      .from("referral_subscriptions")
      .upsert(
        { user_id: u.user.id, plan_id: (plan as { id: string }).id },
        { onConflict: "user_id" },
      );
    if (subErr) return json({ error: subErr.message }, 500);

    return json({ ok: true, capture_id: capture.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
