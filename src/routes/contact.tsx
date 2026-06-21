import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StaticShell } from "@/components/site/StaticShell";
import { Mail, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact EGRATASKS" },
      { name: "description", content: "Get in touch with EGRATASKS support, partnerships or press — Headquartered in Nairobi, Kenya." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.from("market_submissions").insert({
      link_type: "service", url: "contact-form", notes: `From ${form.name} <${form.email}>: ${form.message}`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setForm({ name: "", email: "", message: "" });
    toast.success("Message sent — we'll reply within 24h.");
  }
  return (
    <StaticShell title="Get in touch" sub="Email-only support — we respond within 24 hours, Mon-Sun.">
      <div className="grid md:grid-cols-2 gap-10 mt-8 not-prose">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3"><MapPin className="size-5 text-primary mt-0.5" /><div><div className="font-semibold text-foreground">Headquarters</div><div className="text-muted-foreground">EGRATASKS Headquarters<br />Nairobi, Kenya</div></div></div>
          <div className="flex items-start gap-3"><Mail className="size-5 text-primary mt-0.5" /><div><div className="font-semibold text-foreground">Email</div><div className="text-muted-foreground">support@egratasks.com</div></div></div>
        </div>
        <form onSubmit={submit} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-3">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="How can we help?" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <button disabled={loading} className="rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">{loading ? "Sending…" : "Send message"}</button>
        </form>
      </div>
    </StaticShell>
  );
}