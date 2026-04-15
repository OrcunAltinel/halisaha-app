import Link from 'next/link'
import type { Locale } from '@/lib/locale'
import { t } from '@/lib/locale'

type Props = {
  tournament: {
    id: string
    name: string
    description: string | null
    format: string
    status: string
    max_teams: number
    start_date: string | null
    registration_count: number
  }
  locale?: Locale
}

function statusBadgeClass(status: string) {
  if (status === 'registration') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  if (status === 'active') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

function statusLabel(status: string, locale: Locale) {
  if (status === 'registration') return t(locale, 'Registration Open', 'Kayıt Açık')
  if (status === 'active') return t(locale, 'In Progress', 'Devam Ediyor')
  return t(locale, 'Completed', 'Tamamlandı')
}

export default function TournamentCard({ tournament, locale = 'en' }: Props) {
  const progress = Math.min(tournament.registration_count / tournament.max_teams, 1)

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md ring-1 ring-gray-100 dark:ring-gray-800 border-l-4 border-green-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
          {tournament.name}
        </h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(tournament.status)}`}>
          {statusLabel(tournament.status, locale)}
        </span>
      </div>

      {tournament.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {tournament.description}
        </p>
      )}

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Teams registered', 'Kayıtlı takımlar')}</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {tournament.registration_count} / {tournament.max_teams}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {tournament.start_date ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t(locale, 'Starts', 'Başlangıç')}{' '}
            {new Date(tournament.start_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ) : (
          <span />
        )}
        <Link
          href={`/tournaments/${tournament.id}`}
          className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
        >
          {t(locale, 'View tournament', 'Turnuvayı görüntüle')}
        </Link>
      </div>
    </div>
  )
}
