export type FixtureMatch = {
  id: string
  round: number
  home_team_id: string
  away_team_id: string
  home_team_name: string
  away_team_name: string
  home_score: number | null
  away_score: number | null
  status: string
  scheduled_date: string | null
}

type Props = {
  matches: FixtureMatch[]
  isSuperAdmin?: boolean
  onEnterResult?: (matchId: string) => void
}

export default function TournamentFixtures({ matches, isSuperAdmin, onEnterResult }: Props) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No fixtures yet. Start the tournament to generate fixtures.
      </p>
    )
  }

  const byRound = new Map<number, FixtureMatch[]>()
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, [])
    byRound.get(m.round)!.push(m)
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <div key={round}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Round {round}
          </h3>
          <div className="space-y-2">
            {byRound.get(round)!.map((match) => (
              <div
                key={match.id}
                className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 px-5 py-4 ring-1 ring-gray-100 dark:ring-gray-800"
              >
                <span className="flex-1 text-right font-semibold text-gray-900 dark:text-white truncate">
                  {match.home_team_name}
                </span>

                {match.status === 'played' ? (
                  <span className="shrink-0 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 text-sm font-bold tabular-nums min-w-[56px] text-center">
                    {match.home_score} – {match.away_score}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-semibold text-gray-500 dark:text-gray-400 min-w-[56px] text-center">
                    vs
                  </span>
                )}

                <span className="flex-1 font-semibold text-gray-900 dark:text-white truncate">
                  {match.away_team_name}
                </span>

                {match.scheduled_date && match.status !== 'played' && (
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {new Date(match.scheduled_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}

                {isSuperAdmin && match.status !== 'played' && onEnterResult && (
                  <button
                    onClick={() => onEnterResult(match.id)}
                    className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Enter result
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
