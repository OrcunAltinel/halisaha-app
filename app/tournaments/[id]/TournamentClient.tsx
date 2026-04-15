'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TournamentStandings from '@/components/TournamentStandings'
import TournamentFixtures, { type FixtureMatch } from '@/components/TournamentFixtures'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Standing = {
  team_id: string
  team_name: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  points: number
}

type Registration = {
  team_id: string
  team_name: string
  registered_at: string
}

type Tournament = {
  id: string
  name: string
  description: string | null
  format: string
  status: string
  max_teams: number
  registration_deadline: string | null
  start_date: string | null
}

type Props = {
  tournament: Tournament
  registrations: Registration[]
  standings: Standing[]
  matches: FixtureMatch[]
  currentUserTeamId: string | null
  isCaptain: boolean
  isSuperAdmin: boolean
}

type Tab = 'teams' | 'standings' | 'fixtures'

export default function TournamentClient({
  tournament,
  registrations,
  standings,
  matches,
  currentUserTeamId,
  isCaptain,
  isSuperAdmin,
}: Props) {
  const router = useRouter()
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState<Tab>('teams')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Result entry modal state
  const [resultModal, setResultModal] = useState<string | null>(null) // matchId
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)

  const isRegistered = currentUserTeamId
    ? registrations.some((r) => r.team_id === currentUserTeamId)
    : false

  const isFull = registrations.length >= tournament.max_teams

  async function handleRegister() {
    if (!currentUserTeamId) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/tournaments/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: tournament.id, team_id: currentUserTeamId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to register')
      return
    }
    router.refresh()
  }

  async function handleWithdraw() {
    if (!currentUserTeamId) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/tournaments/register', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: tournament.id, team_id: currentUserTeamId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to withdraw')
      return
    }
    router.refresh()
  }

  async function handleStart() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/tournaments/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: tournament.id }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to start tournament')
      return
    }
    router.refresh()
  }

  async function handleEnterResult() {
    if (!resultModal) return
    const hs = parseInt(homeScore, 10)
    const as_ = parseInt(awayScore, 10)
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setResultError('Enter valid scores (0 or above)')
      return
    }
    setResultLoading(true)
    setResultError(null)
    const res = await fetch('/api/tournaments/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: resultModal, home_score: hs, away_score: as_ }),
    })
    const json = await res.json()
    setResultLoading(false)
    if (!res.ok) {
      setResultError(json.error ?? 'Failed to save result')
      return
    }
    setResultModal(null)
    setHomeScore('')
    setAwayScore('')
    router.refresh()
  }

  function openResultModal(matchId: string) {
    setResultModal(matchId)
    setHomeScore('')
    setAwayScore('')
    setResultError(null)
  }

  const resultMatch = resultModal ? matches.find((m) => m.id === resultModal) : null

  const tabClass = (tab: Tab) =>
    `px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
      activeTab === tab
        ? 'border-green-600 text-gray-900 dark:text-white'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`

  return (
    <>
      {/* Result entry modal */}
      {resultModal && resultMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t(locale, 'Enter Result', 'Sonuç Gir')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {resultMatch.home_team_name} vs {resultMatch.away_team_name}
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  {resultMatch.home_team_name}
                </label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <span className="text-xl font-bold text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  {resultMatch.away_team_name}
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
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
                {t(locale, 'Cancel', 'İptal')}
              </button>
              <button
                onClick={handleEnterResult}
                disabled={resultLoading}
                className="flex-1 rounded-xl bg-green-800 py-2.5 text-sm font-semibold text-white hover:bg-green-900 transition disabled:opacity-50"
              >
                {resultLoading ? t(locale, 'Saving...', 'Kaydediliyor...') : t(locale, 'Save Result', 'Sonucu Kaydet')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Team captain: register / withdraw */}
          {isCaptain && tournament.status === 'registration' && (
            isRegistered ? (
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="rounded-xl border border-red-300 dark:border-red-800 px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
              >
                {loading ? t(locale, 'Withdrawing...', 'Çekiliyor...') : t(locale, 'Withdraw team', 'Takımı çek')}
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading || isFull}
                className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 transition disabled:opacity-50"
              >
                {loading ? t(locale, 'Registering...', 'Kayıt ediliyor...') : isFull ? t(locale, 'Tournament full', 'Turnuva dolu') : t(locale, 'Register your team', 'Takımını kayıt et')}
              </button>
            )
          )}

          {/* Super admin: start tournament */}
          {isSuperAdmin && tournament.status === 'registration' && (
            <button
              onClick={handleStart}
              disabled={loading || registrations.length < 2}
              className="rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50"
              title={registrations.length < 2 ? t(locale, 'Need at least 2 teams', 'En az 2 takım gerekli') : undefined}
            >
              {loading ? t(locale, 'Starting...', 'Başlatılıyor...') : t(locale, `Start tournament (${registrations.length} teams)`, `Turnuvayı başlat (${registrations.length} takım)`)}
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            {error}
          </p>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex gap-0">
          <button onClick={() => setActiveTab('teams')} className={tabClass('teams')}>
            {t(locale, 'Teams', 'Takımlar')} ({registrations.length})
          </button>
          {(tournament.status === 'active' || tournament.status === 'completed') && (
            <button onClick={() => setActiveTab('standings')} className={tabClass('standings')}>
              {t(locale, 'Standings', 'Puan Durumu')}
            </button>
          )}
          {(tournament.status === 'active' || tournament.status === 'completed') && (
            <button onClick={() => setActiveTab('fixtures')} className={tabClass('fixtures')}>
              {t(locale, 'Fixtures', 'Fikstür')}
            </button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'teams' && (
          <div>
            {registrations.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 text-center ring-1 ring-gray-100 dark:ring-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{t(locale, 'No teams registered yet', 'Henüz kayıtlı takım yok')}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t(locale, 'Be the first to sign up your team.', 'Takımınla ilk kayıt olan ol.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.map((reg) => {
                  const isMyTeam = reg.team_id === currentUserTeamId
                  return (
                    <div
                      key={reg.team_id}
                      className={`flex items-center justify-between rounded-xl px-5 py-3.5 ring-1 ${
                        isMyTeam
                          ? 'bg-green-50 dark:bg-green-900/20 ring-green-200 dark:ring-green-800'
                          : 'bg-white dark:bg-gray-900 ring-gray-100 dark:ring-gray-800'
                      }`}
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {reg.team_name}
                      </span>
                      {isMyTeam && (
                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                          {t(locale, 'Your team', 'Senin takımın')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <TournamentStandings standings={standings} currentUserTeamId={currentUserTeamId} locale={locale} />
        )}

        {activeTab === 'fixtures' && (
          <TournamentFixtures
            matches={matches}
            isSuperAdmin={isSuperAdmin}
            onEnterResult={openResultModal}
            locale={locale}
          />
        )}
      </div>
    </>
  )
}
