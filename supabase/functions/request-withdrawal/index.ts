// Worker-initiated withdrawal request. Validates the payout window and balance
// server-side, then either creates a pending request (closed window — should be
// blocked by the UI anyway) or instantly debits the wallet + marks paid.
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

function isWindowOpen(now: Date): boolean {
  const d = now.getUTCDate();
  return d >= 28 || d <= 5;
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
    const userId = u.user.id;

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const method = String(body?.method ?? "");
    const details = body?.details ?? {};

    if (!amount || amount < 10) return json({ error: "Minimum withdrawal is $10" }, 400);
    if (!method) return json({ error: "Method required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: wallet, error: wErr } = await admin
      .from("wallets").select("available,pending,total_withdrawn").eq("user_id", userId).maybeSingle();
    if (wErr) return json({ error: wErr.message }, 500);
    const available = Number(wallet?.available ?? 0);
    if (amount > available) return json({ error: "Insufficient available balance" }, 400);

    const open = isWindowOpen(new Date());

    // Always create a pending withdrawal request. Inside the payout window
    // the admin can approve quickly; outside, it queues for review.
    const { data: req_, error: rErr } = await admin
      .from("withdrawal_requests")
      .insert({
        user_id: userId,
        amount,
        method,
        details: { ...details, submitted_outside_window: !open },
        status: "pending",
      })
      .select("id")
      .single();
    if (rErr) return json({ error: rErr.message }, 500);

    const newAvailable = +(available - amount).toFixed(2);
    const currentPending = Number(wallet?.["pending"] ?? 0);
    const { error: w2Err } = await admin
      .from("wallets")
      .update({
        available: newAvailable,
        pending: +(currentPending + amount).toFixed(2),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (w2Err) return json({ error: w2Err.message }, 500);

    await admin.from("transactions").insert({
      user_id: userId,
      type: "withdrawal",
      amount: -amount,
      status: "pending",
      reference: req_.id,
      details: { method, ...details, window_open: open },
    });

    return json({ ok: true, id: req_.id, status: "pending", window_open: open });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
