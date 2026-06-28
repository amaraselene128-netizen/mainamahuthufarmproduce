import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Megaphone, Plus } from "lucide-react";
import { MARKET_CATEGORIES } from "@/data/market-categories";
import { useAuth } from "@/lib/auth-context";
import { GroupView, SubmitForm } from "./MarketWithUs";

type Step = "browse" | "group" | "submit";

// Mirrors the public MarketWithUs page, but rendered inside the dashboard shell
// (no site Header/Footer — the dashboard layout already provides chrome).
export default function AdvertiserCampaign() {
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

  // Memoise the cheap arrays so the component matches MarketWithUs perf-wise.
  const categories = useMemo(() => MARKET_CATEGORIES, []);

  return (
    <div>
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
            {categories.map((g) => (
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

      {step === "group" && activeGroup && (
        <GroupView
          group={activeGroup}
          onBack={() => setStep("browse")}
          onPick={(sub) => startSubmit(sub)}
        />
      )}

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
  );
}
