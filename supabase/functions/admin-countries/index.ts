// Admin country restriction toggle.
import { requireAdmin, json } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: { code?: string; restricted?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { code, restricted } = body;
  if (!code || typeof restricted !== "boolean") {
    return json({ error: "code and restricted required" }, 400);
  }

  const { error } = await ctx.admin.from("countries").update({ restricted }).eq("code", code);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
