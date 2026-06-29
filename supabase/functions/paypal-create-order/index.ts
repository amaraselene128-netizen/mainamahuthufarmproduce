import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_BASE =
  (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

const PRICES: Record<string, number> = { bronze: 100, silver: 1000, gold: 10000 };

async function paypalToken() {
  const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${PAYPAL_ID}:${PAYPAL_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`PayPal auth failed: ${await r.text()}`);
  return (await r.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!PAYPAL_ID || !PAYPAL_SECRET) {
      return new Response(JSON.stringify({ error: "PayPal not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const auth = req.headers.get("Authorization") ?? "";
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { tier, returnUrl, cancelUrl, renewal } = await req.json();
    const t = String(tier ?? "").toLowerCase();
    const base = PRICES[t];
    if (!base) return new Response(JSON.stringify({ error: "Invalid tier" }), { status: 400, headers: corsHeaders });
    const amount = renewal ? base * 0.5 : base;
    const kind = renewal ? "renew" : "new";
    const label = renewal ? "Monthly renewal" : "Subscription";

    const token = await paypalToken();
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount.toFixed(2) },
          custom_id: `${user.id}:${t}:${kind}`,
          description: `EGMTASKS ${t.toUpperCase()} tier ${label}`,
        }],
        application_context: {
          brand_name: "EGMTASKS",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(JSON.stringify(order));
    const approve = (order.links ?? []).find((l: any) => l.rel === "approve")?.href;
    return new Response(JSON.stringify({ id: order.id, approveUrl: approve }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
