import { redirect } from 'next/navigation'
import ReservationPaymentClient from './ReservationPaymentClient'
import { createSupabaseServerClient } from '@/lib/supabase'

type SearchParams = {
  slotId?: string
  astroturfId?: string
  price?: string
}

type TurfRow = {
  id: string
  name: string
  address: string
  price_per_hour: number
  is_active: boolean
}

type SlotRow = {
  id: string
  astroturf_id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
}

export default async function ReservationPaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const redirectPath = `/reservation-payment?${new URLSearchParams({
    ...(params.slotId ? { slotId: params.slotId } : {}),
    ...(params.astroturfId ? { astroturfId: params.astroturfId } : {}),
    ...(params.price ? { price: params.price } : {}),
  }).toString()}`

  if (!params.slotId || !params.astroturfId) {
    redirect('/hali-sahalar')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }

  const [{ data: turfData }, { data: slotData }] = await Promise.all([
    supabase
      .from('astroturfs')
      .select('id, name, address, price_per_hour, is_active')
      .eq('id', params.astroturfId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('time_slots')
      .select('id, astroturf_id, slot_date, start_time, end_time, is_available')
      .eq('id', params.slotId)
      .eq('astroturf_id', params.astroturfId)
      .maybeSingle(),
  ])

  const turf = turfData as TurfRow | null
  const slot = slotData as SlotRow | null

  if (!turf || !slot || !slot.is_available) {
    redirect(`/astroturf/${params.astroturfId}`)
  }

  const price = Number(params.price)
  const totalPrice = Number.isFinite(price) && price > 0 ? price : turf.price_per_hour

  return (
    <ReservationPaymentClient
      details={{
        astroturfId: turf.id,
        timeSlotId: slot.id,
        turfName: turf.name,
        turfAddress: turf.address,
        slotDate: slot.slot_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        totalPrice,
      }}
    />
  )
}
