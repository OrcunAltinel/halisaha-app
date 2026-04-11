export const metadata = {
  title: 'Terms of Service — Halisaha',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
      <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">Last updated: April 2025</p>

      <section className="prose prose-gray max-w-none space-y-8 text-gray-700 dark:text-gray-300">

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. About Halisaha</h2>
          <p>
            Halisaha is an online marketplace that connects players looking to book astroturf football
            pitches with pitch owners who list their venues on the platform. We provide the technology
            to facilitate bookings — we are not a pitch operator and do not own or manage any of the
            listed venues.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account and make bookings. By registering,
            you confirm that the information you provide is accurate and up to date.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Bookings and Cancellations</h2>
          <p>
            When you request a booking, the pitch owner reviews and approves or rejects it. A booking
            is only confirmed once the owner approves it. You may cancel a pending or confirmed booking
            through your reservations page. Cancellation policies for individual pitches may vary —
            check the pitch details before booking.
          </p>
          <p className="mt-2">
            Halisaha is not responsible for losses arising from a booking being rejected or cancelled
            by either party.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Pitch Owners</h2>
          <p>
            Pitch owners who list venues on Halisaha are responsible for the accuracy of their listing
            information, including pricing, availability, address, and photos. Owners are solely
            responsible for the condition and safety of their venues. Halisaha does not inspect or
            guarantee the quality of any listed pitch.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Create fake accounts or impersonate other people</li>
            <li>Submit false or misleading listing information</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to interfere with or disrupt the service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Liability</h2>
          <p>
            Halisaha provides the platform on an "as is" basis. We are not liable for injuries,
            damages, or losses that occur at any venue booked through the platform. Users and pitch
            owners engage with each other at their own risk.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Account Suspension</h2>
          <p>
            We reserve the right to suspend or terminate any account that violates these terms or
            that we reasonably believe is being used abusively.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">8. Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after changes
            are posted constitutes your acceptance of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">9. Governing Law</h2>
          <p>
            These terms are governed by applicable law. Any disputes will be resolved in the
            appropriate jurisdiction.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">10. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:hello@halisaha.com" className="text-black dark:text-white underline">
              hello@halisaha.com
            </a>.
          </p>
        </div>

      </section>
    </main>
  )
}
