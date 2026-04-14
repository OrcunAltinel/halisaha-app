'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'
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
  const { locale } = useLocale()

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

    setSuccessMsg(t(locale, 'Request submitted. Awaiting admin approval.', 'Talep gönderildi. Yönetici onayı bekleniyor.'))
    setLoading(false)
    router.refresh()
  }

  if (!isAvailable) {
    return (
      <button
        className="cursor-not-allowed rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
        disabled
      >
        {t(locale, 'Unavailable', 'Müsait değil')}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {errorMsg && <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>}
      {successMsg && <p className="text-xs text-green-600 dark:text-green-400">{successMsg}</p>}
      <button
        onClick={handleBook}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? t(locale, 'Sending request...', 'Talep gönderiliyor...') : t(locale, 'Request booking', 'Rezervasyon iste')}
      </button>
    </div>
  )
}
