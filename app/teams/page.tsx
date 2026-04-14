import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import TeamCard from '@/components/TeamCard'
import TeamSearchBar from '@/components/TeamSearchBar'
import { t } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

type TeamRow = {
  id: string
  name: string
  description: string | null
  captain_id: string
  member_count: number
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const locale = await getRequestLocale()
  const supabase = await createSupabaseServerClient()
  const { q } = await searchParams
  const query = (q || '').trim()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch teams with optional search filter
  let teamsQuery = supabase
    .from('teams')
    .select('id, name, description, captain_id')
    .order('created_at', { ascending: false })

  if (query) {
    const escaped = query.replace(/[%]/g, '')
    teamsQuery = teamsQuery.or(
      `name.ilike.%${escaped}%,description.ilike.%${escaped}%`
    )
  }

  const { data: teamsData } = await teamsQuery
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
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">{t(locale, 'Teams', 'Takımlar')}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t(locale, 'Browse all teams or create your own.', 'Tüm takımlara göz at veya kendi takımını kur.')}
            </p>
          </div>

          {user && !currentUserTeamId && (
            <Link href="/teams/create" className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900 w-fit">
              {t(locale, 'Create a team', 'Takım oluştur')}
            </Link>
          )}
          {user && currentUserTeamId && (
            <Link href="/my-team" className="rounded-xl border border-green-800 px-5 py-2.5 text-sm font-semibold text-green-800 dark:text-green-400 transition hover:bg-green-800/10 w-fit">
              {t(locale, 'Go to My Team', 'Takımıma git')}
            </Link>
          )}
          {!user && (
            <Link href="/login" className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900 w-fit">
              {t(locale, 'Log in to create a team', 'Takım oluşturmak için giriş yap')}
            </Link>
          )}
        </div>

        <TeamSearchBar key={query} initialQuery={query} />

        {teamsWithCount.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {query
                ? locale === 'tr'
                  ? `"${query}" için takım bulunamadı`
                  : `No teams found for "${query}"`
                : t(locale, 'No teams yet', 'Henüz takım yok')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {query
                ? t(locale, 'Try a different search term.', 'Farkli bir arama terimi dene.')
                : t(locale, 'Be the first to create a team!', 'İlk takımı sen kur!')}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {locale === 'tr'
                ? `${teamsWithCount.length} takım${query ? ` "${query}" ile eşleşen` : ''}`
                : `${teamsWithCount.length} ${teamsWithCount.length === 1 ? 'team' : 'teams'}${query ? ` matching "${query}"` : ''}`}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamsWithCount.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isCurrentUserTeam={team.id === currentUserTeamId}
                  locale={locale}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
