import Link from 'next/link'
import { t, type Locale } from '@/lib/locale'

type Props = {
  team: {
    id: string
    name: string
    description: string | null
    captain_id: string
    member_count: number
  }
  isCurrentUserTeam: boolean
  locale: Locale
}

export default function TeamCard({ team, isCurrentUserTeam, locale }: Props) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md ring-1 ring-gray-100 dark:ring-gray-800 border-l-4 border-green-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
          {team.name}
        </h3>
        {isCurrentUserTeam && (
          <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
            {t(locale, 'Your team', 'Senin takımın')}
          </span>
        )}
      </div>

      {team.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {team.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {locale === 'tr'
            ? `${team.member_count} üye`
            : `${team.member_count} ${team.member_count === 1 ? 'member' : 'members'}`}
        </span>

        <Link
          href={`/teams/${team.id}`}
          className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
        >
          {t(locale, 'View team', 'Takımı gör')}
        </Link>
      </div>
    </div>
  )
}
