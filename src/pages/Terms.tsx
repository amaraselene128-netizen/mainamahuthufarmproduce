import { StaticShell } from "@/components/site/StaticShell";

function Terms() {
  return (
    <StaticShell title="Terms & Conditions" sub={`Last updated ${new Date().toLocaleDateString()}`}>
      <p>EGMTASKS (egmtasks.com), operated from Nairobi, Kenya, provides a marketplace for micro-tasks and freelance work. By using the platform you agree to these Terms.</p>
      <h2>1. Accounts</h2>
      <p>You must be 18+ and provide accurate information. Email verification is required. We may suspend accounts violating these terms.</p>
      <h2>2. Tasks</h2>
      <p>Clients post tasks with clear instructions. Workers apply first-come, first-served (max 20 workers/task). Submissions are reviewed before payment.</p>
      <h2>3. Payments</h2>
      <p>Payouts are processed monthly on the 5th after task approval, subject to admin review. Minimum withdrawal is set by the platform.</p>
      <h2>4. Acceptable use</h2>
      <p>No spam, fake engagement, multi-accounting, fraudulent submissions, or illegal content. Violations trigger account suspension or ban.</p>
      <h2>5. Liability</h2>
      <p>The service is provided "as is". EGMTASKS is not liable for indirect damages.</p>
      <h2>6. Membership packages</h2>
      <ul>
        <li>The principal amount paid for any purchased package is non-refundable.</li>
        <li>A subscription may only be cancelled if the user deposits an amount equal to the original principal amount to cover operational and cancellation fees.</li>
        <li>EGMTASKS reserves the right to modify package benefits, withdrawal requirements, and platform policies when necessary.</li>
        <li>Any misuse of the platform, fraudulent activities, or violation of the platform's terms may result in account suspension or termination.</li>
      </ul>
    </StaticShell>
  );
}

export default Terms;
