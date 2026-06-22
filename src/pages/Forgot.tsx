import { Link } from "react-router-dom";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/db";
import { toast } from "sonner";

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      To: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your inbox for the reset link.");
  }

  return (
    <AuthShell title="Forgot password?" sub="We'll send a secure reset link to your email.">
      {sent ? (
        <div className="rounded-xl border border-input bg-card p-6 text-sm">
          A reset link is on its way to <span className="font-medium">{email}</span>.
          <div className="mt-4"><Link to="/auth/login" className="text-primary hover:underline">Back to login</Link></div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button disabled={loading} className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline">Back to login</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default Forgot;
