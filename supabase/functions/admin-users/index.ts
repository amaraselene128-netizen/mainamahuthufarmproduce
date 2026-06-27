// Admin user actions: suspend, ban, unsuspend, unban.
import { requireAdmin, json, corsHeaders } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: { action?: string; user_id?: string; value?: boolean };
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

  return json({ error: `Unknown action: ${action}` }, 400);
});

// Ensure OPTIONS handled (requireAdmin returns early)
export {};
void corsHeaders;
