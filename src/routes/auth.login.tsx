import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — EGRATASKS" },
      { name: "description", content: "Sign in to your EGRATASKS account to access tasks, your wallet, and dashboards." },
      { property: "og:title", content: "Login — EGRATASKS" },
      { property: "og:url", content: "/auth/login" },
    ],
    links: [{ rel: "canonical", href: "/auth/login" }],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to continue earning, hiring or marketing on EGRATASKS.">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded border-input" /> Remember me
          </label>
          <Link to="/auth/forgot" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New to EGRATASKS?{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}