import { StaticShell } from "@/components/site/StaticShell";

function Terms() {
  return (
    <StaticShell title="Terms & Conditions" sub={`Last updated ${new Date().toLocaleDateString()}`}>
      <p>EGMTASKS (egmtasks.com), operated from Nairobi, Kenya, provides a marketplace for micro-tasks and freelance work. By using the platform you agree to these Terms.</p>
      <h2>1. Accounts</h2>
      <p>You must be 18+ and provide accurate information. Email verification is required. We may suspend accounts violating these terms.</p>
      <h2>2. Tasks &amp; selection</h2>
      <p>
        Clients post tasks with clear instructions. Every active task is open to all verified
        workers — no subscription tier is required to apply. When applicants exceed the available
        slots, our internal selection algorithm assigns a confidential weighted likelihood to each
        applicant. Paid tiers receive a higher weighting (Gold &gt; Silver &gt; Bronze). The exact
        weights are not publicly disclosed. Maximum 20 workers per task. Submissions are reviewed
        before payment.
      </p>
      <h2>3. Payments</h2>
      <p>
        Tier subscriptions are processed through PayPal. Bronze is $5, Silver is $100 and Gold is
        $1000 per month. Worker payouts are processed monthly between the 1st and 5th after task
        approval, subject to admin review. Minimum withdrawal is set by the platform.
      </p>
      <h2>4. Tier benefits on ad &amp; campaign viewing</h2>
      <p>
        Accounts with an active paid tier have their qualifying ad and campaign views recorded as
        completed tasks, in addition to earning standard view credits.
      </p>
      <h2>5. Acceptable use</h2>
      <p>No spam, fake engagement, multi-accounting, fraudulent submissions, or illegal content. Violations trigger account suspension or ban.</p>
      <h2>6. Liability</h2>
      <p>The service is provided "as is". EGMTASKS is not liable for indirect damages.</p>
    </StaticShell>
  );
}

export default Terms;
