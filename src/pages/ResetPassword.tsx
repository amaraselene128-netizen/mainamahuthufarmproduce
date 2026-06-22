import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/db";
import { toast } from "sonner";

function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) return toast.error("Passwords do not match");
    if (pw.length < 8) return toast.error("Use at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Set a new password" sub="Choose a strong password you don't use anywhere else.">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="New password" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        <Field label="Confirm password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        <button disabled={loading} className="w-full rounded-xl bg-gradient-gold px-4 py-3 font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPassword;
