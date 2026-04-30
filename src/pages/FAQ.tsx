import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ShoppingBag, Store, Calendar, MessageCircle, ShieldCheck, CreditCard, Users } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
  /** plain-text answer used for JSON-LD (no JSX) */
  schemaA: string;
  links?: { label: string; to: string }[];
}

const categories: { id: string; title: string; icon: React.ComponentType<{ className?: string }>; items: FaqItem[] }[] = [
  {
    id: "getting-started",
    title: "Getting started on Sokoni Arena",
    icon: HelpCircle,
    items: [
      {
        q: "What is Sokoni Arena?",
        a: "Sokoni Arena (often searched simply as \"Sokoni\") is Kenya's premier online marketplace where you can buy and sell products, book services, discover events, and follow your favourite shops — all in one place.",
        schemaA: "Sokoni Arena (also known as Sokoni) is Kenya's premier online marketplace where you can buy and sell products, book services, discover events, and follow your favourite shops.",
        links: [
          { label: "Browse products", to: "/products" },
          { label: "Browse services", to: "/services" },
          { label: "See events", to: "/events" },
          { label: "Visit shops", to: "/shops" },
        ],
      },
      {
        q: "How do I create an account?",
        a: "Click Register, enter your email and a password, then verify the email we send you. You can also sign in later from the Login page.",
        schemaA: "Click Register, enter your email and a password, then verify the email we send you. Sign in later from the Login page.",
        links: [
          { label: "Register", to: "/register" },
          { label: "Login", to: "/login" },
          { label: "Forgot password", to: "/forgot-password" },
        ],
      },
      {
        q: "Is Sokoni Arena free to use?",
        a: "Yes. Browsing, listing, chatting with sellers and following shops are completely free. Optional paid promotions and featured placements are available for sellers who want extra visibility.",
        schemaA: "Yes. Browsing, listing, chatting with sellers and following shops are free. Optional paid promotions and featured placements are available.",
      },
    ],
  },
  {
    id: "buying",
    title: "Buying on Sokoni",
    icon: ShoppingBag,
    items: [
      {
        q: "How do I contact a seller?",
        a: "Open any listing and use the Call or WhatsApp buttons, or send a message from inside the listing once you are signed in.",
        schemaA: "Open any listing and use the Call or WhatsApp buttons, or send a message from inside the listing once you are signed in.",
        links: [
          { label: "Browse products", to: "/products" },
          { label: "Open messages", to: "/messages" },
        ],
      },
      {
        q: "How do I save items I love?",
        a: "Tap the heart icon on any listing to add it to your Favorites. You can review them any time from the Favorites page.",
        schemaA: "Tap the heart icon on any listing to add it to your Favorites and review them on the Favorites page.",
        links: [{ label: "My Favorites", to: "/favorites" }],
      },
      {
        q: "Is it safe to buy on Sokoni Arena?",
        a: "We verify shops, surface ratings, and let buyers report suspicious listings. Always meet in public places, inspect items before paying, and prefer verified shops marked with a badge.",
        schemaA: "We verify shops, surface ratings, and let buyers report suspicious listings. Meet in public, inspect before paying, and prefer verified shops.",
      },
    ],
  },
  {
    id: "selling",
    title: "Selling on Sokoni",
    icon: Store,
    items: [
      {
        q: "How do I post a product, service, or event?",
        a: "Sign in, open your Dashboard, click \"Add Listing\", choose product, service, or event, fill in the details, upload clear photos, and publish.",
        schemaA: "Sign in, open your Dashboard, click Add Listing, choose product/service/event, fill in details, upload photos, and publish.",
        links: [{ label: "Open Dashboard", to: "/dashboard" }],
      },
      {
        q: "How do I open my own shop?",
        a: "From your Dashboard, choose \"My Shop\" and request a shop. Pick a name, slug, logo, cover photo, location and contacts. Verified shops appear with a badge across the marketplace.",
        schemaA: "From your Dashboard, choose My Shop and request a shop. Pick a name, slug, logo, cover photo, location and contacts. Verified shops appear with a badge.",
        links: [
          { label: "Open Dashboard", to: "/dashboard" },
          { label: "Browse all shops", to: "/shops" },
        ],
      },
      {
        q: "How do I get more views on my listings?",
        a: "Use sharp photos, accurate prices, complete descriptions and the right category. You can also boost reach with paid Featured and Sponsored promotions from the Dashboard.",
        schemaA: "Use sharp photos, accurate prices, complete descriptions and the right category. Boost reach with Featured and Sponsored promotions from the Dashboard.",
        links: [{ label: "Open Dashboard", to: "/dashboard" }],
      },
    ],
  },
  {
    id: "events",
    title: "Events & Fun Circle",
    icon: Calendar,
    items: [
      {
        q: "How do I list or find events?",
        a: "Visit the Events page to browse what's happening in Kenya. To list an event, open your Dashboard and choose \"Event\" as the listing type.",
        schemaA: "Visit the Events page to browse what's happening in Kenya. To list an event, open Dashboard and choose Event as the listing type.",
        links: [
          { label: "See events", to: "/events" },
          { label: "Open Dashboard", to: "/dashboard" },
        ],
      },
      {
        q: "What is Fun Circle?",
        a: "Fun Circle is the Sokoni Arena social space where you can post stories, make friends, and chat — like a built-in mini social network for the marketplace.",
        schemaA: "Fun Circle is the Sokoni Arena social space where you post stories, make friends, and chat — a built-in mini social network for the marketplace.",
        links: [{ label: "Open Fun Circle", to: "/fun-circle" }],
      },
    ],
  },
  {
    id: "support",
    title: "Support, payments & safety",
    icon: ShieldCheck,
    items: [
      {
        q: "I think a listing is fraudulent — what do I do?",
        a: "Use the report option on the listing or email support@sokoniarena.co.ke. Our team acts on reports quickly.",
        schemaA: "Use the report option on the listing or email support@sokoniarena.co.ke. Our team acts on reports quickly.",
        links: [{ label: "Help & Contact", to: "/help" }],
      },
      {
        q: "How do payments work?",
        a: "Buyers and sellers usually agree on M-Pesa, cash on delivery, or bank transfer directly. Sokoni Arena does not hold funds for marketplace transactions.",
        schemaA: "Buyers and sellers agree on M-Pesa, cash on delivery, or bank transfer directly. Sokoni Arena does not hold funds for marketplace transactions.",
      },
      {
        q: "How do I reach Sokoni Arena support?",
        a: "Call or WhatsApp 0708532145 / 0708444210, or email info@sokoniarena.co.ke. The Help page lists every channel.",
        schemaA: "Call or WhatsApp 0708532145 or 0708444210, or email info@sokoniarena.co.ke. The Help page lists every channel.",
        links: [{ label: "Help & Contact", to: "/help" }],
      },
    ],
  },
];

const allItems = categories.flatMap((c) => c.items);

export default function FAQ() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.schemaA,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sokoniarena.co.ke/" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://sokoniarena.co.ke/faq" },
    ],
  };

  return (
    <Layout>
      <Helmet>
        <title>Sokoni Arena FAQ | How Sokoni Works in Kenya</title>
        <meta
          name="description"
          content="Frequently asked questions about Sokoni Arena, Kenya's online marketplace (often searched as 'Sokoni'). Learn how to buy, sell, open a shop, list events, use Fun Circle, and contact support."
        />
        <meta name="keywords" content="sokoni, sokoni arena, sokoni faq, sokoni arena kenya, how sokoni works, sokoni help, sokoni shops, sokoni products" />
        <link rel="canonical" href="https://sokoniarena.co.ke/faq" />
        <meta property="og:title" content="Sokoni Arena FAQ — How Sokoni Works" />
        <meta property="og:description" content="Everything you need to know about Sokoni Arena, Kenya's online marketplace." />
        <meta property="og:url" content="https://sokoniarena.co.ke/faq" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="container py-10 md:py-16 max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link> <span className="mx-1">/</span>{" "}
          <span className="text-foreground">FAQ</span>
        </nav>

        <header className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Sokoni Arena — Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Quick answers about <strong>Sokoni</strong> (Sokoni Arena), Kenya's online marketplace for products,
            services, events, shops and the Fun Circle social space.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-3 mb-10">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{c.title}</span>
              </a>
            );
          })}
        </div>

        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <section key={c.id} id={c.id} className="mb-10 scroll-mt-24">
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon className="h-6 w-6 text-primary" />
                {c.title}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {c.items.map((item, idx) => (
                  <AccordionItem key={idx} value={`${c.id}-${idx}`}>
                    <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <p className="mb-3 leading-relaxed">{item.a}</p>
                      {item.links && item.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.links.map((l) => (
                            <Link
                              key={l.to}
                              to={l.to}
                              className="inline-flex items-center text-sm rounded-md bg-primary/10 text-primary px-3 py-1.5 hover:bg-primary/20 transition"
                            >
                              {l.label} →
                            </Link>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          );
        })}

        <div className="rounded-xl border border-border bg-muted/30 p-6 mt-12 text-center">
          <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
          <h2 className="font-display text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-4">
            Our team is happy to help with anything Sokoni Arena.
          </p>
          <Link
            to="/help"
            className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 font-medium hover:opacity-90 transition"
          >
            Contact Sokoni Arena Support
          </Link>
        </div>
      </div>
    </Layout>
  );
}
