'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import ConfirmModal from '@/components/ConfirmModal'
import EditTeamModal from '@/components/EditTeamModal'
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
  message: string | null
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
  isCaptain: boolean
  currentUserId: string
  incomingChallenges: ChallengeEntry[]
  outgoingChallenges: ChallengeEntry[]
}

const supabase = createSupabaseBrowserClient()

const statusColor = (status: string) => {
  if (status === 'accepted') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

export default function MyTeamClient({
  team,
  members: initialMembers,
  isCaptain,
  currentUserId,
  incomingChallenges: initialIncoming,
  outgoingChallenges: initialOutgoing,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()

  const [members, setMembers] = useState(initialMembers)
  const [teamName, setTeamName] = useState(team.name)
  const [teamDescription, setTeamDescription] = useState(team.description)
  const [incoming, setIncoming] = useState(initialIncoming)
  const [outgoing, setOutgoing] = useState(initialOutgoing)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const [leaveModal, setLeaveModal] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  const [removeModal, setRemoveModal] = useState<string | null>(null) // user_id
  const [removeLoading, setRemoveLoading] = useState(false)

  const [acceptModal, setAcceptModal] = useState<string | null>(null) // challenge id
  const [acceptLoading, setAcceptLoading] = useState(false)

  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  async function handleEditSave(name: string, description: string) {
    setEditLoading(true)
    const { error } = await supabase.rpc('update_team', {
      p_name: name,
      p_description: description || null,
    })
    setEditLoading(false)
    if (error) {
      showToast(
        error.message.includes('teams_name_unique')
          ? 'That team name is already taken.'
          : error.message,
        'error'
      )
      return
    }
    setTeamName(name)
    setTeamDescription(description || null)
    setShowEditModal(false)
    showToast('Team updated!', 'success')
  }

  async function handleLeave() {
    setLeaveModal(false)
    setLeaveLoading(true)
    const { error } = await supabase.rpc('leave_team')
    setLeaveLoading(false)
    if (error) {
      showToast(error.message === 'captain_cannot_leave'
        ? 'Captains cannot leave their team.'
        : error.message, 'error')
      return
    }
    showToast('You have left the team.')
    router.push('/teams')
    router.refresh()
  }

  async function handleRemoveMember(userId: string) {
    setRemoveModal(null)
    setRemoveLoading(true)
    const { error } = await supabase.rpc('remove_team_member', { p_user_id: userId })
    setRemoveLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    showToast('Member removed.')
  }

  async function handleAccept(challengeId: string) {
    setAcceptModal(null)
    setAcceptLoading(true)
    const { error } = await supabase.rpc('accept_challenge', { p_challenge_id: challengeId })
    setAcceptLoading(false)
    if (error) {
      showToast(
        error.message === 'slot_no_longer_available'
          ? 'That slot is no longer available.'
          : error.message,
        'error'
      )
      return
    }
    setIncoming((prev) => prev.filter((c) => c.id !== challengeId))
    showToast('Challenge accepted! Reservation pending approval.', 'success')
    router.refresh()
  }

  async function handleReject(challengeId: string) {
    setRejectModal(null)
    setRejectLoading(true)
    const { error } = await supabase.rpc('reject_challenge', { p_challenge_id: challengeId })
    setRejectLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setIncoming((prev) => prev.filter((c) => c.id !== challengeId))
    showToast('Challenge rejected.')
  }

  async function handleCancel(challengeId: string) {
    setCancelModal(null)
    setCancelLoading(true)
    const { error } = await supabase.rpc('cancel_challenge', { p_challenge_id: challengeId })
    setCancelLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setOutgoing((prev) =>
      prev.map((c) => c.id === challengeId ? { ...c, status: 'cancelled' } : c)
    )
    showToast('Challenge cancelled.')
  }

  return (
    <>
      {showEditModal && (
        <EditTeamModal
          team={{ name: teamName, description: teamDescription }}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
          loading={editLoading}
        />
      )}

      {leaveModal && (
        <ConfirmModal
          title="Leave team?"
          message="Are you sure you want to leave this team? You can join or create another team afterwards."
          confirmLabel="Leave team"
          variant="danger"
          loading={leaveLoading}
          onConfirm={handleLeave}
          onClose={() => setLeaveModal(false)}
        />
      )}

      {removeModal && (
        <ConfirmModal
          title="Remove member?"
          message="Are you sure you want to remove this member from your team?"
          confirmLabel="Remove"
          variant="danger"
          loading={removeLoading}
          onConfirm={() => handleRemoveMember(removeModal)}
          onClose={() => setRemoveModal(null)}
        />
      )}

      {acceptModal && (
        <ConfirmModal
          title="Accept challenge?"
          message="Accepting will automatically book the time slot. The reservation will be pending admin approval."
          confirmLabel="Accept"
          variant="default"
          loading={acceptLoading}
          onConfirm={() => handleAccept(acceptModal)}
          onClose={() => setAcceptModal(null)}
        />
      )}

      {rejectModal && (
        <ConfirmModal
          title="Reject challenge?"
          message="The challenging team will be notified that you declined."
          confirmLabel="Reject"
          variant="danger"
          loading={rejectLoading}
          onConfirm={() => handleReject(rejectModal)}
          onClose={() => setRejectModal(null)}
        />
      )}

      {cancelModal && (
        <ConfirmModal
          title="Cancel challenge?"
          message="Are you sure you want to cancel this challenge?"
          confirmLabel="Cancel challenge"
          variant="danger"
          loading={cancelLoading}
          onConfirm={() => handleCancel(cancelModal)}
          onClose={() => setCancelModal(null)}
        />
      )}

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Team header */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{teamName}</h1>
                  {isCaptain && (
                    <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                      Captain
                    </span>
                  )}
                </div>
                {teamDescription && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{teamDescription}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {isCaptain && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Edit
                  </button>
                )}
                {!isCaptain && (
                  <button
                    onClick={() => setLeaveModal(true)}
                    disabled={leaveLoading}
                    className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Leave team
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Members ({members.length})
            </h2>
            <div className="divide-y dark:divide-gray-800">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.email}
                    </p>
                    {member.user_id === team.captain_id && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Captain</p>
                    )}
                  </div>
                  {isCaptain && member.user_id !== currentUserId && (
                    <button
                      onClick={() => setRemoveModal(member.user_id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Incoming challenges (captain only) */}
          {isCaptain && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Incoming Challenges ({incoming.length})
              </h2>
              {incoming.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending challenges.</p>
              ) : (
                <div className="space-y-4">
                  {incoming.map((c) => (
                    <div key={c.id} className="rounded-xl border dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {c.challenger_team_name} is challenging you
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Pitch:</span> {c.astroturf_name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">When:</span>{' '}
                            {formatDateLabel(c.slot_date)},{' '}
                            {formatTime(c.start_time)} – {formatTime(c.end_time)}
                          </p>
                          {c.message && (
                            <p className="text-gray-500 dark:text-gray-400 italic">
                              &ldquo;{c.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setAcceptModal(c.id)}
                            disabled={acceptLoading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setRejectModal(c.id)}
                            disabled={rejectLoading}
                            className="rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outgoing challenges */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sent Challenges ({outgoing.length})
            </h2>
            {outgoing.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No challenges sent yet.{' '}
                {isCaptain && (
                  <a href="/teams" className="text-gray-900 dark:text-white underline">
                    Browse teams
                  </a>
                )}{' '}
                {isCaptain && 'to issue one.'}
              </p>
            ) : (
              <div className="space-y-4">
                {outgoing.map((c) => (
                  <div key={c.id} className="rounded-xl border dark:border-gray-700 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          vs {c.challenged_team_name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Pitch:</span> {c.astroturf_name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">When:</span>{' '}
                          {formatDateLabel(c.slot_date)},{' '}
                          {formatTime(c.start_time)} – {formatTime(c.end_time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>
                          {c.status}
                        </span>
                        {c.status === 'pending' && isCaptain && (
                          <button
                            onClick={() => setCancelModal(c.id)}
                            disabled={cancelLoading}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  )
}
