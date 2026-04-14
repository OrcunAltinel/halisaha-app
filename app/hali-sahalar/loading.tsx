import FootballLoader from '@/components/FootballLoader'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

export default async function LoadingAstroturfsPage() {
  const locale = await getRequestLocale()
  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <FootballLoader message={t(locale, 'Finding pitches near you…', 'Yakınindaki sahalar aranıyor…')} />
      </div>
    </main>
  )
}
