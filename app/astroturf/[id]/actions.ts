'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TEST_USER_ID = 'a18d7129-aa5b-42a7-b97a-4b6b1d2c686d'

export async function bookSlot(formData: FormData) {
  const timeSlotId = formData.get('time_slot_id') as string
  const astroturfId = formData.get('astroturf_id') as string
  const totalPriceRaw = formData.get('total_price') as string

  const totalPrice = Number(totalPriceRaw)

  if (!timeSlotId || !astroturfId || Number.isNaN(totalPrice)) {
    throw new Error('Missing booking data.')
  }

  const { error: reservationError } = await supabase
    .from('reservations')
    .insert({
      user_id: TEST_USER_ID,
      astroturf_id: astroturfId,
      time_slot_id: timeSlotId,
      total_price: totalPrice,
      status: 'pending',
      payment_status: 'unpaid',
    })

  if (reservationError) {
    throw new Error(reservationError.message)
  }

  const { error: slotError } = await supabase
    .from('time_slots')
    .update({ is_available: false })
    .eq('id', timeSlotId)

  if (slotError) {
    throw new Error(slotError.message)
  }

  revalidatePath(`/astroturf/${astroturfId}`)
}