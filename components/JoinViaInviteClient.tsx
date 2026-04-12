'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'

type Props = {
  token: string
  teamId: string
  teamName: string
  isLoggedIn: boolean
}

const supabase = createSupabaseBrowserClient()

export default function JoinViaInviteClient({ token, teamId, teamName, isLoggedIn }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Log in or create an account to join this team.
        </p>
        <Link
          href={`/login?redirect=/teams/join/${token}`}
          className="block w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
        >
          Log in to join
        </Link>
        <Link
          href={`/signup?redirect=/teams/join/${token}`}
          className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Sign up
        </Link>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="space-y-4">
        <p className="text-green-600 dark:text-green-400 font-semibold">
          You joined {teamName}!
        </p>
        <Link
          href="/my-team"
          className="block w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
        >
          Go to My Team
        </Link>
      </div>
    )
  }

  async function handleJoin() {
    setLoading(true)
    const { error } = await supabase.rpc('join_via_invite', { p_token: token })
    setLoading(false)
    if (error) {
      showToast(
        error.message === 'already_in_a_team' ? 'You are already in a team.' :
        error.message === 'invalid_token' ? 'This invite link is no longer valid.' :
        error.message,
        'error'
      )
      return
    }
    setJoined(true)
    showToast(`Welcome to ${teamName}!`, 'success')
    router.refresh()
  }

  return (
    <div className="space-y-3 mt-6">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
      >
        {loading ? 'Joining…' : `Join ${teamName}`}
      </button>
      <Link
        href="/teams"
        className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        Browse other teams instead
      </Link>
    </div>
  )
}
