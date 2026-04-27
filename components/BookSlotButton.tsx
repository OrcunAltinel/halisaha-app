'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatTime } from '@/lib/date-helpers'

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

type Receipt = {
  reservationId: string
  userName: string | null
  userPhone: string | null
  bookedAt: string
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
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const { locale } = useLocale()

  const handleBook = async () => {
    if (!isAvailable || loading) return
    setLoading(true)
    setErrorMsg('')

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

    const [{ data: res }, { data: profile }] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, created_at')
        .eq('time_slot_id', timeSlotId)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('name, surname, phone')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    setReceipt({
      reservationId: res?.id ?? '',
      userName: profile
        ? `${profile.name ?? ''} ${profile.surname ?? ''}`.trim() || null
        : null,
      userPhone: profile?.phone ?? null,
      bookedAt: res?.created_at ?? new Date().toISOString(),
    })

    setLoading(false)
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

  const formattedDate = (() => {
    const [y, m, d] = slotDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(
      locale === 'tr' ? 'tr-TR' : 'en-GB',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    )
  })()

  return (
    <>
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            {/* Header */}
            <div className="bg-green-700 px-6 py-5 text-center text-white">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                ✓
              </div>
              <h2 className="text-lg font-bold">
                {t(locale, 'Booking Requested!', 'Rezervasyon Talep Edildi!')}
              </h2>
              <p className="mt-1 text-sm text-green-100">
                {t(locale, 'Awaiting admin approval', 'Yönetici onayı bekleniyor')}
              </p>
            </div>

            {/* Body */}
            <div className="space-y-3 px-6 py-5 text-sm">
              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              {receipt.reservationId && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t(locale, 'Booking ref.', 'Rezervasyon no.')}
                  </span>
                  <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                    #{receipt.reservationId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Pitch', 'Saha')}</span>
                <span className="text-right font-semibold text-gray-900 dark:text-white">{turfName}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-gray-500 dark:text-gray-400">{t(locale, 'Address', 'Adres')}</span>
                <span className="text-right text-xs text-gray-600 dark:text-gray-300">{turfAddress}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-gray-500 dark:text-gray-400">{t(locale, 'Date', 'Tarih')}</span>
                <span className="text-right font-semibold text-gray-900 dark:text-white">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Time', 'Saat')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatTime(startTime)} – {formatTime(endTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Duration', 'Süre')}</span>
                <span className="text-gray-700 dark:text-gray-300">{t(locale, '1 hour', '1 saat')}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              {receipt.userName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Name', 'Ad Soyad')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{receipt.userName}</span>
                </div>
              )}
              {receipt.userPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Phone', 'Telefon')}</span>
                  <span className="text-gray-700 dark:text-gray-300">{receipt.userPhone}</span>
                </div>
              )}
              {(receipt.userName || receipt.userPhone) && (
                <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />
              )}

              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-gray-900 dark:text-white">{t(locale, 'Total', 'Toplam')}</span>
                <span className="font-bold text-gray-900 dark:text-white">₺{totalPrice}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Status', 'Durum')}</span>
                <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {t(locale, 'Pending Approval', 'Onay Bekleniyor')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t(locale, 'Issued', 'Oluşturuldu')}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(receipt.bookedAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {t(
                  locale,
                  'You will be notified once the admin confirms your booking.',
                  'Yönetici rezervasyonunuzu onayladığında bilgilendirileceksiniz.'
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-6">
              <a
                href="/my-reservations"
                className="block w-full rounded-xl bg-green-700 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-800"
              >
                {t(locale, 'View my reservations', 'Rezervasyonlarımı gör')}
              </a>
              <button
                onClick={() => { setReceipt(null); router.refresh() }}
                className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t(locale, 'Close', 'Kapat')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-end gap-1">
        {errorMsg && <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>}
        <button
          onClick={handleBook}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading
            ? t(locale, 'Sending request...', 'Talep gönderiliyor...')
            : t(locale, 'Request booking', 'Rezervasyon iste')}
        </button>
      </div>
    </>
  )
}
