export const metadata = {
  title: 'Privacy Policy — Halisaha',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-10 text-sm text-gray-500">Last updated: April 2025</p>

      <section className="prose prose-gray max-w-none space-y-8 text-gray-700">

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. Who We Are</h2>
          <p>
            Halisaha operates an online marketplace for booking astroturf football pitches. This
            policy explains what personal data we collect, why we collect it, and how we handle it
            in accordance with applicable data protection law, including Turkey's Law on the
            Protection of Personal Data (KVKK, Law No. 6698).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. Data We Collect</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> your email address and password (stored securely and never readable by us)</li>
            <li><strong>Booking data:</strong> the pitches you book, dates, times, and booking status</li>
            <li><strong>Pitch owner data:</strong> pitch name, address, photos, price, and phone number submitted through the listing application</li>
            <li><strong>Usage data:</strong> standard server logs (pages visited, timestamps) for debugging and service improvement</li>
          </ul>
          <p className="mt-3">We do not collect payment card details — no payment processing is active at this time.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. Why We Collect It</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>To create and manage your account</li>
            <li>To process and display your bookings to pitch owners</li>
            <li>To allow pitch owners to manage their listings and reservations</li>
            <li>To detect and prevent abuse of the platform</li>
            <li>To improve the service over time</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. Who We Share It With</h2>
          <p>
            We use <strong>Supabase</strong> (supabase.com) to store data and manage authentication.
            Your data is stored in Supabase's infrastructure and governed by their privacy practices.
            We do not sell your data or share it with advertisers. We do not use third-party analytics
            or tracking scripts.
          </p>
          <p className="mt-2">
            When you make a booking, the pitch owner sees your reservation details (date, time, price)
            but not your email address or password.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">5. How Long We Keep It</h2>
          <p>
            We retain your account and booking data for as long as your account is active. If you
            request account deletion, we will delete your personal data within 30 days, except where
            we are required to retain it by law.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">6. Your Rights (KVKK)</h2>
          <p>Under KVKK, you have the right to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Know whether your personal data is being processed</li>
            <li>Request access to your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion or anonymisation of your data</li>
            <li>Object to processing in certain circumstances</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@halisaha.com" className="text-black underline">
              privacy@halisaha.com
            </a>. We will respond within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">7. Cookies</h2>
          <p>
            We use a single session cookie to keep you logged in. We do not use advertising cookies
            or third-party tracking cookies.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this policy as the platform evolves. We will post the updated version here
            with a revised date. Continued use of the platform after changes are posted means you
            accept the updated policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">9. Contact</h2>
          <p>
            For privacy-related questions or data requests, contact us at{' '}
            <a href="mailto:privacy@halisaha.com" className="text-black underline">
              privacy@halisaha.com
            </a>.
          </p>
        </div>

      </section>
    </main>
  )
}
