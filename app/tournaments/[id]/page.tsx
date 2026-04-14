import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import TournamentClient from './TournamentClient'
import type { FixtureMatch } from '@/components/TournamentFixtures'

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

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, description, format, status, max_teams, registration_deadline, start_date, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!tournament) notFound()

  // Fetch registrations with team names
  const { data: regsData } = await supabase
    .from('tournament_registrations')
    .select('team_id, registered_at, teams(name)')
    .eq('tournament_id', id)
    .order('registered_at', { ascending: true })

  const registrations: Registration[] = (regsData ?? []).map((r: any) => ({
    team_id: r.team_id,
    team_name: r.teams?.name ?? 'Unknown',
    registered_at: r.registered_at,
  }))

  // Fetch standings
  const { data: standingsData } = await supabase
    .from('tournament_standings')
    .select('team_id, played, wins, draws, losses, goals_for, goals_against, points, teams(name)')
    .eq('tournament_id', id)
    .order('points', { ascending: false })

  const standings: Standing[] = (standingsData ?? []).map((s: any) => ({
    team_id: s.team_id,
    team_name: s.teams?.name ?? 'Unknown',
    played: s.played,
    wins: s.wins,
    draws: s.draws,
    losses: s.losses,
    goals_for: s.goals_for,
    goals_against: s.goals_against,
    points: s.points,
  }))

  // Fetch matches
  const { data: matchesData } = await supabase
    .from('tournament_matches')
    .select('id, round, home_team_id, away_team_id, home_score, away_score, status, scheduled_date')
    .eq('tournament_id', id)
    .order('round', { ascending: true })

  // Build a team name map from registrations + standings
  const teamNameMap = new Map<string, string>()
  for (const r of registrations) teamNameMap.set(r.team_id, r.team_name)
  for (const s of standings) teamNameMap.set(s.team_id, s.team_name)

  const matches: FixtureMatch[] = (matchesData ?? []).map((m: any) => ({
    id: m.id,
    round: m.round,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    home_team_name: teamNameMap.get(m.home_team_id) ?? 'Unknown',
    away_team_name: teamNameMap.get(m.away_team_id) ?? 'Unknown',
    home_score: m.home_score,
    away_score: m.away_score,
    status: m.status,
    scheduled_date: m.scheduled_date,
  }))

  // Current user info
  let currentUserTeamId: string | null = null
  let isCaptain = false
  let isSuperAdmin = false

  if (user) {
    const [{ data: membership }, { data: captainTeam }, { data: superRow }] = await Promise.all([
      supabase.from('team_members').select('team_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('teams').select('id').eq('captain_id', user.id).maybeSingle(),
      supabase.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])
    currentUserTeamId = membership?.team_id ?? null
    isCaptain = !!captainTeam
    isSuperAdmin = !!superRow
  }

  function statusLabel(status: string) {
    if (status === 'registration') return 'Registration Open'
    if (status === 'active') return 'In Progress'
    return 'Completed'
  }

  function statusClass(status: string) {
    if (status === 'registration') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    if (status === 'active') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/tournaments"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          ← All tournaments
        </Link>

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {tournament.name}
              </h1>
              {tournament.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">{tournament.description}</p>
              )}
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusClass(tournament.status)}`}>
              {statusLabel(tournament.status)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Format:{' '}
              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                {tournament.format.replace('_', ' ')}
              </span>
            </span>
            <span>
              Teams:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {registrations.length} / {tournament.max_teams}
              </span>
            </span>
            {tournament.registration_deadline && (
              <span>
                Registration closes:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(tournament.registration_deadline).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
            )}
            {tournament.start_date && (
              <span>
                Starts:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(tournament.start_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
            )}
          </div>
        </div>

        <TournamentClient
          tournament={tournament}
          registrations={registrations}
          standings={standings}
          matches={matches}
          currentUserId={user?.id ?? null}
          currentUserTeamId={currentUserTeamId}
          isCaptain={isCaptain}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </main>
  )
}
