import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Mail, Phone, MapPin, Headphones, MessageCircle, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const phones = [
  { number: "0708532145", intl: "254708532145", label: "Customer Care" },
  { number: "0708444210", intl: "254708444210", label: "User Support" },
];

const emails = [
  { addr: "info@sokoniarena.co.ke", label: "General & Enquiries" },
  { addr: "support@sokoniarena.co.ke", label: "User Support" },
];

const faqs = [
  {
    q: "How do I list a product, service or event?",
    a: "Sign in, open your Dashboard, then click 'Add Listing'. Choose the section, category and subcategory, upload photos and publish.",
  },
  {
    q: "How do I contact a seller?",
    a: "Each listing has Call and WhatsApp buttons. You can also send a message from the listing page after signing in.",
  },
  {
    q: "Is SokoniArena free to use?",
    a: "Yes. Browsing, listing and chatting with sellers are all free. Optional promotions and featured placements are available.",
  },
  {
    q: "I think a listing is fraudulent — what do I do?",
    a: "Use the report option on the listing or email support@sokoniarena.co.ke. Our team acts on reports quickly.",
  },
  {
    q: "How do I become a verified seller?",
    a: "Open a shop from your Dashboard and complete email verification. Verified shops appear with a badge across the marketplace.",
  },
];

export default function Help() {
  return (
    <Layout>
      <Helmet>
        <title>Help & Contact — SokoniArena Support</title>
        <meta
          name="description"
          content="Get in touch with SokoniArena support. Call or WhatsApp 0708532145 / 0708444210, or email info@sokoniarena.co.ke. We're here to help."
        />
        <link rel="canonical" href="https://sokoniarena.co.ke/help" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 border-b border-border/50">
        <div className="container py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 text-primary text-sm font-medium mb-4">
            <Headphones className="h-4 w-4" />
            Help & Support
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            We're Here to Help
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Reach out by phone, WhatsApp or email — our support team responds quickly,
            seven days a week.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Phone & WhatsApp */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Call or WhatsApp</h2>
                    <p className="text-xs text-muted-foreground">All numbers are on WhatsApp</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {phones.map((p) => (
                    <li key={p.number} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border bg-card">
                      <div>
                        <p className="text-xs text-muted-foreground">{p.label}</p>
                        <p className="font-semibold text-base">{p.number}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`tel:+${p.intl}`}>
                            <Phone className="h-4 w-4" />
                            Call
                          </a>
                        </Button>
                        <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                          <a
                            href={`https://wa.me/${p.intl}?text=${encodeURIComponent("Hello SokoniArena, I need help with...")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaWhatsapp className="h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Email Us</h2>
                    <p className="text-xs text-muted-foreground">Replies within 24 hours</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {emails.map((e) => (
                    <li key={e.addr} className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-xs text-muted-foreground">{e.label}</p>
                      <a
                        href={`mailto:${e.addr}`}
                        className="font-semibold text-base text-primary hover:underline break-all"
                      >
                        {e.addr}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Based in Nairobi, Kenya — serving customers nationwide.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Mon — Sun</p>
                <p className="text-xs text-muted-foreground">7 days a week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Live Chat</p>
                <p className="text-xs text-muted-foreground">Use our in-app messages</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Safe & Secure</p>
                <p className="text-xs text-muted-foreground">Your data is protected</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 md:py-14 bg-muted/30 border-y border-border/50">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium mb-3">
              <HelpCircle className="h-3.5 w-3.5" />
              Frequently Asked
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-4 open:shadow-md transition-shadow"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold">
                  <span>{f.q}</span>
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-3">
              Still need help? Our team is one click away.
            </p>
            <Button asChild size="lg">
              <a href="https://wa.me/254708532145" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
