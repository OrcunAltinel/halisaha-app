'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  timeSlotId: string
  astroturfId: string
  totalPrice: number
  isAvailable: boolean
}

export default function BookSlotButton({
  timeSlotId,
  astroturfId,
  totalPrice,
  isAvailable,
}: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)

  const handleBook = async () => {
    if (!isAvailable || loading) return

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: reservationError } = await supabase.from('reservations').insert({
      user_id: user.id,
      astroturf_id: astroturfId,
      time_slot_id: timeSlotId,
      total_price: totalPrice,
      status: 'pending',
      payment_status: 'unpaid',
    })

    if (reservationError) {
      alert(reservationError.message)
      setLoading(false)
      return
    }

    const { error: slotError } = await supabase
      .from('time_slots')
      .update({ is_available: false })
      .eq('id', timeSlotId)

    if (slotError) {
      alert(slotError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  if (!isAvailable) {
    return (
      <button
        className="cursor-not-allowed rounded-lg bg-gray-400 px-4 py-2 text-white"
        disabled
      >
        Unavailable
      </button>
    )
  }

  return (
    <button
      onClick={handleBook}
      disabled={loading}
      className="rounded-lg bg-green-600 px-4 py-2 text-white"
    >
      {loading ? 'Booking...' : 'Book'}
    </button>
  )
}