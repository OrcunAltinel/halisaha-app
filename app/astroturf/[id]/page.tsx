import { notFound } from 'next/navigation'
import Link from 'next/link'
import TurfCalendar from '@/components/TurfCalendar'
import ReviewsList from '@/components/ReviewsList'
import TurfImageGallery from '@/components/TurfImageGallery'
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

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_profiles: { username: string | null } | null
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

  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, user_profiles(username)')
    .eq('astroturf_id', turf.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewsData ?? []) as Review[]

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/hali-sahalar"
          className="mb-4 inline-block text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to astroturfs
        </Link>

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <div className="p-4 pb-0">
            <TurfImageGallery
              images={turf.image_urls && turf.image_urls.length > 0 ? turf.image_urls : turf.image_url ? [turf.image_url] : []}
              alt={turf.name}
            />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              {turf.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{turf.address}</p>
            {avgRating !== null && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-yellow-400 text-lg">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              ₺{turf.price_per_hour} / hour
            </p>
            {turf.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {turf.description}
              </p>
            )}
            {turf.phone && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Contact: <span className="font-medium text-gray-900 dark:text-white">{turf.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Booking calendar */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Available Time Slots</h2>
          <TurfCalendar
            astroturfId={turf.id}
            pricePerHour={turf.price_per_hour}
            slots={slots}
          />
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
          <ReviewsList reviews={reviews} />
        </div>
      </div>
    </main>
  )
}