import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ShieldAlert, ArrowLeft } from "lucide-react";

function Appeal() {
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !reason.trim()) return toast.error("Email and explanation are required");
    setBusy(true);
    const { error } = await db.from("account_appeals").insert({
      email: email.trim().toLowerCase(),
      contact: contact.trim() || null,
      reason: reason.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("Appeal submitted. Our team will review it.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-gold grid place-items-center shadow-glow">
            <ShieldAlert className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Appeal a suspension or ban</h1>
            <p className="text-sm text-muted-foreground">
              Submit the email tied to the restricted account and tell us what happened.
            </p>
          </div>
        </div>

        {done ? (
          <div className="mt-8 rounded-2xl border hairline bg-card p-6 shadow-card text-sm">
            <p className="font-medium">Thank you — your appeal is queued for review.</p>
            <p className="mt-2 text-muted-foreground">
              The admin team typically responds within 3 business days. You'll receive an email at{" "}
              <span className="font-mono">{email}</span> with the decision.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Account email</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Backup contact (optional)</span>
              <input
                value={contact} onChange={(e) => setContact(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                placeholder="Phone, alternative email…"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">What happened?</span>
              <textarea
                required rows={6} value={reason} onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                placeholder="Describe the situation, include any evidence or context that supports your appeal."
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit appeal"}
            </button>
            <p className="text-xs text-muted-foreground">
              False appeals or duplicates may permanently revoke access. Be honest and detailed.
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Appeal;
