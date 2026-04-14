'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputClass =
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500'

export default function CreateTournamentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      max_teams: (form.elements.namedItem('max_teams') as HTMLSelectElement).value,
      registration_deadline: (form.elements.namedItem('registration_deadline') as HTMLInputElement).value,
      start_date: (form.elements.namedItem('start_date') as HTMLInputElement).value,
    }

    const res = await fetch('/api/tournaments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }

    router.push(`/tournaments/${json.id}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 space-y-5"
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Tournament name *
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="e.g. Cyprus 5-a-side Cup"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Rules, prizes, any extra info..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Max teams *
        </label>
        <select name="max_teams" defaultValue="8" className={inputClass}>
          <option value="4">4 teams</option>
          <option value="6">6 teams</option>
          <option value="8">8 teams</option>
          <option value="10">10 teams</option>
          <option value="12">12 teams</option>
          <option value="16">16 teams</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Registration deadline
          </label>
          <input type="date" name="registration_deadline" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Start date
          </label>
          <input type="date" name="start_date" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-800 py-3 text-sm font-semibold text-white transition hover:bg-green-900 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create tournament'}
      </button>
    </form>
  )
}
