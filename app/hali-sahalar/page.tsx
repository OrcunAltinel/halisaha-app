import AstroturfCard from '@/components/AstroturfCard'
import { supabase } from '@/lib/supabase'

type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  description?: string | null
  price_per_hour: number
  is_active: boolean
}

export default async function ListingPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const params = await searchParams
  const location = params.location || ''

  let query = supabase
    .from('astroturf_list_view')
    .select('*')
    .eq('is_active', true)

  if (location) {
    query = query.eq('location_name', location)
  }

  const { data, error } = await query
  const astroturfs = (data ?? []) as Astroturf[]

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Astroturfs</h1>
          <p className="mt-2 text-gray-600">
            {location
              ? `Showing astroturfs in ${location}`
              : 'Showing all available astroturfs'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-700">
            Failed to load astroturfs.
          </div>
        )}

        {!error && astroturfs.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {astroturfs.map((field) => (
              <AstroturfCard key={field.id} field={field} />
            ))}
          </div>
        )}

        {!error && astroturfs.length === 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">No astroturfs found for this location.</p>
          </div>
        )}
      </div>
    </main>
  )
}