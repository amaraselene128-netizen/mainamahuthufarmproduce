import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brand } from "@/components/site/Brand";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — EGRATASKS" },
      { name: "description", content: "Sign in to your EGRATASKS account." },
      { property: "og:title", content: "Login — EGRATASKS" },
      { property: "og:url", content: "/auth/login" },
    ],
    links: [{ rel: "canonical", href: "/auth/login" }],
  }),
  component: Login,
});

function Login() {
  return (
    <AuthShell title="Welcome back" sub="Sign in to continue earning, hiring or marketing on EGRATASKS.">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email" type="email" placeholder="you@example.com" />
        <Field label="Password" type="password" placeholder="••••••••" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded border-input" /> Remember me
          </label>
          <Link to="/auth/forgot" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <button className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow transition-shadow">
          Sign in
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New to EGRATASKS?{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-emerald overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-gradient-gold" />
        <div className="relative p-12 flex flex-col justify-between text-secondary-foreground">
          <Link to="/"><Brand /></Link>
          <div>
            <h2 className="font-display text-5xl font-semibold leading-tight max-w-md">
              The world's most premium task marketplace.
            </h2>
            <p className="mt-4 text-secondary-foreground/85 max-w-md">
              1M+ users · 100+ countries · 1B+ social engagements.
            </p>
          </div>
          <div className="text-xs opacity-70">© {new Date().getFullYear()} EGRATASKS · Nairobi, Kenya</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8"><Link to="/"><Brand /></Link></div>
          <h1 className="font-display text-4xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{sub}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
      />
    </label>
  );
}
