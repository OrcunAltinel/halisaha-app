import Link from 'next/link'
import { t, type Locale } from '@/lib/locale'

type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  description?: string | null
  price_per_hour: number
  image_url?: string | null
  image_urls?: string[] | null
  avgRating?: number | null
  reviewCount?: number
}

export default function AstroturfCard({
  field,
  locale,
}: {
  field: Astroturf
  locale: Locale
}) {
  const thumbnail = field.image_urls?.[0] ?? field.image_url ?? null

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md ring-1 ring-gray-100 dark:ring-gray-800 border-l-4 border-green-700">
      <div className="mb-4 h-48 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={field.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{field.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {field.location_name || t(locale, 'Unknown location', 'Bilinmeyen konum')}
          </p>
          {field.avgRating != null && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm leading-none">
                {'★'.repeat(Math.round(field.avgRating))}{'☆'.repeat(5 - Math.round(field.avgRating))}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {field.avgRating.toFixed(1)} ({field.reviewCount})
              </span>
            </div>
          )}
        </div>

        <div className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
          {t(locale, 'Active', 'Aktif')}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{field.address}</p>

      {field.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-lg font-black text-gray-900 dark:text-white">
          <span className="text-green-600 dark:text-green-400">₺</span>{field.price_per_hour}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> {t(locale, '/ hr', '/ saat')}</span>
        </p>

        <Link
          href={`/astroturf/${field.id}`}
          className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
        >
          {t(locale, 'View details', 'Detaylari gör')}
        </Link>
      </div>
    </div>
  )
}
