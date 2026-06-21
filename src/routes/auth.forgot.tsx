import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field } from "./auth.login";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Reset password — EGRATASKS" },
      { name: "description", content: "Reset your EGRATASKS account password." },
      { property: "og:url", content: "/auth/forgot" },
    ],
    links: [{ rel: "canonical", href: "/auth/forgot" }],
  }),
  component: Forgot,
});

function Forgot() {
  return (
    <AuthShell title="Reset password" sub="Enter your email and we'll send you a reset link.">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email" type="email" placeholder="you@example.com" />
        <button className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow">
          Send reset link
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">Back to login</Link>
        </p>
      </form>
    </AuthShell>
  );
}
