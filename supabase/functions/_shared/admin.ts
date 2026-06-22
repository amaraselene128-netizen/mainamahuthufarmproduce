// Shared helpers for admin edge functions: CORS, JWT auth, admin check.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export type AdminContext = {
  userId: string;
  admin: SupabaseClient; // service-role client
};

/**
 * Verifies the caller's JWT and confirms they have the 'admin' role.
 * Returns a service-role client + the verified user id, or a Response on failure.
 */
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }

  // Verify the JWT
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);

  // Admin role check via security-definer function
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: hasRole, error: roleErr } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr) return json({ error: roleErr.message }, 500);
  if (!hasRole) return json({ error: "Forbidden: admin role required" }, 403);

  return { userId: userData.user.id, admin };
}
