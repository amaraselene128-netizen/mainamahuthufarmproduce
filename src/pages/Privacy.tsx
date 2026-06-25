import { StaticShell } from "@/components/site/StaticShell";

function Privacy() {
  return (
    <StaticShell title="Privacy Policy" sub={`Last updated ${new Date().toLocaleDateString()}`}>
      <p>EGMTASKS Headquarters · Nairobi, Kenya. This policy explains how we handle your personal data.</p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account: email, username, country, password (hashed).</li>
        <li>Profile: name, avatar, bio, skills, social links.</li>
        <li>Activity: tasks, applications, submissions, ad/campaign views, device fingerprint, IP for fraud prevention.</li>
        <li>Payments: PayPal transaction identifiers (we never store card or PayPal credentials).</li>
      </ul>
      <h2>How we use it</h2>
      <p>To operate the marketplace, match workers and clients, process payouts, prevent fraud, and provide support.</p>
      <h2>Task selection algorithm</h2>
      <p>
        All active tasks are visible and openable to every verified worker regardless of subscription
        status. To balance opportunities, our internal selection algorithm assigns a weighted
        likelihood to each applicant. Subscribers to a paid tier receive a higher weighting, with
        Gold &gt; Silver &gt; Bronze. The exact weights are confidential and may be tuned over time
        to keep the marketplace fair and fraud-resistant. No tier is ever required to apply.
      </p>
      <h2>Sharing</h2>
      <p>We share data with hosting, analytics and payment providers (including PayPal) under contract. We never sell personal data.</p>
      <h2>Your rights</h2>
      <p>Access, correction, deletion, portability. Contact <a href="mailto:privacy@egmtasks.com">privacy@egmtasks.com</a>.</p>
    </StaticShell>
  );
}

export default Privacy;
