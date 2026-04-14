'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

const LOCATIONS = ['İskele', 'Mağusa', 'Lefkoşa', 'Girne', 'Lefke', 'Güzelyurt']

export default function LocationSelector() {
  const [location, setLocation] = useState('')
  const router = useRouter()
  const { locale } = useLocale()

  const handleSearch = () => {
    if (!location) return
    router.push(`/hali-sahalar?location=${encodeURIComponent(location)}`)
  }

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-2xl ring-1 ring-white/10">
      <div className="flex flex-col gap-3 md:flex-row">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 outline-none text-black dark:text-white"
        >
          <option value="">{t(locale, 'Choose location', 'Konum seçin')}</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          className="rounded-xl bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900"
        >
          {t(locale, 'Search', 'Ara')}
        </button>
      </div>
    </div>
  )
}
