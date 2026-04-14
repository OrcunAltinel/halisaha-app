import FootballLoader from '@/components/FootballLoader'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

export default async function Loading() {
  const locale = await getRequestLocale()
  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t(locale, 'My Reservations', 'Rezervasyonlarım')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t(locale, 'See all the slots you have booked.', 'Ayirttigin tüm saatleri gör.')}</p>
        </div>
        <FootballLoader message={t(locale, 'Loading your reservations…', 'Rezervasyonlarin yükleniyor…')} />
      </div>
    </main>
  )
}
