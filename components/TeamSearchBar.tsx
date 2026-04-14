'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  initialQuery: string
}

export default function TeamSearchBar({ initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)
  const { locale } = useLocale()

  function apply(e?: React.FormEvent) {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    const qs = params.toString()
    startTransition(() => { router.push(qs ? `${pathname}?${qs}` : pathname) })
  }

  function clear() {
    setQuery('')
    startTransition(() => { router.push(pathname) })
  }

  return (
    <form onSubmit={apply} className="mb-6 flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(locale, 'Search teams by name…', 'Takımlari ada göre ara…')}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={t(locale, 'Clear search', 'Aramayi temizle')}
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition shrink-0"
      >
        {isPending ? t(locale, 'Searching…', 'Aranıyor…') : t(locale, 'Search', 'Ara')}
      </button>
    </form>
  )
}
