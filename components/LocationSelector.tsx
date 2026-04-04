'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LOCATIONS = ['İskele', 'Mağusa', 'Lefkoşa', 'Girne', 'Lefke', 'Güzelyurt']

export default function LocationSelector() {
  const [location, setLocation] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!location) return
    router.push(`/hali-sahalar?location=${encodeURIComponent(location)}`)
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none text-black"
        >
          <option value="">Choose location</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90"
        >
          Search
        </button>
      </div>
    </div>
  )
}