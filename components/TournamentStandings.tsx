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

type Props = {
  standings: Standing[]
  currentUserTeamId?: string | null
}

export default function TournamentStandings({ standings, currentUserTeamId }: Props) {
  if (standings.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No standings yet. Start the tournament to generate standings.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-gray-100 dark:ring-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-left">
            <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
            <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Team</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">P</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">W</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">D</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">L</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">GF</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">GA</th>
            <th className="px-3 py-3 text-center font-bold text-gray-700 dark:text-gray-300">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const isMyTeam = row.team_id === currentUserTeamId
            return (
              <tr
                key={row.team_id}
                className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                  isMyTeam
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-white dark:bg-gray-900'
                }`}
              >
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {row.team_name}
                  {isMyTeam && (
                    <span className="ml-2 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                      You
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.played}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.wins}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.draws}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.losses}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.goals_for}</td>
                <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.goals_against}</td>
                <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
