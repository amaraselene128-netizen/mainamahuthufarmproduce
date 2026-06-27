import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const sections: { n: number; t: string; body: string | string[] }[] = [
  { n: 1, t: "Definitions", body: [
    "User: Any individual or organization using EGMTASKS.",
    "Client: A user who posts tasks, jobs, or advertisement campaigns.",
    "Freelancer / Worker: A user who submits proposals or performs tasks.",
    "Services: All products and services provided through EGMTASKS.",
    "Content: Text, images, videos, files, software, and other materials uploaded to the Platform.",
    "Escrow: Funds held by EGMTASKS pending fulfilment of a task or campaign.",
    "Tier: A paid subscription level (Bronze, Silver, Gold) granting selection-priority advantages.",
  ]},
  { n: 2, t: "Eligibility", body: "You must be at least 18 years old, have the legal capacity to enter contracts, and provide accurate registration information. EGMTASKS may refuse, suspend or terminate any account that does not meet these requirements without notice." },
  { n: 3, t: "Account Registration", body: [
    "Provide accurate, current, and complete information at all times.",
    "Maintain account security; you are solely responsible for any activity under your account.",
    "Keep your password confidential and use a unique password not shared with any other service.",
    "Notify EGMTASKS immediately of any unauthorized access.",
  ]},
  { n: 4, t: "Account Verification", body: [
    "EGMTASKS may at any time require email verification, phone verification, government identification, biometric verification, or additional documents.",
    "Failure to provide requested information may result in account suspension, withholding of funds, or permanent termination.",
  ]},
  { n: 5, t: "User Responsibilities", body: [
    "Use the Platform lawfully and only for purposes allowed by local, national, and international law.",
    "Provide truthful information in profiles, submissions, and disputes.",
    "Respect other users and EGMTASKS staff at all times.",
    "Deliver agreed services professionally and on time.",
  ]},
  { n: 6, t: "Prohibited Activities", body: [
    "Creating fake accounts, sock-puppets, or multiple accounts to manipulate the Platform.",
    "Using bots, automation, scrapers, or any tool that interacts with the Platform programmatically without written consent.",
    "Committing fraud, money laundering, or any financial crime.",
    "Circumventing payment, escrow, or fee systems.",
    "Distributing malware, viruses, or harmful code.",
    "Harassing, threatening, stalking, or doxxing users.",
    "Posting illegal, hateful, sexual, exploitative, or violent content.",
    "Violating intellectual property rights.",
    "Manipulating reviews, ratings, or selection algorithms.",
    "Reverse-engineering, decompiling, or otherwise tampering with EGMTASKS software.",
  ]},
  { n: 7, t: "Task Posting Rules", body: [
    "Tasks must be legal in the client's and worker's jurisdictions.",
    "Instructions must be clear, complete, and free of hidden conditions.",
    "Payment must be deposited in full into escrow before a task may be published. Tasks will not appear publicly until payment clears.",
    "Deadlines must be reasonable.",
    "Tier requirements for a task are set by EGMTASKS administrators during review — not by clients.",
  ]},
  { n: 8, t: "Worker Rules", body: [
    "Workers must submit original work; plagiarism is grounds for permanent ban.",
    "Workers may not outsource tasks without express permission of the client and EGMTASKS.",
    "Workers must meet deadlines, follow instructions precisely, and respond to reasonable revision requests.",
  ]},
  { n: 9, t: "Proposals and Selection", body: [
    "Workers may apply to any open task regardless of their current tier. Tier subscription affects placement priority but does not gate access.",
    "Each task accepts a fixed pool of workers. Slots are allocated 18 to tier-subscribed applicants (Gold → Silver → Bronze) and 2 to non-tier applicants.",
    "Clients reserve the right to accept, reject, or cancel proposals through the EGMTASKS admin process.",
  ]},
  { n: 10, t: "Fees", body: [
    "EGMTASKS may charge service fees, commission fees, subscription fees, withdrawal fees, advertisement fees, currency-conversion fees, and chargeback fees.",
    "Fees may change at any time. Continued use after a fee change constitutes acceptance.",
  ]},
  { n: 11, t: "Payments", body: "Accepted methods include PayPal and other approved channels rolled out region-by-region (M-Pesa, Stripe, bank transfers, credit/debit cards, Payoneer, Wise). EGMTASKS may add, remove, or restrict payment methods at its sole discretion." },
  { n: 12, t: "Escrow System", body: [
    "Client funds are held in escrow until the task is completed, the client approves delivery, disputes are resolved, or another condition of release defined in these Terms is met.",
    "EGMTASKS may release, freeze, refund, or reallocate escrowed funds in accordance with its dispute and anti-fraud policies.",
  ]},
  { n: 13, t: "Refunds", body: [
    "Refunds may be granted where the worker fails to deliver, where delivered work materially differs from instructions, where fraud is detected, or where required by law.",
    "Refunds are not guaranteed and remain at the sole discretion of EGMTASKS.",
    "Subscription tier purchases are non-refundable once tier privileges have begun accruing.",
  ]},
  { n: 14, t: "Disputes", body: [
    "EGMTASKS may investigate any dispute, request evidence, review private communications occurring on-Platform, and issue final binding decisions.",
    "By using EGMTASKS you agree that internal dispute decisions are final and waive any right to chargeback for resolved disputes.",
  ]},
  { n: 15, t: "User Content", body: "You retain ownership of your content. By posting content, you grant EGMTASKS a perpetual, irrevocable, worldwide, royalty-free, sublicensable license to display, store, process, reproduce, distribute, and create derivative works of that content for operating, marketing, and improving the Platform." },
  { n: 16, t: "Intellectual Property", body: "All Platform software, logos, trademarks, designs, models, and underlying algorithms belong to EGMTASKS and/or its licensors. Unauthorized use is strictly prohibited and may result in civil and criminal liability." },
  { n: 17, t: "Reviews and Ratings", body: [
    "Reviews must be truthful and based on actual experiences.",
    "Reviews must not contain abusive, defamatory, hateful, or sexually explicit language.",
    "EGMTASKS may remove fake, retaliatory, or policy-violating reviews without notice.",
  ]},
  { n: 18, t: "Account Suspension", body: "EGMTASKS may suspend or terminate accounts at any time for fraud, abuse, illegal activity, operation of multiple accounts, terms violations, suspicious financial activity, or any other reason consistent with its lawful interests." },
  { n: 19, t: "Termination", body: "Users may close accounts at any time, but obligations relating to payments, intellectual property, indemnities, disputes, and surviving warranties remain enforceable after termination." },
  { n: 20, t: "Advertisements", body: "EGMTASKS displays advertisements both as uploaded video and as embedded third-party video (YouTube, Facebook, TikTok, Instagram, Vimeo, and others). Advertisers are solely responsible for the content, legality, and intellectual property of all submitted material." },
  { n: 21, t: "Third-Party Links", body: "The Platform may contain third-party links. EGMTASKS is not responsible for external websites, services, or content." },
  { n: 22, t: "Disclaimer of Warranties", body: 'The Platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, accuracy, reliability, or non-infringement.' },
  { n: 23, t: "Limitation of Liability", body: "To the maximum extent permitted by law, EGMTASKS, its parent organizations, owners, officers, directors, employees, and affiliates shall not be liable for any lost profits, lost data, indirect, incidental, special, exemplary, or consequential damages arising from your use of the Platform or any user-to-user dispute." },
  { n: 24, t: "Indemnification", body: "You agree to indemnify, defend, and hold harmless EGMTASKS from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of your content, your conduct, your tasks, your submissions, or any violation of these Terms." },
  { n: 25, t: "Force Majeure", body: "EGMTASKS shall not be liable for failures caused by natural disasters, internet outages, government actions, cyberattacks, war, pandemics, labor disputes, or any event beyond reasonable control." },

  // ===== Third-quarter critical block as instructed =====
  { n: 26, t: "Uncollected Balances", body: "Any funds not collected within two (2) months following the date of pay-maturity may be possessed, reclaimed, and absorbed by EGMTASKS to cover platform maintenance, account services, escrow services, and operational overhead. Users are solely responsible for initiating and completing timely withdrawals." },
  { n: 27, t: "Legal Liability of Tasks", body: "All activity, tasks, campaigns, jobs, advertisements, or content posted on EGMTASKS carry their full legal liability with the client and worker only. EGMTASKS, its founders, owners, employees, partners, contractors, suppliers, parent or subsidiary entities, and affiliated organisations bear no liability or legal responsibility for the lawfulness, propriety, accuracy, or consequences of any task in any state, country, monarchy, republic, federation, alliance, organisation, or other jurisdiction in any way, shape, or form." },
  { n: 28, t: "Principal & Subscription Non-Withdrawability", body: "The principal funds paid for a tier subscription, advertisement, or escrow deposit are not withdrawable once a tier has been activated, a campaign has launched, or a task has been published. Earnings accrued separately from these principals remain withdrawable subject to the normal payout schedule." },
  { n: 29, t: "Pre-Funding Requirement", body: "Payments to workers, advertisement views, or any other payable obligation may be processed only after the client posting the task has deposited and paid the full amount into EGMTASKS escrow. EGMTASKS does not extend credit to any client under any circumstance." },

  // ===== Continuing =====
  { n: 30, t: "Anti-Fraud Policy", body: "EGMTASKS reserves the right to investigate suspicious activity, freeze user funds, demand verification, suspend accounts, share information with law enforcement, and pursue legal remedies against fraudulent users." },
  { n: 31, t: "Anti-Money Laundering", body: "Users may be required to undergo identity verification, source-of-funds checks, and ongoing monitoring to comply with global financial regulations. Failure to comply may result in funds being permanently withheld and reported to authorities." },
  { n: 32, t: "Taxes", body: "Users are solely responsible for reporting income, paying taxes, complying with tax filings, and meeting all local tax obligations. EGMTASKS does not provide tax advice." },
  { n: 33, t: "Tier System Disclosure", body: "EGMTASKS uses a tier-weighted selection algorithm. Subscribing to Bronze, Silver, or Gold dramatically increases the likelihood that an applicant will be selected for a task. Gold receives the highest priority, followed by Silver, then Bronze. Of 20 worker slots per task, 18 are reserved for tier subscribers. Non-tier accounts are additionally limited to 20 advertisement/campaign tasks per 24-hour rolling window; tier subscribers have no such cap." },
  { n: 34, t: "Embedded Video Advertisements", body: "Clients may submit advertisements as direct uploads or as embedded video references (YouTube, Facebook, TikTok, Instagram, Vimeo, and similar). Advertisers warrant that they hold all rights to embed and monetize such media on EGMTASKS." },
  { n: 35, t: "Wallet & Withdrawals", body: "Monthly payouts are processed on the 5th of every calendar month. Minimum withdrawal thresholds apply and may change without notice. EGMTASKS may delay, reverse, or cancel withdrawals tied to disputed, fraudulent, or unverified accounts." },
  { n: 36, t: "Chargebacks", body: "Initiating a chargeback without first using EGMTASKS dispute resolution is a material breach of these Terms and may result in immediate account termination and recovery of all funds plus legal costs." },
  { n: 37, t: "Communications", body: "By creating an account you consent to receive transactional, security, and operational communications from EGMTASKS via email, SMS, in-app notifications, and other channels. Marketing communications may be opted out of within Settings." },
  { n: 38, t: "Service Changes", body: "EGMTASKS may modify, suspend, or discontinue any feature, tier, payment method, or service at any time, with or without notice." },
  { n: 39, t: "Severability", body: "If any provision of these Terms is found unenforceable, the remainder shall continue in full force and effect." },
  { n: 40, t: "Modifications", body: "EGMTASKS may update these Terms at any time. Continued use of the Platform constitutes acceptance of changes." },
  { n: 41, t: "Governing Law", body: "These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya. You consent to the exclusive jurisdiction of the courts of Nairobi for any dispute not resolved through internal dispute resolution." },
];

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold">EGMTASKS Terms and Conditions</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: June 27, 2026</p>
          <p className="mt-6 text-muted-foreground">
            Welcome to EGMTASKS ("Platform", "Website", "we", "our", "us"). By accessing or using EGMTASKS,
            you agree to comply with these Terms and Conditions. If you do not agree, please do not use the Platform.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <section key={s.n} id={`s-${s.n}`}>
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
                By creating an account or using EGMTASKS, you acknowledge that you have read, understood, and agreed to these Terms & Conditions and the Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Terms;
