'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateLabel, formatTime } from '@/lib/date-helpers'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type PaymentDetails = {
  astroturfId: string
  timeSlotId: string
  turfName: string
  turfAddress: string
  slotDate: string
  startTime: string
  endTime: string
  totalPrice: number
}

type Props = {
  details: PaymentDetails
}

function normalizeCard(value: string) {
  return value.replace(/\D/g, '').slice(0, 16)
}

function formatCard(value: string) {
  return normalizeCard(value).replace(/(.{4})/g, '$1 ').trim()
}

export default function ReservationPaymentClient({ details }: Props) {
  const router = useRouter()
  const { locale } = useLocale()
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('12/30')
  const [cvc, setCvc] = useState('123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedCard = normalizeCard(cardNumber)
    if (normalizedCard !== '4242424242424242') {
      setError(t(locale, 'Use the demo card 4242 4242 4242 4242.', 'Demo kartı kullan: 4242 4242 4242 4242.'))
      return
    }

    if (!name.trim()) {
      setError(t(locale, 'Enter the cardholder name.', 'Kart üzerindeki ismi gir.'))
      return
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry.trim()) || cvc.trim().length < 3) {
      setError(t(locale, 'Enter a valid expiry date and CVC.', 'Geçerli son kullanma tarihi ve CVC gir.'))
      return
    }

    setLoading(true)

    const response = await fetch('/api/reservation-demo-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        astroturfId: details.astroturfId,
        timeSlotId: details.timeSlotId,
        totalPrice: details.totalPrice,
        cardLast4: normalizedCard.slice(-4),
      }),
    })

    const json = (await response.json().catch(() => null)) as {
      reservationId?: string
      paymentReference?: string
      error?: string
    } | null

    setLoading(false)

    if (!response.ok || !json?.reservationId || !json.paymentReference) {
      setError(json?.error ?? t(locale, 'Payment could not be completed.', 'Ödeme tamamlanamadı.'))
      return
    }

    const params = new URLSearchParams({
      reservationId: json.reservationId,
      paymentReference: json.paymentReference,
      cardLast4: normalizedCard.slice(-4),
    })

    router.push(`/reservation-payment/success?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
            {t(locale, 'Demo payment', 'Demo ödeme')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {t(locale, 'Complete your reservation payment', 'Rezervasyon ödemeni tamamla')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t(
              locale,
              'This is a demo card payment. No real money is charged.',
              'Bu demo kart ödemesidir. Gerçek para çekilmez.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t(locale, 'Cardholder name', 'Kart üzerindeki isim')}
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Hasan Oduncuoglu"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t(locale, 'Card number', 'Kart numarası')}
              </label>
              <input
                inputMode="numeric"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCard(event.target.value))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t(locale, 'Demo card: 4242 4242 4242 4242', 'Demo kart: 4242 4242 4242 4242')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t(locale, 'Expiry', 'Son kullanım')}
                </label>
                <input
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value.slice(0, 5))}
                  placeholder="12/30"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  CVC
                </label>
                <input
                  inputMode="numeric"
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {loading
                ? t(locale, 'Processing payment...', 'Ödeme işleniyor...')
                : locale === 'tr'
                  ? `${details.totalPrice} TL öde`
                  : `Pay ${details.totalPrice} TL`}
            </button>

            <Link
              href={`/astroturf/${details.astroturfId}`}
              className="inline-flex text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t(locale, '← Back to pitch', '← Sahaya geri dön')}
            </Link>
          </form>
        </section>

        <aside className="rounded-3xl border border-gray-200 bg-gray-950 p-6 text-white shadow-sm dark:border-gray-800">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">
            {t(locale, 'Reservation summary', 'Rezervasyon özeti')}
          </p>
          <h2 className="mt-3 text-2xl font-black">{details.turfName}</h2>
          <p className="mt-1 text-sm text-gray-400">{details.turfAddress}</p>

          <dl className="mt-8 space-y-4">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
              <dt className="text-gray-400">{t(locale, 'Date', 'Tarih')}</dt>
              <dd className="text-right font-semibold">{formatDateLabel(details.slotDate, locale)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
              <dt className="text-gray-400">{t(locale, 'Time', 'Saat')}</dt>
              <dd className="font-semibold">
                {formatTime(details.startTime)} – {formatTime(details.endTime)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
              <dt className="text-gray-400">{t(locale, 'Payment type', 'Ödeme tipi')}</dt>
              <dd className="font-semibold">{t(locale, 'Demo credit card', 'Demo kredi kartı')}</dd>
            </div>
            <div className="flex items-end justify-between gap-4 pt-2">
              <dt className="text-gray-400">{t(locale, 'Total', 'Toplam')}</dt>
              <dd className="text-3xl font-black">{details.totalPrice} TL</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
