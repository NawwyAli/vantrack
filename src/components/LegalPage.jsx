export default function LegalPage({ page, onBack }) {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>
      <div className="legal-content">
        {page === 'privacy' ? <PrivacyPolicy /> : <TermsAndConditions />}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="legal-section">
      <h2 className="legal-h2">{title}</h2>
      {children}
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <>
      <h1 className="legal-h1">Privacy Policy</h1>
      <p className="legal-meta">Last updated: April 2026</p>

      <Section title="Who We Are">
        <p>VanTrack is a CP12 certificate tracking tool for sole trader gas engineers and plumbers. References to "we", "us", or "VanTrack" in this policy refer to the operator of this service.</p>
        <p>For questions about this policy, contact us at: <strong>vantrack@outlook.com</strong></p>
      </Section>

      <Section title="What Data We Collect">
        <p>We collect and store the following information when you use VanTrack:</p>
        <ul>
          <li><strong>Account data:</strong> Your email address, password (hashed), and trade type (gas engineer, plumber, or both).</li>
          <li><strong>Client data:</strong> Landlord names, addresses, phone numbers, and email addresses that you add to the app.</li>
          <li><strong>Certificate data:</strong> CP12 certificate issue dates, expiry dates, and notes.</li>
          <li><strong>Payment data:</strong> Billing information is handled entirely by Stripe. We store only a Stripe customer ID — we never see or store your full card details.</li>
          <li><strong>Usage data:</strong> Basic logs for security and debugging purposes.</li>
        </ul>
      </Section>

      <Section title="How We Use Your Data">
        <p>We use your data solely to provide the VanTrack service, including:</p>
        <ul>
          <li>Managing your account and authentication</li>
          <li>Storing and displaying your client and certificate records</li>
          <li>Sending automated CP12 expiry reminder emails to landlords on your behalf</li>
          <li>Processing subscription payments</li>
        </ul>
        <p>We do not sell your data or use it for advertising.</p>
      </Section>

      <Section title="Third-Party Services">
        <p>VanTrack uses the following third-party services to operate:</p>
        <ul>
          <li><strong>Supabase</strong> — Database and authentication. Data is stored on EU servers. <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></li>
          <li><strong>Stripe</strong> — Payment processing. <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></li>
          <li><strong>Resend</strong> — Transactional email delivery for landlord reminders. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a></li>
        </ul>
      </Section>

      <Section title="Data Retention">
        <p>We retain your data for as long as your account is active. If you cancel your subscription and wish to delete your data, contact us at vantrack@outlook.com and we will delete your account and all associated data within 30 days.</p>
      </Section>

      <Section title="Your Rights (GDPR)">
        <p>If you are based in the UK or EU, you have the following rights under GDPR:</p>
        <ul>
          <li>Right to access the data we hold about you</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
        </ul>
        <p>To exercise any of these rights, email <strong>vantrack@outlook.com</strong>.</p>
      </Section>

      <Section title="Cookies">
        <p>VanTrack uses only essential cookies required for authentication (session tokens stored in your browser's local storage). We do not use tracking or advertising cookies.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this policy from time to time. We will notify you of significant changes by email or via an in-app notice.</p>
      </Section>
    </>
  )
}

function TermsAndConditions() {
  return (
    <>
      <h1 className="legal-h1">Terms &amp; Conditions</h1>
      <p className="legal-meta">Last updated: April 2026</p>

      <Section title="About VanTrack">
        <p>VanTrack is a subscription-based web application for sole trader gas engineers and plumbers to track CP12 gas safety certificates and manage landlord clients. By creating an account, you agree to these terms.</p>
      </Section>

      <Section title="Free Trial">
        <p>New accounts receive a <strong>14-day free trial</strong> with full access to all features. No payment details are required to start a trial. At the end of the trial period, access is suspended until a paid subscription is activated.</p>
      </Section>

      <Section title="Subscription">
        <ul>
          <li>The subscription fee is <strong>£25 per month</strong>, billed monthly.</li>
          <li>Payment is processed securely by Stripe.</li>
          <li>Your subscription renews automatically each month unless cancelled.</li>
          <li>You may cancel at any time. Access continues until the end of the current billing period. No partial refunds are issued.</li>
          <li>We reserve the right to change pricing with 30 days' notice.</li>
        </ul>
      </Section>

      <Section title="Your Responsibilities">
        <p>You are responsible for:</p>
        <ul>
          <li>Ensuring the accuracy of all certificate dates and client information you enter.</li>
          <li>Complying with your legal obligations under the Gas Safety (Installation and Use) Regulations 1998.</li>
          <li>Keeping your login credentials secure.</li>
          <li>Ensuring landlord email addresses are accurate before enabling reminder emails.</li>
        </ul>
        <p>VanTrack is a record-keeping tool only. It does not replace your legal obligations as a Gas Safe registered engineer.</p>
      </Section>

      <Section title="Limitation of Liability">
        <p>VanTrack is provided "as is". To the maximum extent permitted by law, we are not liable for:</p>
        <ul>
          <li>Any missed certificate renewals or compliance failures</li>
          <li>Reminder emails that fail to deliver due to incorrect addresses or spam filters</li>
          <li>Data loss due to circumstances beyond our reasonable control</li>
          <li>Any indirect, incidental, or consequential damages</li>
        </ul>
      </Section>

      <Section title="Intellectual Property">
        <p>VanTrack and its content are our intellectual property. You may not copy, reproduce, or redistribute any part of the service without written permission.</p>
      </Section>

      <Section title="Termination">
        <p>We reserve the right to suspend or terminate accounts that violate these terms or are used fraudulently. You may close your account at any time by contacting vantrack@outlook.com.</p>
      </Section>

      <Section title="Governing Law">
        <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
      </Section>

      <Section title="Contact">
        <p>For any questions about these terms, contact us at <strong>vantrack@outlook.com</strong>.</p>
      </Section>
    </>
  )
}
