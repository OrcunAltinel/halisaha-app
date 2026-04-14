'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import ConfirmModal from '@/components/ConfirmModal'
import EditTeamModal from '@/components/EditTeamModal'
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
  challenger_team_name: string
  challenged_team_name: string
  challenger_score: number | null
  challenged_score: number | null
  message: string | null
  created_at: string
}

type JoinRequest = {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

type InviteLink = {
  id: string
  token: string
}

type Props = {
  team: { id: string; name: string; description: string | null; captain_id: string }
  members: Member[]
  isCaptain: boolean
  currentUserId: string
  incomingChallenges: ChallengeEntry[]
  outgoingChallenges: ChallengeEntry[]
  joinRequests: JoinRequest[]
  inviteLinks: InviteLink[]
}

const supabase = createSupabaseBrowserClient()

const statusColor = (status: string) => {
  if (status === 'accepted') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  if (status === 'played') return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

export default function MyTeamClient({
  team,
  members: initialMembers,
  isCaptain,
  currentUserId,
  incomingChallenges: initialIncoming,
  outgoingChallenges: initialOutgoing,
  joinRequests: initialJoinRequests,
  inviteLinks: initialInviteLinks,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()

  const [members, setMembers] = useState(initialMembers)
  const [teamName, setTeamName] = useState(team.name)
  const [teamDescription, setTeamDescription] = useState(team.description)
  const [incoming, setIncoming] = useState(initialIncoming)
  const [outgoing, setOutgoing] = useState(initialOutgoing)
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const [inviteLinks, setInviteLinks] = useState(initialInviteLinks)
  const [linkLoading, setLinkLoading] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [leaveModal, setLeaveModal] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [removeModal, setRemoveModal] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [acceptChallengeModal, setAcceptChallengeModal] = useState<string | null>(null)
  const [acceptChallengeLoading, setAcceptChallengeLoading] = useState(false)
  const [rejectChallengeModal, setRejectChallengeModal] = useState<string | null>(null)
  const [rejectChallengeLoading, setRejectChallengeLoading] = useState(false)
  const [cancelChallengeModal, setCancelChallengeModal] = useState<string | null>(null)
  const [cancelChallengeLoading, setCancelChallengeLoading] = useState(false)
  const [resultModal, setResultModal] = useState<string | null>(null) // challengeId
  const [challengerScore, setChallengerScore] = useState('')
  const [challengedScore, setChallengedScore] = useState('')
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)
  const [acceptRequestId, setAcceptRequestId] = useState<string | null>(null)
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null)
  const [requestActionLoading, setRequestActionLoading] = useState(false)

  // ── Edit team ──
  async function handleEditSave(name: string, description: string) {
    setEditLoading(true)
    const { error } = await supabase.rpc('update_team', { p_name: name, p_description: description || null })
    setEditLoading(false)
    if (error) {
      showToast(error.message.includes('teams_name_unique') ? t(locale, 'That team name is already taken.', 'Bu takım adı zaten alınmış.') : error.message, 'error')
      return
    }
    setTeamName(name)
    setTeamDescription(description || null)
    setShowEditModal(false)
    showToast(t(locale, 'Team updated!', 'Takım güncellendi!'), 'success')
  }

  // ── Leave team ──
  async function handleLeave() {
    setLeaveModal(false)
    setLeaveLoading(true)
    const { error } = await supabase.rpc('leave_team')
    setLeaveLoading(false)
    if (error) {
      showToast(error.message === 'captain_cannot_leave' ? t(locale, 'Captains cannot leave their team.', 'Kaptanlar takımdan ayrilamaz.') : error.message, 'error')
      return
    }
    showToast(t(locale, 'You have left the team.', 'Takımdan ayrıldin.'))
    router.push('/teams')
    router.refresh()
  }

  // ── Remove member ──
  async function handleRemoveMember(userId: string) {
    setRemoveModal(null)
    setRemoveLoading(true)
    const { error } = await supabase.rpc('remove_team_member', { p_user_id: userId })
    setRemoveLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    showToast(t(locale, 'Member removed.', 'Üye kaldırıldı.'))
  }

  // ── Join requests ──
  async function handleAcceptRequest(requestId: string) {
    setAcceptRequestId(null)
    setRequestActionLoading(true)
    const { error } = await supabase.rpc('accept_join_request', { p_request_id: requestId })
    setRequestActionLoading(false)
    if (error) {
      showToast(error.message === 'user_already_in_a_team' ? t(locale, 'That user already joined another team.', 'Bu kullanıcı zaten başka bir takıma katıldı.') : error.message, 'error')
      return
    }
    const accepted = joinRequests.find((r) => r.id === requestId)
    setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
    if (accepted) {
      setMembers((prev) => [...prev, { user_id: accepted.user_id, display_name: accepted.display_name, joined_at: new Date().toISOString() }])
    }
    showToast(t(locale, 'Request accepted — member added!', 'Talep kabul edildi — üye eklendi!'), 'success')
  }

  async function handleRejectRequest(requestId: string) {
    setRejectRequestId(null)
    setRequestActionLoading(true)
    const { error } = await supabase.rpc('reject_join_request', { p_request_id: requestId })
    setRequestActionLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
    showToast(t(locale, 'Request rejected.', 'Talep reddedildi.'))
  }

  // ── Invite links ──
  async function handleGenerateLink() {
    setLinkLoading(true)
    const { data, error } = await supabase
      .from('team_invite_links')
      .insert({ team_id: team.id, created_by: currentUserId })
      .select('id, token')
      .single()
    setLinkLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setInviteLinks((prev) => [data as InviteLink, ...prev])
    showToast(t(locale, 'Invite link created!', 'Davet bağlantısı oluşturuldu!'), 'success')
  }

  async function handleRevokeLink(linkId: string) {
    setRevokeId(null)
    setRevokeLoading(true)
    const { error } = await supabase.from('team_invite_links').delete().eq('id', linkId)
    setRevokeLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setInviteLinks((prev) => prev.filter((l) => l.id !== linkId))
    showToast(t(locale, 'Invite link revoked.', 'Davet bağlantısı iptal edildi.'))
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/teams/join/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // ── Challenges ──
  async function handleAcceptChallenge(challengeId: string) {
    setAcceptChallengeModal(null)
    setAcceptChallengeLoading(true)
    const { error } = await supabase.rpc('accept_challenge', { p_challenge_id: challengeId })
    setAcceptChallengeLoading(false)
    if (error) {
      showToast(error.message === 'slot_no_longer_available' ? t(locale, 'That slot is no longer available.', 'Bu saat artık müsait değil.') : error.message, 'error')
      return
    }
    setIncoming((prev) => prev.map((c) => c.id === challengeId ? { ...c, status: 'accepted' } : c))
    showToast(t(locale, 'Challenge accepted! Reservation pending approval.', 'Meydan okuma kabul edildi! Rezervasyon onay bekliyor.'), 'success')
    router.refresh()
  }

  async function handleRejectChallenge(challengeId: string) {
    setRejectChallengeModal(null)
    setRejectChallengeLoading(true)
    const { error } = await supabase.rpc('reject_challenge', { p_challenge_id: challengeId })
    setRejectChallengeLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setIncoming((prev) => prev.map((c) => c.id === challengeId ? { ...c, status: 'rejected' } : c))
    showToast(t(locale, 'Challenge rejected.', 'Meydan okuma reddedildi.'))
  }

  async function handleCancelChallenge(challengeId: string) {
    setCancelChallengeModal(null)
    setCancelChallengeLoading(true)
    const { error } = await supabase.rpc('cancel_challenge', { p_challenge_id: challengeId })
    setCancelChallengeLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setOutgoing((prev) => prev.map((c) => c.id === challengeId ? { ...c, status: 'cancelled' } : c))
    showToast(t(locale, 'Challenge cancelled.', 'Meydan okuma iptal edildi.'))
  }

  function openResultModal(challengeId: string) {
    setResultModal(challengeId)
    setChallengerScore('')
    setChallengedScore('')
    setResultError(null)
  }

  async function handleEnterResult() {
    if (!resultModal) return
    const cs = parseInt(challengerScore, 10)
    const ds = parseInt(challengedScore, 10)
    if (isNaN(cs) || isNaN(ds) || cs < 0 || ds < 0) {
      setResultError('Enter valid scores (0 or above)')
      return
    }
    setResultLoading(true)
    setResultError(null)
    const res = await fetch('/api/challenges/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: resultModal, challenger_score: cs, challenged_score: ds }),
    })
    const json = await res.json()
    setResultLoading(false)
    if (!res.ok) {
      setResultError(json.error ?? 'Failed to save result')
      return
    }
    const updateList = (list: ChallengeEntry[]) =>
      list.map((c) => c.id === resultModal ? { ...c, status: 'played', challenger_score: cs, challenged_score: ds } : c)
    setIncoming(updateList)
    setOutgoing(updateList)
    setResultModal(null)
    showToast('Result saved!', 'success')
  }

  return (
    <>
      {showEditModal && <EditTeamModal team={{ name: teamName, description: teamDescription }} onSave={handleEditSave} onClose={() => setShowEditModal(false)} loading={editLoading} />}
      {leaveModal && <ConfirmModal title={t(locale, 'Leave team?', 'Takımdan ayrıl?')} message={t(locale, 'Are you sure you want to leave this team?', 'Bu takımdan ayrilmak istedigine emin misin?')} confirmLabel={t(locale, 'Leave team', 'Takımdan ayrıl')} variant="danger" loading={leaveLoading} onConfirm={handleLeave} onClose={() => setLeaveModal(false)} />}
      {removeModal && <ConfirmModal title={t(locale, 'Remove member?', 'Üyeyi kaldır?')} message={t(locale, 'Are you sure you want to remove this member?', 'Bu üyeyi kaldırmak istediğine emin misin?')} confirmLabel={t(locale, 'Remove', 'Kaldir')} variant="danger" loading={removeLoading} onConfirm={() => handleRemoveMember(removeModal)} onClose={() => setRemoveModal(null)} />}
      {acceptChallengeModal && <ConfirmModal title={t(locale, 'Accept challenge?', 'Meydan okumayı kabul et?')} message={t(locale, 'Accepting will automatically book the time slot. The reservation will be pending admin approval.', 'Kabul edersen saat otomatik rezerve edilir. Rezervasyon yönetici onayı bekler.')} confirmLabel={t(locale, 'Accept', 'Kabul et')} variant="default" loading={acceptChallengeLoading} onConfirm={() => handleAcceptChallenge(acceptChallengeModal)} onClose={() => setAcceptChallengeModal(null)} />}
      {rejectChallengeModal && <ConfirmModal title={t(locale, 'Reject challenge?', 'Meydan okumayı reddet?')} message={t(locale, 'The challenging team will be notified that you declined.', 'Karşı takım talebi reddettiğin konusunda bilgilendirilecek.')} confirmLabel={t(locale, 'Reject', 'Reddet')} variant="danger" loading={rejectChallengeLoading} onConfirm={() => handleRejectChallenge(rejectChallengeModal)} onClose={() => setRejectChallengeModal(null)} />}
      {cancelChallengeModal && <ConfirmModal title={t(locale, 'Cancel challenge?', 'Meydan okumayı iptal et?')} message={t(locale, 'Are you sure you want to cancel this challenge?', 'Bu meydan okumayi iptal etmek istedigine emin misin?')} confirmLabel={t(locale, 'Cancel challenge', 'Meydan okumayı iptal et')} variant="danger" loading={cancelChallengeLoading} onConfirm={() => handleCancelChallenge(cancelChallengeModal)} onClose={() => setCancelChallengeModal(null)} />}
      {acceptRequestId && <ConfirmModal title={t(locale, 'Accept join request?', 'Katılım talebini kabul et?')} message={t(locale, 'This user will be added to your team.', 'Bu kullanıcı takımına eklenecek.')} confirmLabel={t(locale, 'Accept', 'Kabul et')} variant="default" loading={requestActionLoading} onConfirm={() => handleAcceptRequest(acceptRequestId)} onClose={() => setAcceptRequestId(null)} />}
      {rejectRequestId && <ConfirmModal title={t(locale, 'Reject join request?', 'Katılım talebini reddet?')} message={t(locale, 'This user\'s request will be declined.', 'Bu kullanıcınin talebi reddedilecek.')} confirmLabel={t(locale, 'Reject', 'Reddet')} variant="danger" loading={requestActionLoading} onConfirm={() => handleRejectRequest(rejectRequestId)} onClose={() => setRejectRequestId(null)} />}
      {revokeId && <ConfirmModal title={t(locale, 'Revoke invite link?', 'Davet bağlantısını iptal et?')} message={t(locale, 'Anyone with this link will no longer be able to join using it.', 'Bu bağlantıya sahip olanlar artık bununla katılamayacak.')} confirmLabel={t(locale, 'Revoke', 'İptal et')} variant="danger" loading={revokeLoading} onConfirm={() => handleRevokeLink(revokeId)} onClose={() => setRevokeId(null)} />}

      {/* Result entry modal */}
      {resultModal && (() => {
        const c = [...incoming, ...outgoing].find((x) => x.id === resultModal)
        if (!c) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Enter Match Result</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {c.challenger_team_name} vs {c.challenged_team_name}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                    {c.challenger_team_name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={challengerScore}
                    onChange={(e) => setChallengerScore(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <span className="text-xl font-bold text-gray-400 mt-5">–</span>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                    {c.challenged_team_name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={challengedScore}
                    onChange={(e) => setChallengedScore(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
              {resultError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{resultError}</p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setResultModal(null)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnterResult}
                  disabled={resultLoading}
                  className="flex-1 rounded-xl bg-green-800 py-2.5 text-sm font-semibold text-white hover:bg-green-900 transition disabled:opacity-50"
                >
                  {resultLoading ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Team header */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{teamName}</h1>
                  {isCaptain && <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400">{t(locale, 'Captain', 'Kaptan')}</span>}
                </div>
                {teamDescription && <p className="mt-2 text-gray-600 dark:text-gray-400">{teamDescription}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {isCaptain && <button onClick={() => setShowEditModal(true)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t(locale, 'Edit', 'Duzenle')}</button>}
                {!isCaptain && <button onClick={() => setLeaveModal(true)} disabled={leaveLoading} className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">{t(locale, 'Leave team', 'Takımdan ayrıl')}</button>}
              </div>
            </div>
          </div>

          {/* Join Requests (captain only) */}
          {isCaptain && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t(locale, 'Join Requests', 'Katılım Talepleri')} <span className="ml-1 text-base font-normal text-gray-500 dark:text-gray-400">({joinRequests.length})</span>
              </h2>
              {joinRequests.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'No pending join requests.', 'Bekleyen katılım talebi yok.')}</p>
              ) : (
                <div className="divide-y dark:divide-gray-800">
                  {joinRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between py-3 gap-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{req.display_name}</p>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setAcceptRequestId(req.id)} disabled={requestActionLoading} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">{t(locale, 'Accept', 'Kabul et')}</button>
                        <button onClick={() => setRejectRequestId(req.id)} disabled={requestActionLoading} className="rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition">{t(locale, 'Reject', 'Reddet')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invite Links (captain only) */}
          {isCaptain && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t(locale, 'Invite Links', 'Davet Bağlantılari')}</h2>
                <button onClick={handleGenerateLink} disabled={linkLoading} className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 transition">
                  {linkLoading ? t(locale, 'Generating…', 'Oluşturuluyor…') : t(locale, '+ New link', '+ Yeni bağlantı')}
                </button>
              </div>
              {inviteLinks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'No invite links yet. Generate one and share it with friends — anyone with the link joins instantly.', 'Henüz davet bağlantısı yok. Bir tane oluşturup arkadaşlarınla paylaş — bağlantıya sahip olanlar anında katılabilir.')}</p>
              ) : (
                <div className="space-y-2">
                  {inviteLinks.map((link) => {
                    return (
                      <div key={link.id} className="flex items-center gap-2 rounded-lg border dark:border-gray-700 px-3 py-2.5">
                        <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                          /teams/join/{link.token}
                        </code>
                        <button
                          onClick={() => copyLink(link.token)}
                          className="shrink-0 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          {copiedToken === link.token ? t(locale, 'Copied!', 'Kopyalandı!') : t(locale, 'Copy', 'Kopyala')}
                        </button>
                        <button
                          onClick={() => setRevokeId(link.id)}
                          className="shrink-0 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition"
                        >
                          {t(locale, 'Revoke', 'İptal et')}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Members */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t(locale, 'Members', 'Üyeler')} ({members.length})</h2>
            <div className="divide-y dark:divide-gray-800">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.display_name}</p>
                    {member.user_id === team.captain_id && <p className="text-xs text-yellow-600 dark:text-yellow-400">{t(locale, 'Captain', 'Kaptan')}</p>}
                  </div>
                  {isCaptain && member.user_id !== currentUserId && (
                    <button onClick={() => setRemoveModal(member.user_id)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition">{t(locale, 'Remove', 'Kaldir')}</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Received challenges */}
          {isCaptain && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t(locale, 'Received Challenges', 'Gelen Meydan Okumalar')} ({incoming.length})</h2>
              {incoming.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'No challenges received yet.', 'Henüz gelen meydan okuma yok.')}</p>
              ) : (
                <div className="space-y-4">
                  {incoming.map((c) => (
                    <div key={c.id} className="rounded-xl border dark:border-gray-700 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{locale === 'tr' ? `${c.challenger_team_name} sana meydan okudu` : `${c.challenger_team_name} challenged you`}</p>
                          <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">{t(locale, 'Pitch:', 'Saha:')}</span> {c.astroturf_name}</p>
                          <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">{t(locale, 'When:', 'Ne zaman:')}</span> {formatDateLabel(c.slot_date, locale)}, {formatTime(c.start_time)} – {formatTime(c.end_time)}</p>
                          {c.message && <p className="text-gray-500 dark:text-gray-400 italic">&ldquo;{c.message}&rdquo;</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'pending' ? (
                            <>
                              <button onClick={() => setAcceptChallengeModal(c.id)} disabled={acceptChallengeLoading} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">{t(locale, 'Accept', 'Kabul et')}</button>
                              <button onClick={() => setRejectChallengeModal(c.id)} disabled={rejectChallengeLoading} className="rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition">{t(locale, 'Reject', 'Reddet')}</button>
                            </>
                          ) : c.status === 'accepted' ? (
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>{c.status}</span>
                              <button onClick={() => openResultModal(c.id)} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Enter result</button>
                            </div>
                          ) : c.status === 'played' ? (
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 text-sm font-bold tabular-nums">
                                {c.challenger_score} – {c.challenged_score}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>played</span>
                            </div>
                          ) : (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>{translateStatus(locale, c.status)}</span>
                          )}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t(locale, 'Sent Challenges', 'Gönderilen Meydan Okumalar')} ({outgoing.length})</h2>
            {outgoing.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(locale, 'No challenges sent yet.', 'Henüz gönderilen meydan okuma yok.')}
                  {isCaptain && <> <Link href="/teams" className="underline text-gray-900 dark:text-white">{t(locale, 'Browse teams', 'Takımlara göz at')}</Link> {t(locale, 'to issue one.', 've bir tane gönder.')}</>}
                </p>
              ) : (
              <div className="space-y-4">
                {outgoing.map((c) => (
                  <div key={c.id} className="rounded-xl border dark:border-gray-700 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">vs {c.challenged_team_name}</p>
                        <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">{t(locale, 'Pitch:', 'Saha:')}</span> {c.astroturf_name}</p>
                        <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">{t(locale, 'When:', 'Ne zaman:')}</span> {formatDateLabel(c.slot_date, locale)}, {formatTime(c.start_time)} – {formatTime(c.end_time)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(c.status)}`}>{translateStatus(locale, c.status)}</span>
                        {c.status === 'pending' && isCaptain && (
                          <button onClick={() => setCancelChallengeModal(c.id)} disabled={cancelChallengeLoading} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition">{t(locale, 'Cancel', 'İptal et')}</button>
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
