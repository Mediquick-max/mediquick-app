export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: May 2025</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing and using MediQuick, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
        </Section>

        <Section title="2. Services Offered">
          <ul className="list-disc pl-5 space-y-1">
            <li>Medicine reminders and health tracking</li>
            <li>Nearby pharmacy discovery</li>
            <li>Doctor consultation booking (online & in-clinic)</li>
            <li>Home lab test booking</li>
            <li>Medicine delivery from local stores</li>
            <li>AI-powered health assistant (informational only)</li>
          </ul>
        </Section>

        <Section title="3. Medical Disclaimer">
          <p>MediQuick is a healthcare services platform, not a medical provider. The AI health assistant provides general information only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified doctor for medical concerns.</p>
        </Section>

        <Section title="4. User Responsibilities">
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate personal and health information</li>
            <li>Use the platform only for lawful purposes</li>
            <li>Maintain confidentiality of your account credentials</li>
            <li>Not misuse the AI assistant for emergency situations — call 112 instead</li>
          </ul>
        </Section>

        <Section title="5. Payments">
          <p>Payments are processed securely via Razorpay. All prices are in Indian Rupees (INR). By making a payment, you agree to Razorpay's terms of service. MediQuick does not store payment card information.</p>
        </Section>

        <Section title="6. Refund Policy">
          <p>Please refer to our <a href="/refund-policy" className="text-orange-500 underline">Refund Policy</a> for details on cancellations and refunds.</p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>MediQuick shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability is limited to the amount paid for the specific service.</p>
        </Section>

        <Section title="8. Governing Law">
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.</p>
        </Section>

        <Section title="9. Contact">
          <p>Email: <a href="mailto:support@mediquick.health" className="text-orange-500 underline">support@mediquick.health</a></p>
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
