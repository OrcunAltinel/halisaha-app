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
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleBook = async () => {
    if (!isAvailable || loading) return
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const { error } = await supabase.rpc('book_slot', {
      p_time_slot_id: timeSlotId,
      p_astroturf_id: astroturfId,
      p_user_id: user.id,
      p_total_price: totalPrice,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setSuccessMsg('Request submitted. Awaiting admin approval.')
    setLoading(false)
    router.refresh()
  }

  if (!isAvailable) {
    return (
      <button
        className="cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-500"
        disabled
      >
        Unavailable
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-xs text-green-600">{successMsg}</p>}
      <button
        onClick={handleBook}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? 'Sending request...' : 'Request booking'}
      </button>
    </div>
  )
}