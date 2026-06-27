import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, ShieldCheck, Wallet, Globe2, Zap,
  Youtube, Music2, Instagram, Facebook, Globe, Smartphone, Briefcase,
  CheckCircle2, Star, ChevronDown, LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/lib/auth-context";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <WhyChooseUs />
        <MarketWithUs />
        <Categories />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const { user, profile } = useAuth();
  return (
    <section className="relative overflow-hidden pt-32 pb-32 sm:pt-40 sm:pb-44">
      <div className="absolute inset-0 -z-10 bg-gradient-hero" />
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        aria-hidden
        className="absolute inset-0 -z-10 size-full object-cover opacity-30 mix-blend-luminosity"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/60 to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium tracking-wide text-foreground/80">
            <Sparkles className="size-3.5 text-primary" />
            {user
              ? `Welcome back, ${profile?.username ?? "friend"}`
              : "Trusted by 1M+ workers across 100+ countries"}
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
            Earn from work that <span className="text-gradient-gold">moves the world.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            EGMTASKS is the premium global marketplace for micro-tasks, social engagement, and
            freelance projects — connecting clients with verified workers in seconds.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe hover:shadow-glow transition-all"
                >
                  <LayoutDashboard className="size-4" /> Go to dashboard
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/dashboard/worker"
                  className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Browse tasks
                </Link>
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 rounded-xl border hairline px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Explore categories
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe hover:shadow-glow transition-all"
                >
                  Get Started
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            No credit card required · Email-verified accounts · Monthly payouts on the 5th
          </p>
        </motion.div>
      </div>

      {/* floating cards — fully inside the section, no clipping */}
      <div className="mt-12 sm:mt-0 sm:pointer-events-none sm:absolute sm:bottom-8 sm:inset-x-0 flex justify-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl w-full px-4 sm:px-6">
          {[
            { icon: ShieldCheck, label: "Verified workers" },
            { icon: Wallet, label: "Monthly payouts" },
            { icon: Globe2, label: "100+ countries" },
            { icon: Zap, label: "Instant apply" },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
              className="glass shadow-card rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0"
            >
              <div className="size-9 sm:size-10 shrink-0 rounded-xl bg-gradient-gold grid place-items-center shadow-card">
                <f.icon className="size-4 sm:size-5 text-primary-foreground" />
              </div>
              <span className="text-xs sm:text-sm font-medium truncate">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- STATS ---------------- */
function Stats() {
  const stats = [
    { value: "1,000,000+", label: "Active users" },
    { value: "100+", label: "Countries" },
    { value: "1B+", label: "Social engagements" },
    { value: "850K+", label: "Tasks completed" },
  ];
  return (
    <section className="pt-16 sm:pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border hairline bg-card shadow-card overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="p-8 lg:p-10 text-center"
              >
                <div className="font-display text-4xl lg:text-5xl font-semibold text-gradient-gold">
                  {s.value}
                </div>
                <div className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Create your account", desc: "Sign up in 60 seconds. Choose between Worker or Client — switch anytime from your dashboard." },
    { n: "02", title: "Apply or post a task", desc: "Workers browse available jobs across every category. Clients post with budget, deadline and instructions." },
    { n: "03", title: "Deliver & get reviewed", desc: "Submit proof — screenshots, files, URLs. Admin reviews and approves." },
    { n: "04", title: "Get paid on the 5th", desc: "Approved earnings settle to your wallet and pay out automatically on the 5th of each month." },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From sign-up to payout in four steps"
          sub="A clean, transparent workflow built for trust at every stage."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="group relative rounded-2xl border hairline bg-card p-6 shadow-card hover:shadow-luxe transition-shadow"
            >
              <div className="font-display text-5xl font-semibold text-gradient-gold opacity-90">{s.n}</div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- WHY ---------------- */
function WhyChooseUs() {
  const items = [
    { icon: ShieldCheck, title: "Enterprise-grade trust", desc: "AI fraud detection, device fingerprinting, RLS-protected data and KYC verification." },
    { icon: Wallet, title: "Predictable payouts", desc: "Settle every month on the 5th to PayPal — Stripe, Payoneer, Wise and M-Pesa coming next." },
    { icon: Globe2, title: "Truly global", desc: "Workers in 100+ countries, jobs in 7+ categories, multilingual support." },
    { icon: Zap, title: "Lightning UX", desc: "Premium SaaS interface, real-time notifications, optimized for any device." },
    { icon: Briefcase, title: "Built for clients", desc: "Post in minutes, get up to 20 verified workers per task, review and rate." },
    { icon: Sparkles, title: "Referrals that reward", desc: "Invite friends and earn monthly commissions with conversion analytics built in." },
  ];
  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Why choose us" title="A marketplace built like a luxury product" sub="Every detail engineered for speed, trust and global scale." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="rounded-2xl bg-card p-7 border hairline shadow-card hover:shadow-luxe hover:-translate-y-1 transition-all duration-300"
            >
              <div className="size-12 rounded-xl bg-gradient-gold shadow-glow grid place-items-center">
                <it.icon className="size-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- MARKET WITH US ---------------- */
function MarketWithUs() {
  const types = [
    { icon: Youtube, label: "YouTube" },
    { icon: Music2, label: "TikTok" },
    { icon: Instagram, label: "Instagram" },
    { icon: Facebook, label: "Facebook" },
    { icon: Globe, label: "Websites" },
    { icon: Smartphone, label: "Mobile Apps" },
    { icon: Briefcase, label: "Services" },
  ];
  return (
    <section id="market" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Market with us
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Get real engagement from <span className="text-gradient-gold">real people.</span>
            </h2>
            <p className="mt-5 text-muted-foreground text-lg">
              Promote videos, websites, products, social handles and apps with a global workforce.
              Submit your link and watch the engagement roll in.
            </p>
            <ul className="mt-6 space-y-3">
              {["Video links", "Website links", "Social media links", "Product links"].map((l) => (
                <li key={l} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-secondary" /> {l}
                </li>
              ))}
            </ul>
            <MarketCta />
          </motion.div>

          <motion.div {...fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {types.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="aspect-square glass rounded-2xl flex flex-col items-center justify-center gap-2 shadow-card hover:shadow-glow hover:-translate-y-1 transition-all"
              >
                <t.icon className="size-7 text-primary" />
                <span className="text-sm font-medium">{t.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CATEGORIES ---------------- */
function Categories() {
  const cats = [
    { icon: Youtube, label: "YouTube", desc: "Views, watch-time, subscribes." },
    { icon: Music2, label: "TikTok", desc: "Views, likes, follows, shares." },
    { icon: Instagram, label: "Instagram", desc: "Followers, likes, story views." },
    { icon: Facebook, label: "Facebook", desc: "Page likes, post engagement." },
    { icon: Globe, label: "Websites", desc: "Traffic, sign-ups, surveys." },
    { icon: Smartphone, label: "Mobile Apps", desc: "Installs, reviews, testing." },
    { icon: Briefcase, label: "Services", desc: "Microtasks, data, content." },
  ];
  return (
    <section id="categories" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Available categories" title="Work across every channel that matters." sub="A global catalogue of tasks spanning the world's biggest platforms." />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <motion.div
              key={c.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="rounded-2xl bg-card p-7 border hairline shadow-card hover:shadow-luxe hover:-translate-y-1 transition-all"
            >
              <div className="size-12 rounded-xl bg-gradient-gold shadow-glow grid place-items-center">
                <c.icon className="size-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{c.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const quotes = [
    { quote: "I earned my first $300 in two weeks. The interface feels like a luxury app, not a task board.", name: "Amara O.", role: "Worker · Nigeria" },
    { quote: "We launched a TikTok campaign and got 14,000 verified engagements in 48 hours.", name: "Diego R.", role: "Client · Mexico" },
    { quote: "Finally a marketplace that pays on time. The 5th payout is sacred — and it works.", name: "Priya S.", role: "Worker · India" },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Loved globally" title="Stories from our community" sub="Real workers, real clients, real outcomes." />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.figure
              key={q.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="rounded-2xl bg-card border hairline p-7 shadow-card"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground leading-relaxed">"{q.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-gold grid place-items-center font-semibold text-primary-foreground">
                  {q.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const faqs = [
    { q: "How do I get paid?", a: "All approved earnings settle to your in-app wallet and pay out monthly on the 5th via PayPal. Stripe, Payoneer, Wise and M-Pesa are on the roadmap." },
    { q: "Is registration available worldwide?", a: "EGMTASKS supports 100+ countries. Some regions may be temporarily restricted — you'll see a clear message if your country is currently unavailable." },
    { q: "What stops fake submissions?", a: "Our AI fraud engine combines duplicate-detection, screenshot similarity, device fingerprinting, and risk scoring (Low → Critical) with admin review." },
    { q: "Can I switch between Worker and Client?", a: "Yes — switch account modes anytime from your dashboard settings." },
    { q: "Does a subscription tier guarantee I get tasks?", a: "Subscribing to a tier dramatically increases your selection priority during admin approval. Gold tier subscribers receive the highest possible placement priority across the platform." },
    { q: "What payment methods do you support?", a: "PayPal is live today. M-Pesa, Stripe, bank cards, Payoneer and Wise are queued and announced as they roll out region-by-region." },
    { q: "How does the escrow work?", a: "Clients fully fund a task before it is published. Funds are held in escrow until the work is approved, disputed, or refunded under our policy." },
    { q: "What happens to uncollected balances?", a: "Funds not withdrawn within two months after pay-maturity may be reclaimed by EGMTASKS to cover platform maintenance, account services, and escrow operations (see Terms §31)." },
    { q: "Can I run video ads using a link instead of uploading?", a: "Yes — choose 'Embedded link' on the Advertise page and paste a YouTube, Facebook, TikTok, Instagram or other supported video URL." },
    { q: "How are disputes resolved?", a: "Open a dispute from the task page. Our trust team reviews evidence, communication and timestamps, then issues a binding decision." },
    { q: "Is my data private and secure?", a: "We use industry-standard encryption in transit and at rest, plus role-based access controls. Review our Privacy Policy for full detail." },
    { q: "Can I refer friends and earn?", a: "Yes. Activate a referral tier from your dashboard to unlock your unique link, real-time stats and recurring commissions." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Questions, answered" sub="Everything you need to know before you join." />
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="rounded-2xl border hairline bg-card shadow-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`size-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  const { user, profile } = useAuth();
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl p-12 lg:p-20 text-center shadow-luxe"
          style={{ background: "var(--gradient-emerald)" }}
        >
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: "var(--gradient-gold)" }} />
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-secondary-foreground tracking-tight">
              {user ? `Welcome back, ${profile?.username ?? "friend"}.` : "Your next paycheck starts today."}
            </h2>
            <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
              {user
                ? "Jump back into your dashboard, browse new tasks, or check your wallet."
                : "Join a million-strong community of workers and clients on the world's most premium task marketplace."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-luxe hover:shadow-glow transition-all">
                    <LayoutDashboard className="size-4" /> Go to dashboard
                  </Link>
                  <Link to="/dashboard/worker" className="inline-flex items-center gap-2 rounded-xl border border-secondary-foreground/30 bg-transparent px-6 py-3.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors">
                    Browse tasks <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-luxe hover:shadow-glow transition-all">
                    Create your free account <ArrowRight className="size-4" />
                  </Link>
                  <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-xl border border-secondary-foreground/30 bg-transparent px-6 py-3.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- shared ---------------- */
function MarketCta() {
  const { user } = useAuth();
  return (
    <Link
      to={user ? "/market-with-us" : "/auth/register"}
      className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-emerald px-6 py-3.5 text-sm font-semibold text-secondary-foreground shadow-card hover:shadow-glow transition-shadow"
    >
      Start a campaign <ArrowRight className="size-4" />
    </Link>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">{title}</h2>
      <p className="mt-4 text-muted-foreground">{sub}</p>
    </div>
  );
}

export default Home;
