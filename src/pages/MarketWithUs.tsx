import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MARKET_CATEGORIES, ALL_MARKET_CATEGORIES } from "@/data/market-categories";
import { useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { uploadManyToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Megaphone, Upload } from "lucide-react";

export default function MarketWithUs() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    website_url: "",
    video_url: "",
    social_url: "",
    budget: "",
    target_countries: "",
    start_date: "",
    end_date: "",
    instructions: "",
    contact_email: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let attachments: string[] = [];
      if (files.length) {
        const ups = await uploadManyToCloudinary(files, { folder: "market_campaigns" });
        attachments = ups.map((u) => u.secure_url);
      }
      const payload = {
        user_id: user?.id ?? null,
        category: form.category,
        title: form.title,
        description: form.description,
        website_url: form.website_url || null,
        video_url: form.video_url || null,
        social_url: form.social_url || null,
        budget: form.budget ? Number(form.budget) : null,
        target_countries: form.target_countries
          ? form.target_countries.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        instructions: form.instructions || null,
        contact_email: form.contact_email || null,
        attachments,
        status: "pending",
      };
      const { error } = await db.from("market_campaigns").insert(payload);
      if (error) throw error;
      toast.success("Campaign submitted — pending approval");
      setForm({
        category: "", title: "", description: "", website_url: "", video_url: "",
        social_url: "", budget: "", target_countries: "", start_date: "", end_date: "",
        instructions: "", contact_email: "",
      });
      setFiles([]);
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Megaphone className="size-3.5" /> Market with us
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Promote anything, <span className="text-gradient-gold">to a real global audience.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Submit your campaign in any of the categories below. Our verified workers across 100+ countries
              will engage with your content — real views, real clicks, real conversions.
            </p>
          </div>

          {/* Catalog */}
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MARKET_CATEGORIES.map((g) => (
              <div key={g.group} className="rounded-2xl border hairline bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">{g.group}</h2>
                <ul className="mt-3 space-y-1.5">
                  {g.items.map((it) => (
                    <li key={it} className="text-sm text-muted-foreground">• {it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Submission form */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-center">Submit a campaign</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Fill in the form below. We'll review and reach out at the email you provide.
            </p>
            <form onSubmit={submit} className="mt-8 rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
              <Sel
                label="Campaign category"
                required
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
              >
                <option value="">— Select —</option>
                {MARKET_CATEGORIES.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((it) => <option key={it} value={it}>{it}</option>)}
                  </optgroup>
                ))}
              </Sel>
              <In label="Campaign title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Ta label="Description" required value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} />
              <div className="grid sm:grid-cols-2 gap-4">
                <In label="Website URL" value={form.website_url} onChange={(v) => setForm({ ...form, website_url: v })} />
                <In label="Video URL" value={form.video_url} onChange={(v) => setForm({ ...form, video_url: v })} />
              </div>
              <In label="Social media URL" value={form.social_url} onChange={(v) => setForm({ ...form, social_url: v })} />
              <div className="grid sm:grid-cols-2 gap-4">
                <In label="Budget (USD)" type="number" min="0" step="1" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
                <In label="Target countries (comma separated codes)" placeholder="US, GB, KE" value={form.target_countries} onChange={(v) => setForm({ ...form, target_countries: v })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <In label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
                <In label="End date" type="date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
              </div>
              <Ta label="Instructions for workers" value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} rows={3} />
              <In label="Contact email" type="email" required value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />

              <label className="block">
                <span className="text-sm font-medium">Attachments</span>
                <div className="mt-1.5 rounded-xl border border-dashed border-input p-4 bg-background/40">
                  <label htmlFor="market-files" className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
                    <Upload className="size-4" /> Choose files (images/videos)
                  </label>
                  <input
                    id="market-files"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                  {files.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">{files.length} file(s) selected</div>
                  )}
                </div>
              </label>

              <button
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-emerald px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-card hover:shadow-glow disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit campaign for approval"}
              </button>
              {user ? (
                <p className="text-xs text-center text-muted-foreground">
                  Submitting as <strong>{user.email}</strong>. Track status under your dashboard.
                </p>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  You can submit without an account, but signing in lets you track campaign status.
                </p>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function In({ label, value, onChange, ...p }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input {...p} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
function Ta({ label, value, onChange, ...p }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea {...p} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
function Sel({ label, value, onChange, required, children }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
        {children}
      </select>
    </label>
  );
}
