import Link from 'next/link'

type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  description?: string | null
  price_per_hour: number
  avgRating?: number | null
  reviewCount?: number
}

export default function AstroturfCard({ field }: { field: Astroturf }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 h-48 rounded-xl bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{field.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {field.location_name || 'Unknown location'}
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
          Active
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{field.address}</p>

      {field.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{field.price_per_hour} TL</p>

        <Link
          href={`/astroturf/${field.id}`}
          className="rounded-xl bg-black dark:bg-white px-4 py-2 text-white dark:text-black transition hover:opacity-90"
        >
          View details
        </Link>
      </div>
    </div>
  )
}
