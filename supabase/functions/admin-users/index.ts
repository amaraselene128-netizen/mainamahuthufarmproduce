// Admin user actions: suspend/ban + grant/revoke admin role.
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
    if (error) return json({ error: `Update failed: ${error.message}` }, 500);
    return json({ ok: true });
  }

  if (action === "set_admin") {
    if (value) {
      const { error } = await ctx.admin
        .from("user_roles")
        .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) return json({ error: `Grant admin failed: ${error.message}` }, 500);
    } else {
      const { error } = await ctx.admin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
      if (error) return json({ error: `Revoke admin failed: ${error.message}` }, 500);
    }
    return json({ ok: true });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});

// Ensure OPTIONS handled (requireAdmin returns early)
export {};
void corsHeaders;
