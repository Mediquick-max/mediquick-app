export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Refund & Cancellation Policy</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: May 2025</p>

        <Section title="1. Doctor Consultations">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cancellation before 2 hours:</strong> Full refund within 5-7 business days</li>
            <li><strong>Cancellation within 2 hours:</strong> 50% refund</li>
            <li><strong>No-show:</strong> No refund</li>
            <li>If a doctor cancels: Full refund within 3-5 business days</li>
          </ul>
        </Section>

        <Section title="2. Lab Tests">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cancellation before sample collection:</strong> Full refund</li>
            <li><strong>After sample collection:</strong> No refund</li>
            <li>If lab cancels or delays: Full refund</li>
          </ul>
        </Section>

        <Section title="3. Medicine Orders (Local Delivery)">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Before dispatch:</strong> Full refund</li>
            <li><strong>After dispatch:</strong> No cancellation</li>
            <li>Wrong or damaged medicines: Full replacement or refund within 24 hours of delivery</li>
          </ul>
        </Section>

        <Section title="4. Subscription Plans (Shopkeeper)">
          <ul className="list-disc pl-5 space-y-1">
            <li>Subscriptions are non-refundable once activated</li>
            <li>In case of technical issues preventing service, contact support within 48 hours</li>
          </ul>
        </Section>

        <Section title="5. Refund Process">
          <p>Refunds are credited to the original payment method (UPI, card, net banking) within 5-7 business days. To request a refund, email us at <a href="mailto:mediquick.support@gmail.com" className="text-orange-500 underline">mediquick.support@gmail.com</a> with your order ID.</p>
        </Section>

        <Section title="6. Contact for Refunds">
          <p>Email: <a href="mailto:mediquick.support@gmail.com" className="text-orange-500 underline">mediquick.support@gmail.com</a><br />
          Response time: Within 24 hours on business days</p>
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
