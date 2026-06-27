// Admin direct / broadcast message: inserts into public.messages and
// (optionally) public.notifications so the user sees both a Messages-tab
// item and a notification toast.
import { requireAdmin, json, corsHeaders } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  let body: {
    target?: "user" | "all";
    user_id?: string;
    subject?: string;
    body?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { target, user_id, subject, body: text } = body;
  if (!text || !text.trim()) return json({ error: "body is required" }, 400);
  if (target !== "user" && target !== "all") return json({ error: "target must be 'user' or 'all'" }, 400);

  let recipients: string[] = [];
  if (target === "user") {
    if (!user_id) return json({ error: "user_id required" }, 400);
    recipients = [user_id];
  } else {
    const { data, error } = await ctx.admin.from("profiles").select("id");
    if (error) return json({ error: error.message }, 500);
    recipients = (data ?? []).map((r: any) => r.id);
  }

  if (recipients.length === 0) return json({ ok: true, sent: 0 });

  const msgRows = recipients.map((to) => ({
    from_user: ctx.userId,
    to_user: to,
    subject: subject || "Message from Admin",
    body: text,
    is_admin: true,
  }));
  const notifRows = recipients.map((to) => ({
    user_id: to,
    type: "admin_message",
    title: subject || "Message from Admin",
    body: text.slice(0, 200),
    link: "/dashboard/messages",
  }));

  const [m, n] = await Promise.all([
    ctx.admin.from("messages").insert(msgRows),
    ctx.admin.from("notifications").insert(notifRows),
  ]);
  if (m.error) return json({ error: `messages: ${m.error.message}` }, 500);
  if (n.error) return json({ error: `notifications: ${n.error.message}` }, 500);

  return json({ ok: true, sent: recipients.length });
});

export {};
void corsHeaders;