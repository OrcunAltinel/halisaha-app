import { notFound } from 'next/navigation'
import Link from 'next/link'
import TurfCalendar from '@/components/TurfCalendar'
import { createSupabaseServerClient } from '@/lib/supabase'

type Astroturf = {
  id: string
  name: string
  description: string | null
  address: string
  price_per_hour: number
  phone: string | null
  image_url: string | null
  image_urls: string[] | null
  is_active: boolean
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
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  // Load the turf
  const { data: turfData, error: turfError } = await supabase
    .from('astroturfs')
    .select(
      'id, name, description, address, price_per_hour, phone, image_url, image_urls, is_active'
    )
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (turfError || !turfData) {
    notFound()
  }

  const turf = turfData as Astroturf

  // Load time slots from today onwards
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`

  const { data: slotsData } = await supabase
    .from('time_slots')
    .select('id, slot_date, start_time, end_time, is_available')
    .eq('astroturf_id', turf.id)
    .gte('slot_date', todayStr)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true })

  const slots = (slotsData ?? []) as TimeSlot[]

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/hali-sahalar"
          className="mb-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to astroturfs
        </Link>

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {turf.image_url && (
            <div className="aspect-[16/7] w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={turf.image_url}
                alt={turf.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              {turf.name}
            </h1>
            <p className="mt-2 text-gray-600">{turf.address}</p>
            <p className="mt-4 text-lg font-semibold text-gray-900">
              ₺{turf.price_per_hour} / hour
            </p>
            {turf.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                {turf.description}
              </p>
            )}
            {turf.phone && (
              <p className="mt-3 text-sm text-gray-600">
                Contact: <span className="font-medium text-gray-900">{turf.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Booking calendar */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Available Time Slots</h2>
          <TurfCalendar
            astroturfId={turf.id}
            pricePerHour={turf.price_per_hour}
            slots={slots}
          />
        </div>
      </div>
    </main>
  )
}