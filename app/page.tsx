import LocationSelector from '@/components/LocationSelector'
import { supabase } from '@/lib/supabase'

type Astroturf = {
  id: string
  name: string
  location_name?: string | null
  address: string
  price_per_hour: number
  is_active: boolean
}

export default async function HomePage() {
  const { data } = await supabase
    .from('astroturf_list_view')
    .select('*')
    .eq('is_active', true)
    .limit(6)

  const astroturfs = (data ?? []) as Astroturf[]

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-b from-green-700 to-green-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold md:text-6xl">
              Find and book the best astroturfs in Cyprus
            </h1>
            <p className="mt-4 text-lg text-green-100 md:text-xl">
              Choose your location, explore nearby halısahas, and reserve your slot easily.
            </p>

            <div className="mt-8">
              <LocationSelector />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">
            Featured astroturfs
          </h2>

          {astroturfs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {astroturfs.map((field) => (
                <div key={field.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-semibold">{field.name}</h3>
                  <p className="text-sm text-gray-500">
                    {field.location_name || 'Unknown location'}
                  </p>
                  <p className="text-sm text-gray-600">{field.address}</p>
                  <p className="mt-2 font-semibold">{field.price_per_hour} TL</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No astroturfs yet</p>
          )}
        </div>
      </section>
    </main>
  )
}