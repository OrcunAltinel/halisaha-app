'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'

export default function CreateTeamForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.rpc('create_team', {
      p_name: name.trim(),
      p_description: description.trim() || null,
    })

    if (error) {
      const msg =
        error.message === 'already_in_a_team'
          ? 'You are already a member of a team.'
          : error.message === 'already_captain'
          ? 'You already captain a team.'
          : error.message.includes('teams_name_unique')
          ? 'That team name is already taken.'
          : error.message
      showToast(msg, 'error')
      setLoading(false)
      return
    }

    showToast('Team created!', 'success')
    router.push('/my-team')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Team name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          placeholder="e.g. Street Kings FC"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Tell other teams a bit about yourselves…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-xl bg-gray-900 dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-gray-900 transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create team'}
      </button>
    </form>
  )
}
