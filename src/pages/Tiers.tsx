import { Link } from "react-router-dom";
import { Crown, ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";

const tiers = [
  {
    name: "Bronze",
    price: 100,
    monthly: 50,
    color: "from-amber-700/20 to-amber-700/5",
    perks: [
      "Tier-priority placement on every task application",
      "Unlimited daily ad/campaign tasks",
      "Bronze badge across your profile and submissions",
      "Access to all open tasks regardless of category",
    ],
  },
  {
    name: "Silver",
    price: 1000,
    monthly: 500,
    color: "from-slate-400/20 to-slate-400/5",
    perks: [
      "Higher placement priority than Bronze",
      "Unlimited daily ad/campaign tasks",
      "Silver badge across the platform",
      "Eligible for premium tasks first",
    ],
    popular: true,
  },
  {
    name: "Gold",
    price: 10000,
    monthly: 5000,
    color: "from-yellow-500/20 to-yellow-500/5",
    perks: [
      "Highest placement priority — near-100% selection",
      "Unlimited daily ad/campaign tasks",
      "Premium Gold badge visible to admins",
      "Priority dispute resolution & support",
    ],
  },
];

function Tiers() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Tier system
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-6xl font-semibold leading-tight">
              Higher tier. <span className="text-gradient-gold">Near-100% selection.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Every task on EGMTASKS reserves <b>18 of every 20 worker slots</b> for tier-subscribed members.
              The remaining <b>2 slots</b> are open to everyone else. Tier subscribers also enjoy unlimited
              daily ad/campaign tasks while non-subscribers are capped at <b>20 per day</b>.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.name} className={`relative rounded-3xl border hairline bg-gradient-to-b ${t.color} p-8 shadow-card`}>
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold text-primary-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{t.name}</h3>
                  <Crown className="size-6 text-primary" />
                </div>
                <div className="mt-4 font-display text-5xl text-gradient-gold">${t.price.toLocaleString()}</div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold">
                  <Zap className="size-3.5" /> Or ${t.monthly.toLocaleString()}/mo subscription
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2"><Star className="size-4 text-primary mt-0.5 shrink-0" /> <span>{p}</span></li>
                  ))}
                </ul>
                <Link
                  to={user ? "/dashboard/referrals" : "/auth/register?next=/dashboard/referrals"}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow"
                >
                  Get {t.name} <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border hairline bg-card p-8 shadow-card">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="size-6 text-primary" /> How tier selection works
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal pl-5">
              <li>Workers apply to open tasks. Each task accepts a fixed pool of workers.</li>
              <li>Of that pool, <b>18/20 slots</b> are reserved for tier-subscribed applicants, ordered Gold → Silver → Bronze.</li>
              <li>The remaining <b>2 slots</b> are open to non-tier applicants on a first-come basis.</li>
              <li>Admins use the tier badge displayed on every application to confirm priority during review.</li>
              <li>For ads and campaign tasks, non-tier accounts are limited to <b>20 task-credits per day</b>. Tier subscribers have <b>no daily cap</b>.</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              This algorithm is disclosed in our <Link to="/legal/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Tiers;
