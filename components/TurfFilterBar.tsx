'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

type Location = {
  id: string
  name: string
}

type Props = {
  locations: Location[]
  initialQuery: string
  initialLocation: string
  initialMinPrice: string
  initialMaxPrice: string
}

export default function TurfFilterBar({
  locations,
  initialQuery,
  initialLocation,
  initialMinPrice,
  initialMaxPrice,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [minPrice, setMinPrice] = useState(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setLocation(searchParams.get('location') || '')
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
  }, [searchParams])

  function buildUrl(overrides: Partial<Record<string, string>>) {
    const params = new URLSearchParams()
    const next = { q: query, location, minPrice, maxPrice, ...overrides }
    for (const [key, value] of Object.entries(next)) {
      if (value && value.trim() !== '') params.set(key, value.trim())
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault()
    const min = minPrice ? Number(minPrice) : null
    const max = maxPrice ? Number(maxPrice) : null
    if (min !== null && max !== null && min > max) {
      const tmp = minPrice
      setMinPrice(maxPrice)
      setMaxPrice(tmp)
      startTransition(() => { router.push(buildUrl({ minPrice: maxPrice, maxPrice: tmp })) })
      return
    }
    startTransition(() => { router.push(buildUrl({})) })
  }

  function handleLocationChange(value: string) {
    setLocation(value)
    startTransition(() => { router.push(buildUrl({ location: value })) })
  }

  function clearFilters() {
    setQuery('')
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    startTransition(() => { router.push(pathname) })
  }

  const hasActiveFilters = Boolean(query || location || minPrice || maxPrice)
  const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400'

  return (
    <form
      onSubmit={applyFilters}
      className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Search
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, address, keyword…"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className={inputClass}
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Min ₺
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Max ₺
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Any"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isPending ? 'Updating…' : hasActiveFilters ? 'Filters active' : 'No filters'}
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            Apply filters
          </button>
        </div>
      </div>
    </form>
  )
}
