import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase, db } from "@/lib/db";
import { toast } from "sonner";
import { detectCountry } from "@/lib/country";

type Country = { code: string; name: string; restricted: boolean };

export const Route = createFileRoute("/auth/register")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({
    meta: [
      { title: "Register — EGRATASKS" },
      { name: "description", content: "Create your free EGRATASKS account in seconds and start earning or hiring across 100+ countries." },
      { property: "og:title", content: "Register — EGRATASKS" },
      { property: "og:url", content: "/auth/register" },
    ],
    links: [{ rel: "canonical", href: "/auth/register" }],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { ref } = useSearch({ from: "/auth/register" });
  const [accountMode, setAccountMode] = useState<"worker" | "hiring">("worker");
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    country: "",
    terms: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.from("countries").select("code,name,restricted").order("name").then(({ data }) => {
      setCountries((data as Country[]) ?? []);
    });
    detectCountry().then((c) => c && setForm((f) => (f.country ? f : { ...f, country: c })));
    if (ref) {
      db.from("referral_clicks").insert({ code: ref, user_agent: navigator.userAgent }).then(() => undefined);
    }
  }, [ref]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match.");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (!form.terms) return toast.error("You must agree to the Terms.");

    const country = countries.find((c) => c.code === form.country);
    if (country?.restricted) return toast.error("Registrations from your country are currently unavailable.");

    setLoading(true);
    const redirectTo = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username: form.username,
          country_code: form.country || null,
          account_mode: accountMode,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);

    // If referral code present, record the relationship after the trigger creates profile.
    if (ref && data.user) {
      await db.from("referrals").insert({ referrer_id: ref, referred_id: data.user.id, code: ref }).then(() => undefined);
    }

    toast.success("Account created! Check your email to verify.");
    navigate({ to: "/auth/login" });
  }

  return (
    <AuthShell title="Create your account" sub="Choose Worker or Client — switch anytime from your dashboard.">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-5">
        {(["worker", "hiring"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setAccountMode(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              accountMode === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "worker" ? "Worker" : "Client"}
          </button>
        ))}
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" />
          <label className="block">
            <span className="text-sm font-medium text-foreground">Country</span>
            <select
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">Auto-detected…</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code} disabled={c.restricted}>
                  {c.name}{c.restricted ? " (restricted)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          <Field label="Confirm password" type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" />
        </div>
        {ref && <div className="text-xs text-muted-foreground">Referred by code <span className="font-mono text-primary">{ref}</span></div>}
        <label className="flex gap-2 items-start text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5 rounded border-input" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
          <span>
            I agree to the{" "}
            <Link to="/legal/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <button disabled={loading} className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}