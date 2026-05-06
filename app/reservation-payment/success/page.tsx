import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getRequestLocale } from '@/lib/locale-server'
import { t } from '@/lib/locale'
import { formatDateLabel, formatTime } from '@/lib/date-helpers'

type SearchParams = {
  reservationId?: string
  paymentReference?: string
  cardLast4?: string
}

type ReservationRow = {
  id: string
  status: string
  payment_status: string
  total_price: number
  created_at: string
  astroturf_id: string
  astroturfs: { name: string | null; address: string | null } | { name: string | null; address: string | null }[] | null
  time_slots: { slot_date: string | null; start_time: string | null; end_time: string | null } | { slot_date: string | null; start_time: string | null; end_time: string | null }[] | null
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export default async function ReservationPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const locale = await getRequestLocale()
  const params = await searchParams

  if (!params.reservationId) {
    redirect('/my-reservations')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('reservations')
    .select(`
      id, status, payment_status, total_price, created_at, astroturf_id,
      astroturfs ( name, address ),
      time_slots ( slot_date, start_time, end_time )
    `)
    .eq('id', params.reservationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) {
    redirect('/my-reservations')
  }

  const reservation = data as unknown as ReservationRow
  const turf = firstRelation(reservation.astroturfs)
  const slot = firstRelation(reservation.time_slots)

  return (
    <main className="min-h-screen bg-gray-200 px-4 py-10 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="bg-green-700 px-6 py-8 text-white sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-100">
              {t(locale, 'Payment approved', 'Ödemeniz onaylandı')}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {t(locale, 'Reservation payment receipt', 'Rezervasyon ödeme belgesi')}
            </h1>
            <p className="mt-2 text-green-50">
              {t(
                locale,
                'Your demo card payment was completed successfully. Your booking request is now waiting for admin approval.',
                'Demo kart ödemeniz başarıyla tamamlandı. Rezervasyon talebiniz şimdi yönetici onayı bekliyor.'
              )}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 grid gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                  {t(locale, 'Payment ref', 'Ödeme no')}
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {params.paymentReference ?? reservation.id}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                  {t(locale, 'Reservation ID', 'Rezervasyon ID')}
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {reservation.id}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Pitch', 'Saha')}</dt>
                <dd className="font-bold text-gray-900 dark:text-white">{turf?.name ?? '-'}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Address', 'Adres')}</dt>
                <dd className="text-gray-800 dark:text-gray-200">{turf?.address ?? '-'}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Date', 'Tarih')}</dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {slot?.slot_date ? formatDateLabel(slot.slot_date, locale) : '-'}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Time', 'Saat')}</dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {formatTime(slot?.start_time)} – {formatTime(slot?.end_time)}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Payment method', 'Ödeme yöntemi')}</dt>
                <dd className="text-gray-800 dark:text-gray-200">
                  {t(locale, 'Demo credit card', 'Demo kredi kartı')} •••• {params.cardLast4 ?? '4242'}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Payment status', 'Ödeme durumu')}</dt>
                <dd className="font-bold text-green-700 dark:text-green-400">
                  {t(locale, 'Approved', 'Onaylandı')}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold text-gray-500">{t(locale, 'Total paid', 'Ödenen tutar')}</dt>
                <dd className="text-3xl font-black text-gray-900 dark:text-white">
                  {reservation.total_price} TL
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/my-reservations"
                className="rounded-2xl bg-gray-900 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {t(locale, 'View my reservations', 'Rezervasyonlarımı gör')}
              </Link>
              <Link
                href={`/astroturf/${reservation.astroturf_id}`}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t(locale, 'Back to pitch', 'Sahaya geri dön')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
