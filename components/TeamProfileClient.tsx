'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import ConfirmModal from '@/components/ConfirmModal'
import { formatDateLabel, formatTime } from '@/lib/date-helpers'

type Member = {
  user_id: string
  email: string
  joined_at: string
}

type ChallengeEntry = {
  id: string
  status: string
  astroturf_name: string
  slot_date: string
  start_time: string
  end_time: string
  challenger_team_name: string
  challenged_team_name: string
  created_at: string
}

type Props = {
  team: {
    id: string
    name: string
    description: string | null
    captain_id: string
  }
  members: Member[]
  challenges: ChallengeEntry[]
  currentUserId: string | null
  currentUserTeamId: string | null
  currentUserCaptainTeamId: string | null
}

const supabase = createSupabaseBrowserClient()

const statusColor = (status: string) => {
  if (status === 'accepted') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

export default function TeamProfileClient({
  team,
  members,
  challenges,
  currentUserId,
  currentUserTeamId,
  currentUserCaptainTeamId,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinModal, setJoinModal] = useState(false)

  const isOwnTeam = currentUserTeamId === team.id
  const canJoin = currentUserId && !currentUserTeamId
  // Captain of a different team can challenge
  const canChallenge =
    currentUserCaptainTeamId &&
    currentUserCaptainTeamId !== team.id

  async function handleJoin() {
    setJoinModal(false)
    setJoinLoading(true)
    const { error } = await supabase.rpc('join_team', { p_team_id: team.id })
    setJoinLoading(false)
    if (error) {
      showToast(
        error.message === 'already_in_a_team'
          ? 'You are already in a team.'
          : error.message,
        'error'
      )
      return
    }
    showToast('You joined the team!', 'success')
    router.push('/my-team')
    router.refresh()
  }

  return (
    <>
      {joinModal && (
        <ConfirmModal
          title={`Join ${team.name}?`}
          message="You will become a member of this team. You can only be in one team at a time."
          confirmLabel="Join team"
          variant="default"
          loading={joinLoading}
          onConfirm={handleJoin}
          onClose={() => setJoinModal(false)}
        />
      )}

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Header */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                {team.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{team.description}</p>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                {isOwnTeam && (
                  <Link
                    href="/my-team"
                    className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
                  >
                    My Team
                  </Link>
                )}
                {canJoin && (
                  <button
                    onClick={() => setJoinModal(true)}
                    disabled={joinLoading}
                    className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {joinLoading ? 'Joining…' : 'Join team'}
                  </button>
                )}
                {canChallenge && (
                  <Link
                    href={`/teams/${team.id}/challenge`}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                  >
                    Challenge
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Members</h2>
            <div className="divide-y dark:divide-gray-800">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between py-3">
                  <p className="text-sm text-gray-900 dark:text-white">{member.email}</p>
                  {member.user_id === team.captain_id && (
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      Captain
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Challenge history */}
          {challenges.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Challenge History
              </h2>
              <div className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-xl border dark:border-gray-700 p-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {c.challenger_team_name} vs {c.challenged_team_name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {c.astroturf_name} — {formatDateLabel(c.slot_date)},{' '}
                        {formatTime(c.start_time)} – {formatTime(c.end_time)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
