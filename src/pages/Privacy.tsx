import { StaticShell } from "@/components/site/StaticShell";

function Privacy() {
  return (
    <StaticShell title="Privacy Policy" sub={`Last updated ${new Date().toLocaleDateString()}`}>
      <p>EGRATASKS Headquarters · Nairobi, Kenya. This policy explains how we handle your personal data.</p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account: email, username, country, password (hashed).</li>
        <li>Profile: name, avatar, bio, skills, social links.</li>
        <li>Activity: tasks, applications, submissions, device fingerprint, IP for fraud prevention.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To operate the marketplace, match workers and clients, process payouts, prevent fraud, and provide support.</p>
      <h2>Sharing</h2>
      <p>We share data with hosting/payment providers under contract. We never sell personal data.</p>
      <h2>Your rights</h2>
      <p>Access, correction, deletion, portability. Contact <a href="mailto:privacy@egratasks.com">privacy@egratasks.com</a>.</p>
    </StaticShell>
  );
}

export default Privacy;
