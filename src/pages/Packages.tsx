import { Link } from "react-router-dom";
import { Award, Trophy, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const packages = [
  {
    icon: Award,
    tier: "Bronze",
    tag: "Entry tier",
    perks: [
      "10 minutes of coaching per week",
      "Access to Regular and Bronze-rated tasks",
      "Access to Regular and Bronze referral earnings",
      "Minimum withdrawal amount: $30 USD",
      "Access to the Tier 3 Millionaires Group Chat",
    ],
  },
  {
    icon: Trophy,
    tier: "Silver",
    tag: "Most popular",
    perks: [
      "100 minutes of coaching per week",
      "Access to Regular, Bronze and Silver-rated tasks",
      "Access to Regular, Bronze and Silver referral earnings",
      "Minimum withdrawal amount: $20 USD",
      "Access to the Tier 2 Millionaires Group Chat",
    ],
  },
  {
    icon: Crown,
    tier: "Gold",
    tag: "Elite",
    perks: [
      "Unlimited coaching access — 1,000+ minutes of material per week",
      "Access to Regular, Bronze, Silver and Gold-rated tasks",
      "Access to Regular, Bronze, Silver and Gold referral earnings",
      "Minimum withdrawal amount: $10 USD",
      "Access to the Tier 1 (Premium) Millionaires Group Chat",
    ],
  },
];

export default function Packages() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              EGMTASKS Membership
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Choose the <span className="text-gradient-gold">tier that unlocks more.</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Higher tiers reduce your minimum withdrawal, expand the tasks you can take,
              and grow what you earn from referrals and coaching.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.tier}
                className="rounded-2xl border hairline bg-card p-7 shadow-card flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="size-12 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
                    <p.icon className="size-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    {p.tag}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold">{p.tier} Package</h2>
                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 mt-0.5 text-secondary shrink-0" /> {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard/referrals"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow"
                >
                  Unlock {p.tier} <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            By unlocking any package you agree to our{" "}
            <Link to="/legal/terms" className="text-primary hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
