import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MARKET_CATEGORIES } from "@/data/market-categories";
import { useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { uploadManyToCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Megaphone, Plus, Upload } from "lucide-react";

type PromoType = "on_site" | "external";
type Step = "browse" | "group" | "submit";

export default function MarketWithUs() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("browse");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [preselect, setPreselect] = useState<string>("");
  const formRef = useRef<HTMLDivElement | null>(null);

  function openGroup(group: string) {
    setActiveGroup(group);
    setStep("group");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startSubmit(category?: string) {
    setPreselect(category ?? "");
    setStep("submit");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* HERO + submit banner */}
          {step === "browse" && (
            <>
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <Megaphone className="size-3.5" /> Market with us
                </span>
                <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
                  Promote anything, <span className="text-gradient-gold">to a real global audience.</span>
                </h1>
                <p className="mt-4 text-muted-foreground text-lg">
                  Pick a category below to see what we offer — or jump straight in and submit a campaign now.
                </p>
              </div>

              <button
                onClick={() => startSubmit()}
                className="mt-8 group flex w-full items-center justify-between gap-4 rounded-2xl border hairline bg-gradient-emerald text-secondary-foreground px-6 py-5 shadow-card hover:shadow-glow transition"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="grid place-items-center size-10 rounded-xl bg-white/20"><Plus className="size-5" /></span>
                  <div>
                    <div className="font-display text-lg font-semibold">Submit a campaign</div>
                    <div className="text-xs opacity-90">Pick a category, set your budget, we take it from there.</div>
                  </div>
                </div>
                <ChevronRight className="size-5" />
              </button>

              <h2 className="mt-14 font-display text-2xl font-semibold">Browse categories</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {MARKET_CATEGORIES.map((g) => (
                  <button
                    key={g.group}
                    onClick={() => openGroup(g.group)}
                    className="group text-left rounded-2xl border hairline bg-card p-5 shadow-card hover:shadow-glow hover:-translate-y-0.5 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-base font-semibold">{g.group}</span>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{g.items.length} services</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* GROUP detail */}
          {step === "group" && activeGroup && (
            <GroupView
              group={activeGroup}
              onBack={() => setStep("browse")}
              onPick={(sub) => startSubmit(sub)}
            />
          )}

          {/* SUBMIT form */}
          {step === "submit" && (
            <div ref={formRef}>
              <button
                onClick={() => setStep("browse")}
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="size-4" /> Back to categories
              </button>
              <SubmitForm
                userEmail={user?.email ?? null}
                userId={user?.id ?? null}
                initialCategory={preselect}
                onDone={() => setStep("browse")}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function GroupView({
  group,
  onBack,
  onPick,
}: {
  group: string;
  onBack: () => void;
  onPick: (sub: string) => void;
}) {
  const items = useMemo(
    () => MARKET_CATEGORIES.find((g) => g.group === group)?.items ?? [],
    [group],
  );
  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> All categories
      </button>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl font-semibold">{group}</h1>
      <p className="mt-2 text-muted-foreground">Click any service to start a campaign for it.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <button
            key={it}
            onClick={() => onPick(it)}
            className="text-left rounded-xl border hairline bg-card px-4 py-3 shadow-card hover:shadow-glow hover:-translate-y-0.5 transition flex items-center justify-between"
          >
            <span className="text-sm font-medium">{it}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SubmitForm({
  userEmail,
  userId,
  initialCategory,
  onDone,
}: {
  userEmail: string | null;
  userId: string | null;
  initialCategory: string;
  onDone: () => void;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [promoType, setPromoType] = useState<PromoType>("external");
  const [duration, setDuration] = useState<number>(30);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    website_url: "",
    video_url: "",
    social_url: "",
    budget: "",
    target_countries: "",
    start_date: "",
    end_date: "",
    contact_email: userEmail ?? "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isVideoCategory = /video|youtube|tiktok|reel|short|stream/i.test(category);

  async function probeDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(v.src);
        resolve(Math.round(v.duration));
      };
      v.onerror = () => resolve(0);
      v.src = URL.createObjectURL(file);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return toast.error("Pick a category");

    setSubmitting(true);
    try {
      let video_file_url: string | null = null;

      if (promoType === "on_site") {
        if (!videoFile) throw new Error("Upload your video");
        const actual = await probeDuration(videoFile);
        // Allow 1s drift
        if (Math.abs(actual - duration) > 1) {
          throw new Error(`Video is ${actual}s — must be exactly ${duration}s`);
        }
        const up = await uploadToCloudinary(videoFile, { folder: "market_campaigns/video" });
        video_file_url = up.secure_url;
      }

      let extra: string[] = [];
      if (attachments.length) {
        const ups = await uploadManyToCloudinary(attachments, { folder: "market_campaigns" });
        extra = ups.map((u) => u.secure_url);
      }

      const payload: Record<string, unknown> = {
        user_id: userId,
        category,
        promotion_type: promoType,
        title: form.title,
        description: form.description,
        instructions: form.instructions || null,
        website_url: form.website_url || null,
        video_url: promoType === "external" ? form.video_url || null : null,
        social_url: form.social_url || null,
        budget: form.budget ? Number(form.budget) : null,
        target_countries: form.target_countries
          ? form.target_countries.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        contact_email: form.contact_email || null,
        attachments: extra,
        status: "pending",
      };
      if (isVideoCategory) {
        payload.duration_seconds = duration;
        if (video_file_url) payload.video_file_url = video_file_url;
      }

      const { error } = await db.from("market_campaigns").insert(payload);
      if (error) throw error;
      toast.success("Campaign submitted — pending approval");
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Submit campaign</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the form. We'll review and respond at the email you provide.
        </p>
      </div>

      <Sel label="Campaign category" required value={category} onChange={setCategory}>
        <option value="">— Select category —</option>
        {MARKET_CATEGORIES.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((it) => <option key={it} value={it}>{it}</option>)}
          </optgroup>
        ))}
      </Sel>

      {isVideoCategory && (
        <div className="rounded-xl border hairline bg-background/40 p-4 space-y-3">
          <span className="text-sm font-semibold">Where is the video?</span>
          <div className="grid sm:grid-cols-2 gap-3">
            <Toggle active={promoType === "on_site"} onClick={() => setPromoType("on_site")} title="On our website" desc="Upload your video here — workers watch it on EGMTASKS." />
            <Toggle active={promoType === "external"} onClick={() => setPromoType("external")} title="From another platform" desc="YouTube, TikTok, Instagram, Vimeo — workers visit your link." />
          </div>

          <div>
            <span className="text-sm font-medium">Video duration</span>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDuration(s)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    duration === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-input hover:bg-accent"
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
            {promoType === "on_site" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your uploaded video must be exactly <strong>{duration}s</strong> (±1s).
              </p>
            )}
          </div>

          {promoType === "on_site" && (
            <label className="block">
              <span className="text-sm font-medium">Upload video</span>
              <div className="mt-1.5 rounded-xl border border-dashed border-input p-4 bg-background">
                <label htmlFor="onsite-video" className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
                  <Upload className="size-4" /> Choose video file
                </label>
                <input
                  id="onsite-video"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                {videoFile && <div className="mt-2 text-xs text-muted-foreground">{videoFile.name}</div>}
              </div>
            </label>
          )}

          {promoType === "external" && (
            <In label="Video URL" required type="url" placeholder="https://youtube.com/watch?v=..." value={form.video_url} onChange={(v) => setForm({ ...form, video_url: v })} />
          )}
        </div>
      )}

      <In label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Ta label="Description" required rows={3} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <Ta label="Instructions for workers" rows={3} value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} />

      {!isVideoCategory && (
        <div className="grid sm:grid-cols-2 gap-4">
          <In label="Website URL" value={form.website_url} onChange={(v) => setForm({ ...form, website_url: v })} />
          <In label="Social media URL" value={form.social_url} onChange={(v) => setForm({ ...form, social_url: v })} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <In label="Budget (USD)" required type="number" min="0" step="1" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
        <In label="Target countries (comma separated)" placeholder="US, GB, KE" value={form.target_countries} onChange={(v) => setForm({ ...form, target_countries: v })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <In label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
        <In label="End date" type="date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
      </div>
      <In label="Contact email" required type="email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />

      <label className="block">
        <span className="text-sm font-medium">Additional attachments (optional)</span>
        <div className="mt-1.5 rounded-xl border border-dashed border-input p-4 bg-background/40">
          <label htmlFor="market-files" className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
            <Upload className="size-4" /> Choose files (images/videos)
          </label>
          <input
            id="market-files"
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
          />
          {attachments.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">{attachments.length} file(s) selected</div>
          )}
        </div>
      </label>

      <button
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-emerald px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-card hover:shadow-glow disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit campaign for approval"}
      </button>
    </form>
  );
}

function Toggle({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition ${
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input bg-card hover:bg-accent"
      }`}
    >
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}

function In({ label, value, onChange, ...p }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input {...p} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
function Ta({ label, value, onChange, ...p }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea {...p} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
function Sel({ label, value, onChange, required, children }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
        {children}
      </select>
    </label>
  );
}
