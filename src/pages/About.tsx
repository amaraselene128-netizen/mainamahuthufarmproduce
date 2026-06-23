import { StaticShell } from "@/components/site/StaticShell";

function About() {
  return (
    <StaticShell title="About EGMTASKS" sub="The premium global marketplace for micro-tasks, social engagement and freelance work.">
      <h2>Our mission</h2>
      <p>EGMTASKS exists to make digital work radically accessible. We connect verified workers in 100+ countries with clients who need YouTube engagement, app installs, social shares, content reviews, and a thousand other small jobs — quickly, securely, and at fair pricing.</p>
      <h2>Where we are</h2>
      <p>EGMTASKS Headquarters · Nairobi, Kenya.</p>
      <h2>How it works</h2>
      <ul>
        <li>Clients post tasks across 9+ categories with clear instructions and payment per submission.</li>
        <li>Workers apply on a first-come, first-served basis (max 20 per task).</li>
        <li>Approved work is paid out monthly on the 5th via PayPal, M-Pesa, Wise or crypto.</li>
      </ul>
      <h2>Trust & safety</h2>
      <p>We run an AI-assisted fraud detection engine, country-level restrictions, two-factor authentication and verified email accounts on every sign-up.</p>
      <h2 id="careers">Careers</h2>
      <p>We're always looking for product, engineering and operations talent. Email <a href="mailto:careers@egmtasks.com">careers@egmtasks.com</a>.</p>
    </StaticShell>
  );
}

export default About;
