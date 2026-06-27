import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const sections: { n: number; t: string; body: string | string[] }[] = [
  { n: 1, t: "Information We Collect", body: [
    "Name", "Email address", "Phone number", "Username", "Password (hashed)",
    "Payment information (processed by third-party providers)",
    "IP address, browser information, device information",
    "Country, language, and approximate geo-location for compliance and routing",
  ]},
  { n: 2, t: "Information You Provide", body: [
    "Profile information, avatar, bio, links",
    "Uploaded files, screenshots, and submission media",
    "Messages exchanged on-Platform",
    "Task submissions, applications, and reviews",
    "Tier subscription, payout, and tax information",
  ]},
  { n: 3, t: "Automatic Information", body: [
    "Cookies and similar tracking technologies",
    "Device identifiers and fingerprints used for fraud prevention",
    "Server log data including request times, paths, and referrers",
    "Usage analytics including clicks, interactions, and time-on-page",
  ]},
  { n: 4, t: "How We Use Information", body: [
    "Operate, secure, and improve the Platform",
    "Process payments and payouts",
    "Verify accounts and prevent fraud",
    "Provide customer support",
    "Send transactional, security, and marketing communications",
    "Comply with legal and regulatory obligations",
    "Train and tune internal fraud and selection models",
  ]},
  { n: 5, t: "Communications", body: "We may send emails, SMS, push notifications, security notices, payment notifications, and marketing communications. You may opt out of marketing communications at any time from Settings." },
  { n: 6, t: "Cookies", body: "We use cookies to remember preferences, maintain sessions, analyze traffic, and improve functionality. You may control cookies through your browser settings; some features may not work properly if cookies are disabled." },
  { n: 7, t: "Payment Data", body: "Payment information is processed by third-party payment providers (such as PayPal). We do not store full card details on our servers." },
  { n: 8, t: "Data Sharing", body: [
    "Payment providers necessary to process payouts and subscriptions",
    "Cloud hosting and infrastructure providers",
    "Analytics, monitoring, and error-tracking providers",
    "Law enforcement agencies where required by law",
    "Successors in interest in connection with a merger, acquisition, or asset sale",
  ]},
  { n: 9, t: "Data Security", body: "We implement reasonable security measures including encryption in transit and at rest, firewalls, role-based access controls, multi-factor authentication for staff, and monitoring systems. No system is completely secure." },
  { n: 10, t: "Data Retention", body: "We retain information while your account is active, as required by law, for dispute resolution, and for fraud prevention. Some records may be retained indefinitely where required by regulators." },
  { n: 11, t: "Your Rights", body: [
    "Access your data",
    "Correct inaccurate data",
    "Request deletion of your account",
    "Request a copy of your data in a portable format",
    "Object to certain processing where allowed by law",
  ]},
  { n: 12, t: "Account Deletion", body: "Upon deletion, certain information may remain for legal, financial, regulatory, or fraud-prevention reasons. Withdrawal records and tax-relevant data are retained for the period required by law." },
  { n: 13, t: "Children's Privacy", body: "EGMTASKS is not intended for users under 18 years of age. We do not knowingly collect data from minors." },
  { n: 14, t: "International Users", body: "Your information may be processed outside your country of residence. By using the Platform you consent to such transfers under appropriate safeguards." },
  { n: 15, t: "Security Incidents", body: "In the event of a confirmed data breach, we may notify affected users and authorities as required by applicable law and within the timeframes set by those laws." },

  // ===== Third-quarter critical block as instructed =====
  { n: 16, t: "Data Leakage Liability", body: "Any data leaked, exfiltrated, intercepted, mishandled, or otherwise disclosed from this site by any means, attack vector, social engineering, third-party compromise, employee error, or unforeseen event is in no way the liability of EGMTASKS, its parent individual, parent organisation, partners, contractors, employees, founders, officers, or affiliated entities. Users acknowledge they are providing information at their own risk and waive any claim to monetary or reputational damages arising from such events to the maximum extent permitted by law." },
  { n: 17, t: "Behavioural & Selection Data", body: "EGMTASKS collects behavioural and engagement data to operate the tier-weighted selection algorithm. Tier subscription status, application history, completion rate, fraud score, and device fingerprint are inputs to selection priority and ad/campaign distribution." },
  { n: 18, t: "Telemetry & Fingerprinting", body: "We employ device fingerprinting, IP intelligence, and behavioural telemetry for the prevention of fraud, multi-accounting, bot abuse, and the enforcement of daily campaign-task limits for non-tier accounts." },

  // ===== Continuing =====
  { n: 19, t: "Marketing & Advertisers", body: "Aggregate, de-identified statistics about ad views and engagement may be shared with advertisers. Personally identifiable information is never sold." },
  { n: 20, t: "Embedded Third-Party Media", body: "When you watch embedded videos (YouTube, Facebook, TikTok, Instagram, Vimeo and similar), the embed providers may collect their own analytics and cookies. Their privacy policies apply to that data." },
  { n: 21, t: "Do Not Track", body: "EGMTASKS does not currently respond to Do-Not-Track browser signals due to the lack of an industry standard." },
  { n: 22, t: "Changes To This Policy", body: "We may update this Privacy Policy periodically. Continued use of the Platform constitutes acceptance of updates." },
  { n: 23, t: "Contact Information", body: "EGMTASKS Support — Email: support@egmtasks.com — Website: https://www.egmtasks.com" },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold">EGMTASKS Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: June 27, 2026</p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <section key={s.n} id={`p-${s.n}`}>
                <h2 className="font-display text-xl font-semibold">{s.n}. {s.t.toUpperCase()}</h2>
                {Array.isArray(s.body) ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                    {s.body.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                )}
              </section>
            ))}

            <section>
              <h2 className="font-display text-xl font-semibold">ACCEPTANCE</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                By creating an account or using EGMTASKS, you acknowledge that you have read, understood, and agreed to this Privacy Policy and our Terms & Conditions.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Privacy;
