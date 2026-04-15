'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import ConfirmModal from '@/components/ConfirmModal'
import { formatDateLabel, formatTime } from '@/lib/date-helpers'
import { useLocale } from '@/components/LocaleProvider'
import { t, translateStatus } from '@/lib/locale'

type Member = {
  user_id: string
  display_name: string
  joined_at: string
}

type ChallengeEntry = {
  id: string
  status: string
  astroturf_name: string
  slot_date: string
  start_time: string
  end_time: string
  challenger_team_id: string
  challenger_team_name: string
  challenged_team_name: string
  challenger_score: number | null
  challenged_score: number | null
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
  currentUserJoinRequestStatus: string | null
}

const supabase = createSupabaseBrowserClient()

const statusColor = (status: string) => {
  if (status === 'accepted') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  if (status === 'played') return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

export default function TeamProfileClient({
  team,
  members,
  challenges,
  currentUserId,
  currentUserTeamId,
  currentUserCaptainTeamId,
  currentUserJoinRequestStatus: initialRequestStatus,
}: Props) {
  const { showToast } = useToast()
  const { locale } = useLocale()
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestModal, setRequestModal] = useState(false)

  const isOwnTeam = currentUserTeamId === team.id
  const canRequest = currentUserId && !currentUserTeamId && !isOwnTeam
  const canChallenge = currentUserCaptainTeamId && currentUserCaptainTeamId !== team.id

  // Team record stats
  const playedWithResult = challenges
    .filter((c) => c.status === 'played' && c.challenger_score != null && c.challenged_score != null)
    .map((c) => {
      const isChallenger = c.challenger_team_id === team.id
      const myScore = isChallenger ? c.challenger_score! : c.challenged_score!
      const oppScore = isChallenger ? c.challenged_score! : c.challenger_score!
      const result: 'W' | 'D' | 'L' = myScore > oppScore ? 'W' : myScore === oppScore ? 'D' : 'L'
      return result
    })

  const stats = playedWithResult.reduce(
    (acc, r) => ({ wins: acc.wins + (r === 'W' ? 1 : 0), draws: acc.draws + (r === 'D' ? 1 : 0), losses: acc.losses + (r === 'L' ? 1 : 0) }),
    { wins: 0, draws: 0, losses: 0 }
  )
  const last5 = playedWithResult.slice(0, 5)

  async function handleRequest() {
    setRequestModal(false)
    setRequestLoading(true)
    const { error } = await supabase.rpc('request_to_join_team', { p_team_id: team.id })
    setRequestLoading(false)
    if (error) {
      showToast(
        error.message === 'already_in_a_team' ? t(locale, 'You are already in a team.', 'Zaten bir takımın üyesisin.') :
        error.message === 'request_already_pending' ? t(locale, 'You already have a pending request.', 'Zaten bekleyen bir talebin var.') :
        error.message,
        'error'
      )
      return
    }
    setRequestStatus('pending')
    showToast(t(locale, 'Join request sent! Waiting for captain approval.', 'Katılım talebi gönderildi! Kaptan onayı bekleniyor.'), 'success')
  }

  return (
    <>
      {requestModal && (
        <ConfirmModal
          title={locale === 'tr' ? `${team.name} takımına katılmak istiyor musun?` : `Request to join ${team.name}?`}
          message={t(locale, 'Your request will be sent to the team captain for approval.', 'Talebin onay için takım kaptanına gönderilecek.')}
          confirmLabel={t(locale, 'Send request', 'Talep gönder')}
          variant="default"
          loading={requestLoading}
          onConfirm={handleRequest}
          onClose={() => setRequestModal(false)}
        />
      )}

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Header */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                  {last5.length > 0 && (
                    <div className="flex gap-1">
                      {last5.map((result, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            result === 'W' ? 'bg-green-600' : result === 'D' ? 'bg-blue-500' : 'bg-red-600'
                          }`}
                        >
                          {locale === 'tr' ? { W: 'G', D: 'B', L: 'Y' }[result] : result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {playedWithResult.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="text-green-600 dark:text-green-400 font-semibold">{stats.wins} {t(locale, 'W', 'G')}</span>
                    <span className="text-gray-400 dark:text-gray-600 mx-1">/</span>
                    <span className="text-blue-500 dark:text-blue-400 font-semibold">{stats.draws} {t(locale, 'D', 'B')}</span>
                    <span className="text-gray-400 dark:text-gray-600 mx-1">/</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">{stats.losses} {t(locale, 'L', 'Y')}</span>
                  </p>
                )}
                {team.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{team.description}</p>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'tr' ? `${members.length} üye` : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
                </p>
              </div>

              <div className="flex gap-2 shrink-0 flex-wrap">
                {isOwnTeam && (
                  <Link
                    href="/my-team"
                    className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition"
                  >
                    {t(locale, 'My Team', 'Takımım')}
                  </Link>
                )}

                {canRequest && (
                  requestStatus === 'pending' ? (
                    <span className="rounded-xl border border-yellow-300 dark:border-yellow-700 px-4 py-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      {t(locale, 'Request pending', 'Talep beklemede')}
                    </span>
                  ) : requestStatus === 'rejected' ? (
                    <span className="rounded-xl border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      {t(locale, 'Request rejected', 'Talep reddedildi')}
                    </span>
                  ) : (
                    <button
                      onClick={() => setRequestModal(true)}
                      disabled={requestLoading}
                      className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 transition"
                    >
                      {t(locale, 'Request to join', 'Katılım talebi gönder')}
                    </button>
                  )
                )}

                {canChallenge && (
                  <Link
                    href={`/teams/${team.id}/challenge`}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                  >
                    {t(locale, 'Challenge', 'Meydan oku')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t(locale, 'Members', 'Üyeler')}</h2>
            <div className="divide-y dark:divide-gray-800">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between py-3">
                  <p className="text-sm text-gray-900 dark:text-white">{member.display_name}</p>
                  {member.user_id === team.captain_id && (
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {t(locale, 'Captain', 'Kaptan')}
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
                {t(locale, 'Challenge History', 'Meydan Okuma Geçmişi')}
              </h2>
              <div className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-xl border dark:border-gray-700 p-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {c.challenger_team_name} vs {c.challenged_team_name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {c.astroturf_name} — {formatDateLabel(c.slot_date, locale)},{' '}
                        {formatTime(c.start_time)} – {formatTime(c.end_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-fit">
                      {c.status === 'played' && c.challenger_score != null && c.challenged_score != null && (
                        <span className="rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 text-sm font-bold tabular-nums">
                          {c.challenger_score} – {c.challenged_score}
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>
                        {translateStatus(locale, c.status)}
                      </span>
                    </div>
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
