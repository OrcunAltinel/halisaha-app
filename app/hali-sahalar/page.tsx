import AstroturfCard from '@/components/AstroturfCard'
import TurfFilterBar from '@/components/TurfFilterBar'
import { createSupabaseServerClient } from '@/lib/supabase'

type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  description?: string | null
  price_per_hour: number
  is_active: boolean
  avgRating?: number | null
  reviewCount?: number
}

type RatingRow = {
  astroturf_id: string
  rating: number
}

type Location = {
  id: string
  name: string
}

type SearchParams = {
  q?: string
  location?: string
  minPrice?: string
  maxPrice?: string
}

export default async function ListingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createSupabaseServerClient()
  const params = await searchParams

  const q = (params.q || '').trim()
  const location = (params.location || '').trim()
  const minPrice = params.minPrice ? Number(params.minPrice) : null
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null

  // Fetch available locations for the dropdown
  const { data: locationsData } = await supabase
    .from('locations')
    .select('id, name')
    .order('name', { ascending: true })

  const locations = (locationsData ?? []) as Location[]

  // Build the astroturf query with filters applied in the database
  let query = supabase
    .from('astroturf_list_view')
    .select('*')
    .eq('is_active', true)

  if (location) {
    query = query.eq('location_name', location)
  }

  if (minPrice !== null && !Number.isNaN(minPrice)) {
    query = query.gte('price_per_hour', minPrice)
  }

  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    query = query.lte('price_per_hour', maxPrice)
  }

  if (q) {
    // Case-insensitive search across name, address, and description
    const escaped = q.replace(/[%,]/g, '')
    query = query.or(
      `name.ilike.%${escaped}%,address.ilike.%${escaped}%,description.ilike.%${escaped}%`
    )
  }

  query = query.order('name', { ascending: true })

  const [{ data, error }, { data: ratingsData }] = await Promise.all([
    query,
    supabase.from('reviews').select('astroturf_id, rating'),
  ])

  // Compute avg rating per turf
  const ratingMap: Record<string, { sum: number; count: number }> = {}
  for (const row of (ratingsData ?? []) as RatingRow[]) {
    if (!ratingMap[row.astroturf_id]) ratingMap[row.astroturf_id] = { sum: 0, count: 0 }
    ratingMap[row.astroturf_id].sum += row.rating
    ratingMap[row.astroturf_id].count += 1
  }

  const astroturfs = ((data ?? []) as Astroturf[]).map((t) => {
    const r = ratingMap[t.id]
    return r ? { ...t, avgRating: r.sum / r.count, reviewCount: r.count } : t
  })

  const hasActiveFilters = Boolean(q || location || minPrice !== null || maxPrice !== null)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">Astroturfs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and book astroturf pitches across the island.
          </p>
        </div>

        <TurfFilterBar
          locations={locations}
          initialQuery={q}
          initialLocation={location}
          initialMinPrice={params.minPrice || ''}
          initialMaxPrice={params.maxPrice || ''}
        />

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            Failed to load astroturfs. Please try again.
          </div>
        )}

        {!error && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {astroturfs.length} {astroturfs.length === 1 ? 'result' : 'results'}
              {hasActiveFilters ? ' matching your filters' : ''}
            </p>
          </div>
        )}

        {!error && astroturfs.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {astroturfs.map((field) => (
              <AstroturfCard key={field.id} field={field} />
            ))}
          </div>
        )}

        {!error && astroturfs.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-base font-medium text-gray-900 dark:text-white">No astroturfs found</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilters
                ? 'Try adjusting your filters or clearing them to see more results.'
                : 'There are no astroturfs available right now.'}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}