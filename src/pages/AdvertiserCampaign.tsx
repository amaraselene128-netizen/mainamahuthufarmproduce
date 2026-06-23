import { useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Megaphone, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  AD_DURATIONS, ADVERTISER_CENTS, BUTTON_TEXT_OPTIONS, formatCents, viewsForBudget, type AdDuration,
} from "@/lib/ads";

function AdvertiserCampaign() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [buttonText, setButtonText] = useState<string>("Install Now");
  const [duration, setDuration] = useState<AdDuration>(30);
  const [budgetUsd, setBudgetUsd] = useState(50);
  const [countries, setCountries] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const budgetCents = Math.round(budgetUsd * 100);
  const views = viewsForBudget(budgetCents, duration);
  const cpv = ADVERTISER_CENTS[duration];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!file) return toast.error("Upload a video first");
    if (!/^https?:\/\//i.test(destinationUrl)) return toast.error("Destination URL must start with http(s)://");
    if (budgetCents < cpv) return toast.error("Budget must cover at least one view");
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, { folder: "egratasks/ads" });
      const targets = countries.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const { error } = await db.from("advertisements").insert({
        advertiser_id: user.id,
        title, description,
        video_url: up.secure_url,
        video_public_id: up.public_id,
        destination_url: destinationUrl,
        button_text: buttonText,
        duration_seconds: duration,
        country_targeting: targets,
        budget_cents: budgetCents,
        views_purchased: views,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Campaign submitted for review");
      setTitle(""); setDescription(""); setDestinationUrl(""); setFile(null); setCountries("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
        <Megaphone className="size-7 text-primary" /> Create ad campaign
      </h1>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border hairline bg-card p-6 shadow-card">
        <Field label="Title">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Video file (mp4, ≤ 20MB)">
          <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-background px-3 py-6 cursor-pointer hover:bg-accent">
            <Upload className="size-4" />
            <span className="text-sm">{file ? file.name : "Choose video"}</span>
            <input type="file" accept="video/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination URL">
            <input required value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Call-to-action button">
            <select value={buttonText} onChange={(e) => setButtonText(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {BUTTON_TEXT_OPTIONS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Ad duration">
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value) as AdDuration)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {AD_DURATIONS.map((d) => (
                <option key={d} value={d}>{d}s · {formatCents(ADVERTISER_CENTS[d])} per view</option>
              ))}
            </select>
          </Field>
          <Field label="Budget (USD)">
            <input type="number" min={1} step={1} value={budgetUsd}
              onChange={(e) => setBudgetUsd(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
        </div>
        <Field label="Countries (comma-separated ISO codes, blank = worldwide)">
          <input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="US, KE, NG"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </Field>

        <div className="rounded-xl bg-muted/40 p-4 text-sm flex flex-wrap gap-4 justify-between">
          <span><b>{views.toLocaleString()}</b> views purchased</span>
          <span>CPV: <b>{formatCents(cpv)}</b></span>
          <span>Budget: <b>${budgetUsd}</b></span>
        </div>

        <button disabled={busy} className="w-full rounded-xl bg-gradient-gold px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Submitting…" : "Submit for review"}
        </button>
        <p className="text-xs text-muted-foreground">
          Admin reviews every campaign before it goes live. You'll get paid views once approved.
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default AdvertiserCampaign;
