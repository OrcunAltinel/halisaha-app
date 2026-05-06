import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

type ReservationRow = {
  id: string
  status: string
  payment_status: string
  total_price: number
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { astroturfId, timeSlotId, totalPrice, cardLast4 } = await request.json()
  const price = Number(totalPrice)

  if (!astroturfId || !timeSlotId || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Missing or invalid payment details' }, { status: 400 })
  }

  if (cardLast4 !== '4242') {
    return NextResponse.json({ error: 'Demo payment only accepts card ending 4242' }, { status: 400 })
  }

  const { data: slot, error: slotError } = await supabase
    .from('time_slots')
    .select('id, astroturf_id, is_available')
    .eq('id', timeSlotId)
    .eq('astroturf_id', astroturfId)
    .maybeSingle()

  if (slotError) {
    return NextResponse.json({ error: slotError.message }, { status: 400 })
  }

  if (!slot?.is_available) {
    return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 })
  }

  const { error: bookingError } = await supabase.rpc('book_slot', {
    p_time_slot_id: timeSlotId,
    p_astroturf_id: astroturfId,
    p_user_id: user.id,
    p_total_price: price,
  })

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 400 })
  }

  const { data: reservationData, error: reservationError } = await supabase
    .from('reservations')
    .select('id, status, payment_status, total_price')
    .eq('time_slot_id', timeSlotId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (reservationError || !reservationData) {
    return NextResponse.json(
      { error: reservationError?.message ?? 'Reservation was created but could not be loaded' },
      { status: 400 }
    )
  }

  const reservation = reservationData as ReservationRow
  const paymentReference = `DEMO-${Date.now()}-${reservation.id.slice(0, 8).toUpperCase()}`

  const { error: paymentUpdateError } = await supabase
    .from('reservations')
    .update({ payment_status: 'paid' })
    .eq('id', reservation.id)
    .eq('user_id', user.id)

  if (paymentUpdateError) {
    console.warn('[reservation-demo-payment] Could not mark reservation as paid:', paymentUpdateError.message)
  }

  console.log(
    JSON.stringify(
      {
        message: 'Demo reservation payment confirmed',
        paymentReference,
        reservationId: reservation.id,
        astroturfId,
        timeSlotId,
        userId: user.id,
        totalPrice: price,
        currency: 'TRY',
        cardLast4,
      },
      null,
      2
    )
  )

  return NextResponse.json({
    ok: true,
    reservationId: reservation.id,
    paymentReference,
  })
}
