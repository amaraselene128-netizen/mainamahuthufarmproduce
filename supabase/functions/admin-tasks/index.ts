// Admin task actions: change status, delete.
import { requireAdmin, json } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: { action?: string; id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, id, status } = body;
  if (!action || !id) return json({ error: "action and id required" }, 400);

  if (action === "set_status") {
    if (!status) return json({ error: "status required" }, 400);
    const { error } = await ctx.admin.from("tasks").update({ status }).eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await ctx.admin.from("tasks").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
