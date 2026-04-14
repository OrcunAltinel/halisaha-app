import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import TournamentCard from '@/components/TournamentCard'

type TournamentRow = {
  id: string
  name: string
  description: string | null
  format: string
  status: string
  max_teams: number
  start_date: string | null
  registration_count: number
}

export default async function TournamentsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournamentsData } = await supabase
    .from('tournaments')
    .select('id, name, description, format, status, max_teams, start_date')
    .order('created_at', { ascending: false })

  const tournaments = (tournamentsData ?? []) as Omit<TournamentRow, 'registration_count'>[]

  // Fetch registration counts
  const { data: regCounts } = await supabase
    .from('tournament_registrations')
    .select('tournament_id')

  const countMap = new Map<string, number>()
  for (const row of regCounts ?? []) {
    countMap.set(row.tournament_id, (countMap.get(row.tournament_id) ?? 0) + 1)
  }

  const tournamentsWithCount: TournamentRow[] = tournaments.map((t) => ({
    ...t,
    registration_count: countMap.get(t.id) ?? 0,
  }))

  // Check if user is super admin (for "Create" button)
  let isSuperAdmin = false
  if (user) {
    const { data: superRow } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isSuperAdmin = !!superRow
  }

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Tournaments
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign your team up and compete in organised competitions.
            </p>
          </div>
          {isSuperAdmin && (
            <Link
              href="/tournaments/create"
              className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900 w-fit"
            >
              Create tournament
            </Link>
          )}
        </div>

        {tournamentsWithCount.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">No tournaments yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Check back soon — tournaments will appear here when they open for registration.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tournamentsWithCount.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
