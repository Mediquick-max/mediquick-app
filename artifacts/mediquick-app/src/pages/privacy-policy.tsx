export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: May 2025</p>

        <Section title="1. Information We Collect">
          <p>We collect information you provide when you register, book appointments, order medicines, or contact us. This includes your name, email address, phone number, city, and health-related information necessary to provide our services.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To process medicine orders and lab test bookings</li>
            <li>To facilitate doctor consultations and video calls</li>
            <li>To send medicine reminders and health notifications</li>
            <li>To improve our platform and customer experience</li>
            <li>To process payments securely via Razorpay</li>
          </ul>
        </Section>

        <Section title="3. Payment Information">
          <p>All payments are processed through Razorpay, a trusted payment gateway. We do not store your card or banking information on our servers. Razorpay's privacy policy governs how your payment data is handled.</p>
        </Section>

        <Section title="4. Data Sharing">
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information with healthcare providers (doctors, labs, pharmacies) solely to fulfil your service requests.</p>
        </Section>

        <Section title="5. Data Security">
          <p>We implement industry-standard security measures to protect your personal data. All data transmission is encrypted using SSL/TLS technology.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:mediquick.support@gmail.com" className="text-orange-500 underline">mediquick.support@gmail.com</a> to exercise these rights.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use cookies to enhance your experience on our platform. You can disable cookies in your browser settings, but some features may not work properly.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>For privacy-related queries, contact us at:<br />
            Email: <a href="mailto:mediquick.support@gmail.com" className="text-orange-500 underline">mediquick.support@gmail.com</a><br />
            Website: <a href="https://mediquick-app-mediquick-app.vercel.app" className="text-orange-500 underline">mediquick-app-mediquick-app.vercel.app</a>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      <div className="text-gray-600 leading-relaxed text-sm">{children}</div>
    </div>
  );
}
