import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import TeamCard from '@/components/TeamCard'

type TeamRow = {
  id: string
  name: string
  description: string | null
  captain_id: string
  member_count: number
}

export default async function TeamsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all teams
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name, description, captain_id')
    .order('created_at', { ascending: false })

  const teams = (teamsData ?? []) as Omit<TeamRow, 'member_count'>[]

  // Fetch member counts
  const { data: memberCounts } = await supabase
    .from('team_members')
    .select('team_id')

  const countMap = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    countMap.set(row.team_id, (countMap.get(row.team_id) ?? 0) + 1)
  }

  const teamsWithCount: TeamRow[] = teams.map((t) => ({
    ...t,
    member_count: countMap.get(t.id) ?? 0,
  }))

  // Find current user's team
  let currentUserTeamId: string | null = null
  if (user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()
    currentUserTeamId = membership?.team_id ?? null
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Teams</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse all teams or create your own.
            </p>
          </div>

          {user && !currentUserTeamId && (
            <Link
              href="/teams/create"
              className="rounded-xl bg-black dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-black transition hover:opacity-90 w-fit"
            >
              Create a team
            </Link>
          )}
          {user && currentUserTeamId && (
            <Link
              href="/my-team"
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800 w-fit"
            >
              Go to My Team
            </Link>
          )}
          {!user && (
            <Link
              href="/login"
              className="rounded-xl bg-black dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-black transition hover:opacity-90 w-fit"
            >
              Log in to create a team
            </Link>
          )}
        </div>

        {teamsWithCount.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">No teams yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Be the first to create a team!
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {teamsWithCount.length} {teamsWithCount.length === 1 ? 'team' : 'teams'}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamsWithCount.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isCurrentUserTeam={team.id === currentUserTeamId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
