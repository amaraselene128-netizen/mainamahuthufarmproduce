// Admin withdrawal actions: approve, mark paid, reject.
import { requireAdmin, json } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { id, status } = body;
  if (!id || !status) return json({ error: "id and status required" }, 400);
  if (!["approved", "paid", "rejected", "pending"].includes(status)) {
    return json({ error: "Invalid status" }, 400);
  }

  const patch: Record<string, unknown> = { status };
  if (status === "approved") patch.approved_at = new Date().toISOString();
  if (status === "paid") patch.paid_at = new Date().toISOString();

  const { error } = await ctx.admin.from("withdrawal_requests").update(patch).eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
