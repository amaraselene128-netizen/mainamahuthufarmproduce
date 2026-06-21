import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — EGRATASKS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Settings,
});

function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const [twoFA, setTwoFA] = useState(profile?.two_factor_enabled ?? false);

  async function toggle2FA(v: boolean) {
    if (!user) return;
    setTwoFA(v);
    const { error } = await db.from("profiles").update({ two_factor_enabled: v }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success(`Two-factor ${v ? "enabled" : "disabled"} (placeholder — enroll via Supabase Auth)`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <div className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
        <Row label="Account mode" desc="Switch between Worker and Client mode anytime.">
          <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wider">{profile?.account_mode}</span>
        </Row>
        <Row label="Two-factor authentication" desc="Add a second step at login for stronger security.">
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={twoFA} onChange={(e) => toggle2FA(e.target.checked)} className="sr-only peer" />
            <span className="w-10 h-5 bg-muted rounded-full peer-checked:bg-primary relative transition-colors">
              <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-card transition-transform ${twoFA ? "translate-x-5" : ""}`} />
            </span>
          </label>
        </Row>
        <Row label="Email" desc="Your verified login email."><span className="text-sm">{user?.email}</span></Row>
      </div>
    </div>
  );
}
function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><div className="font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );
}