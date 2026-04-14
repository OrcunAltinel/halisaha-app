import Link from 'next/link'
import LocationSelector from '@/components/LocationSelector'
import AstroturfCard from '@/components/AstroturfCard'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { createSupabaseServerClient } from '@/lib/supabase'


type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  price_per_hour: number
  is_active: boolean
}

export default async function HomePage() {
  const locale = await getRequestLocale()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('astroturf_list_view')
    .select('*')
    .eq('is_active', true)
    .limit(6)

  const astroturfs = (data ?? []) as Astroturf[]

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950">
      {/* Hero */}
      <section className="relative bg-gray-950 overflow-hidden px-6 py-24 text-white">
        {/* CSS pitch-line decorations */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-52 w-52 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/20" />
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-36 w-20 border-l border-t border-b border-white/10" />

        <div className="relative mx-auto max-w-6xl flex flex-col items-center text-center">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
              {t(locale, 'Cyprus Football', 'Kıbrıs Futbolu')}
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            {locale === 'tr' ? (
              <>
                Kıbrıs&apos;ta en iyi<br />
                <span className="text-green-400">halı sahaları</span><br />
                keşfet ve rezerve et
              </>
            ) : (
              <>
                Find &amp; book the best<br />
                <span className="text-green-400">astroturf pitches</span><br />
                in Cyprus
              </>
            )}
          </h1>

          <p className="mt-5 max-w-xl text-base text-gray-400 md:text-lg">
            {t(locale, 'Choose your location, explore nearby halısahas, and reserve your slot in seçonds.', 'Konumunu seç, yakınındaki halı sahaları keşfet ve saniyeler içinde yerini ayırt.')}
          </p>

          <div className="mt-8 w-full max-w-xl">
            <LocationSelector />
          </div>

          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/hali-sahalar" className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-gray-300 hover:border-green-500 hover:text-green-400 transition-colors">
              {t(locale, 'Browse all pitches →', 'Tüm sahaları gör →')}
            </Link>
            <Link href="/teams" className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-gray-300 hover:border-green-500 hover:text-green-400 transition-colors">
              {t(locale, 'View teams →', 'Takımları gör →')}
            </Link>
            <Link href="/list-your-pitch" className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-gray-300 hover:border-green-500 hover:text-green-400 transition-colors">
              {t(locale, 'List your pitch →', 'Sahanı listele →')}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white md:text-3xl">
              {t(locale, 'Featured Pitches', 'Öne Çıkan Sahalar')}
            </h2>
            <Link href="/hali-sahalar" className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
              {t(locale, 'View all →', 'Tümünü gör →')}
            </Link>
          </div>

          {astroturfs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {astroturfs.map((field) => (
                <AstroturfCard key={field.id} field={field} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t(locale, 'No astroturfs yet', 'Henüz halı saha yok')}</p>
          )}
        </div>
      </section>
    </main>
  )
}
