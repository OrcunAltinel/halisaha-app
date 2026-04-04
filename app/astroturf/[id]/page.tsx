import { supabase } from '@/lib/supabase'
import { bookSlot } from './actions'

type Astroturf = {
  id: string
  name: string
  address: string
  description?: string | null
  price_per_hour: number
}

type TimeSlot = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
}

export default async function AstroturfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: astroturf, error: astroturfError } = await supabase
    .from('astroturfs')
    .select('*')
    .eq('id', id)
    .single()

  const { data: slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('astroturf_id', id)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (astroturfError || !astroturf) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Astroturf not found</h1>
          <p className="mt-2 text-gray-600">
            The astroturf you are looking for does not exist.
          </p>
        </div>
      </main>
    )
  }

  const safeSlots = (slots ?? []) as TimeSlot[]

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">{astroturf.name}</h1>
          <p className="mt-2 text-gray-600">{astroturf.address}</p>
          <p className="mt-4 text-lg font-semibold">
            {astroturf.price_per_hour} TL / hour
          </p>

          {astroturf.description && (
            <p className="mt-4 text-gray-500">{astroturf.description}</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">Available Time Slots</h2>

          {slotsError && (
            <div className="mb-4 rounded-xl bg-red-100 p-4 text-red-700">
              Failed to load time slots.
            </div>
          )}

          {safeSlots.length > 0 ? (
            <div className="grid gap-4">
              {safeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium">{slot.slot_date}</p>
                    <p className="text-sm text-gray-500">
                      {slot.start_time} - {slot.end_time}
                    </p>
                  </div>

                  {slot.is_available ? (
                    <form action={bookSlot}>
                      <input type="hidden" name="time_slot_id" value={slot.id} />
                      <input type="hidden" name="astroturf_id" value={astroturf.id} />
                      <input
                        type="hidden"
                        name="total_price"
                        value={astroturf.price_per_hour}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                      >
                        Book
                      </button>
                    </form>
                  ) : (
                    <button
                      className="cursor-not-allowed rounded-lg bg-gray-400 px-4 py-2 text-white"
                      disabled
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-gray-600">No slots yet for this astroturf.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}