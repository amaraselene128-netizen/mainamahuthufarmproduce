import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "./auth.login";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Register — EGRATASKS" },
      { name: "description", content: "Create your free EGRATASKS account in seconds." },
      { property: "og:title", content: "Register — EGRATASKS" },
      { property: "og:url", content: "/auth/register" },
    ],
    links: [{ rel: "canonical", href: "/auth/register" }],
  }),
  component: Register,
});

function Register() {
  const [accountType, setAccountType] = useState<"worker" | "hiring">("worker");
  return (
    <AuthShell title="Create your account" sub="Choose Worker or Hiring Party — switch anytime from your dashboard.">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-5">
        {(["worker", "hiring"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setAccountType(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              accountType === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "worker" ? "Worker" : "Hiring Party"}
          </button>
        ))}
      </div>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username" placeholder="your_username" />
          <Field label="Country" placeholder="Auto-detected" />
        </div>
        <Field label="Email" type="email" placeholder="you@example.com" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Password" type="password" placeholder="••••••••" />
          <Field label="Confirm password" type="password" placeholder="••••••••" />
        </div>
        <label className="flex gap-2 items-start text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5 rounded border-input" />
          <span>
            I agree to the{" "}
            <Link to="/legal/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <button className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow">
          Create account
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
