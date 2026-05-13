export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">Contact Us</h1>
        <p className="text-gray-500 text-sm mb-8">We're here to help — reach out anytime</p>

        <div className="space-y-6">
          <ContactCard
            icon="📧"
            title="Email Support"
            value="support@mediquick.health"
            href="mailto:support@mediquick.health"
          />
          <ContactCard
            icon="🌐"
            title="Website"
            value="mediquick-app-mediquick-app.vercel.app"
            href="https://mediquick-app-mediquick-app.vercel.app"
          />
          <ContactCard
            icon="⏰"
            title="Support Hours"
            value="Monday – Saturday, 9 AM – 7 PM IST"
          />
          <ContactCard
            icon="📍"
            title="Business Address"
            value="India"
          />
        </div>

        <div className="mt-10 p-5 bg-orange-50 rounded-xl border border-orange-100">
          <h2 className="text-lg font-semibold text-orange-600 mb-2">🚨 Medical Emergency?</h2>
          <p className="text-gray-700 text-sm">Do NOT use this contact form for medical emergencies. Call <strong>112</strong> (National Emergency) or <strong>102</strong> (Ambulance) immediately.</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-1">
          <p><a href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</a></p>
          <p><a href="/terms" className="text-orange-500 hover:underline">Terms & Conditions</a></p>
          <p><a href="/refund-policy" className="text-orange-500 hover:underline">Refund & Cancellation Policy</a></p>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, value, href }: { icon: string; title: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{title}</p>
        {href ? (
          <a href={href} className="text-orange-500 font-medium hover:underline">{value}</a>
        ) : (
          <p className="text-gray-700 font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}
