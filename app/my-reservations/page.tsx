'use client'

import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import {
  dateBucket,
  effectiveStatus,
  formatDateLabel,
  formatTime,
} from '@/lib/date-helpers'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastProvider'
import ReviewForm from '@/components/ReviewForm'
import StarRating from '@/components/StarRating'
import { t, translateCancellationActor, translatePaymentStatus, translateStatus } from '@/lib/locale'
import { useLocale } from '@/components/LocaleProvider'

type ReservationRow = {
  id: string
  astroturf_id: string
  status: string
  payment_status: string
  total_price: number
  created_at: string
  cancelled_by: string | null
  cancellation_reason: string | null
  astroturfs: { name: string; address: string } | null
  time_slots: { slot_date: string; start_time: string; end_time: string } | null
}

type SubmittedReview = {
  rating: number
  comment: string
}

type TabKey = 'upcoming' | 'past'

const supabase = createSupabaseBrowserClient()

export default function MyReservationsPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')
  const [cancelModal, setCancelModal] = useState<string | null>(null) // reservationId
  const [reviewingId, setReviewingId] = useState<string | null>(null) // reservation showing form
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, SubmittedReview>>({}) // reservationId -> review
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set()) // already-reviewed reservation IDs
  const { showToast } = useToast()

  useEffect(() => {
    let mounted = true

    const loadReservations = async () => {
      setLoading(true)
      setErrorMessage('')

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (!mounted) return

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id, astroturf_id, status, payment_status, total_price, created_at,
          cancelled_by, cancellation_reason,
          astroturfs ( name, address ),
          time_slots ( slot_date, start_time, end_time )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      const rows = (data || []) as unknown as ReservationRow[]
      setReservations(rows)

      // Fetch which reservations already have a review from this user
      const reservationIds = rows.map((r) => r.id)
      if (reservationIds.length > 0) {
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('reservation_id')
          .in('reservation_id', reservationIds)
          .eq('user_id', user.id)

        if (mounted && existingReviews) {
          setReviewedIds(new Set(existingReviews.map((r) => r.reservation_id)))
        }
      }

      setLoading(false)
    }

    loadReservations()
    return () => { mounted = false }
  }, [router])

  const handleCancel = (reservationId: string) => {
    setCancelModal(reservationId)
  }

  const confirmCancel = async (reason?: string) => {
    if (!cancelModal) return
    const reservationId = cancelModal
    setCancelModal(null)
    setCancellingId(reservationId)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.rpc('cancel_reservation', {
      p_reservation_id: reservationId,
      p_user_id: user.id,
      p_reason: reason || null,
    })

    if (error) {
      showToast(error.message, 'error')
      setCancellingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, status: 'cancelled', cancelled_by: 'user', cancellation_reason: reason || null }
          : r
      )
    )
    setCancellingId(null)
    showToast(t(locale, 'Reservation cancelled.', 'Rezervasyon iptal edildi.'))
  }

  const handleReviewSuccess = (reservationId: string, rating: number, comment: string) => {
    setSubmittedReviews((prev) => ({ ...prev, [reservationId]: { rating, comment } }))
    setReviewedIds((prev) => new Set([...prev, reservationId]))
    setReviewingId(null)
    showToast(t(locale, 'Review submitted!', 'Yorum gönderildi!'))
  }

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    if (status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'completed') return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  }

  const { past, upcoming } = useMemo(() => {
    const past: ReservationRow[] = []
    const upcoming: ReservationRow[] = []
    for (const r of reservations) {
      const bucket = dateBucket(r.time_slots?.slot_date)
      if (bucket === 'past') past.push(r)
      else upcoming.push(r) // today + upcoming
    }
    return { past, upcoming }
  }, [reservations])

  const visibleList = activeTab === 'past' ? past : upcoming

  const tabButton = (key: TabKey, label: string, count: number) => {
    const isActive = activeTab === key
    return (
      <button
        onClick={() => setActiveTab(key)}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          isActive ? 'bg-green-800 text-white' : 'border dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
        }`}
      >
        {label} ({count})
      </button>
    )
  }

  return (
    <>
    {cancelModal && (
      <ConfirmModal
        title={t(locale, 'Cancel reservation?', 'Rezervasyonu iptal et?')}
        message={t(locale, 'Are you sure you want to cancel this reservation?', 'Bu rezervasyonu iptal etmek istediğine emin misin?')}
        confirmLabel={t(locale, 'Cancel reservation', 'Rezervasyonu iptal et')}
        variant="danger"
        withReason
        reasonPlaceholder={t(locale, 'Reason (optional)', 'Sebep (isteğe bağlı)')}
        loading={cancellingId === cancelModal}
        onConfirm={confirmCancel}
        onClose={() => setCancelModal(null)}
      />
    )}
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t(locale, 'My Reservations', 'Rezervasyonlarım')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t(locale, 'See all the slots you have booked.', 'Ayırttığınız tüm saatleri gör.')}</p>
        </div>

        {loading && (
          <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">{t(locale, 'Loading reservations...', 'Rezervasyonlar yükleniyor...')}</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
            <p className="font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length === 0 && (
          <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-gray-700 dark:text-gray-300">{t(locale, 'You do not have any reservations yet.', 'Henüz bir rezervasyonunuz yok.')}</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {tabButton('upcoming', t(locale, 'Upcoming', 'Yaklaşan'), upcoming.length)}
              {tabButton('past', t(locale, 'Past', 'Geçmiş'), past.length)}
            </div>

            {visibleList.length === 0 ? (
              <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300">{t(locale, 'Nothing to show here.', 'Burada gösterilecek bir şey yok.')}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {visibleList.map((reservation) => {
                  const displayStatus = effectiveStatus(reservation.status, reservation.time_slots?.slot_date)
                  const isPast = dateBucket(reservation.time_slots?.slot_date) === 'past'

                  return (
                    <div key={reservation.id} className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {reservation.astroturfs?.name || t(locale, 'Astroturf', 'Halı Saha')}
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {reservation.astroturfs?.address || t(locale, 'No address', 'Adres yok')}
                          </p>

                          <div className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                            <p>
                              <span className="font-semibold">{t(locale, 'Date:', 'Tarih:')}</span>{' '}
                              {formatDateLabel(reservation.time_slots?.slot_date || '', locale)}
                            </p>
                            <p>
                              <span className="font-semibold">{t(locale, 'Time:', 'Saat:')}</span>{' '}
                              {formatTime(reservation.time_slots?.start_time)} – {formatTime(reservation.time_slots?.end_time)}
                            </p>
                            <p>
                              <span className="font-semibold">{t(locale, 'Price:', 'Ücret:')}</span> {reservation.total_price} TL
                            </p>
                          </div>

                          {reservation.status === 'cancelled' && reservation.cancelled_by && (
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              {locale === 'tr'
                                ? `${translateCancellationActor(locale, reservation.cancelled_by)} tarafindan iptal edildi`
                                : `Cancelled by ${translateCancellationActor(locale, reservation.cancelled_by)}`}
                              {reservation.cancellation_reason ? ` — "${reservation.cancellation_reason}"` : ''}
                            </p>
                          )}

                          {/* Review seçtion — only for past confirmed reservations */}
                          {isPast && reservation.status === 'confirmed' && (() => {
                            const submitted = submittedReviews[reservation.id]
                            const alreadyReviewed = reviewedIds.has(reservation.id)

                            if (submitted) {
                              return (
                                <div className="mt-4 border-t dark:border-gray-700 pt-4">
                                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">{t(locale, 'Review submitted', 'Yorum gönderildi')}</p>
                                  <StarRating value={submitted.rating} size="sm" />
                                  {submitted.comment && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{submitted.comment}</p>
                                  )}
                                </div>
                              )
                            }

                            if (alreadyReviewed) {
                              return (
                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-4">
                                  {t(locale, 'You have already reviewed this visit.', 'Bu ziyaret için zaten yorum bıraktın.')}
                                </p>
                              )
                            }

                            if (reviewingId === reservation.id) {
                              return (
                                <ReviewForm
                                  reservationId={reservation.id}
                                  astroturfId={reservation.astroturf_id}
                                  onSuccess={(rating, comment) => handleReviewSuccess(reservation.id, rating, comment)}
                                  onCancel={() => setReviewingId(null)}
                                />
                              )
                            }

                            return (
                              <button
                                onClick={() => setReviewingId(reservation.id)}
                                className="mt-4 rounded-xl border border-green-800 px-4 py-2 text-sm font-medium text-green-800 dark:text-green-400 hover:bg-green-800/10 transition"
                              >
                                {t(locale, 'Leave a review', 'Yorum birak')}
                              </button>
                            )
                          })()}
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(displayStatus)}`}>
                            {translateStatus(locale, displayStatus)}
                          </span>
                          <span className="rounded-full bg-gray-200 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {translatePaymentStatus(locale, reservation.payment_status)}
                          </span>

                          {!isPast &&
                            reservation.status !== 'cancelled' &&
                            reservation.status !== 'completed' &&
                            reservation.status !== 'rejected' && (
                              <button
                                onClick={() => handleCancel(reservation.id)}
                                disabled={cancellingId === reservation.id}
                                className="mt-2 rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {cancellingId === reservation.id ? t(locale, 'Cancelling...', 'İptal ediliyor...') : t(locale, 'Cancel', 'İptal et')}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
    </>
  )
}
