'use client'

import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'
import { useRouter } from 'next/navigation'

type Props = {
  timeSlotId: string
  astroturfId: string
  totalPrice: number
  isAvailable: boolean
  turfName: string
  turfAddress: string
  slotDate: string
  startTime: string
  endTime: string
}

export default function BookSlotButton({
  timeSlotId,
  astroturfId,
  totalPrice,
  isAvailable,
  turfName,
  turfAddress,
  slotDate,
  startTime,
  endTime,
}: Props) {
  const router = useRouter()
  const { locale } = useLocale()

  const handlePay = () => {
    if (!isAvailable) return

    const params = new URLSearchParams({
      slotId: timeSlotId,
      astroturfId,
      price: String(totalPrice),
      turfName,
      turfAddress,
      slotDate,
      startTime,
      endTime,
    })

    router.push(`/reservation-payment?${params.toString()}`)
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
      <button
        onClick={handlePay}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
      >
        {t(locale, 'Pay and request', 'Öde ve rezerve et')}
      </button>
    </div>
  )
}
