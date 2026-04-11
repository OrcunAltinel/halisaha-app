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

type ReservationRow = {
  id: string
  status: string
  payment_status: string
  total_price: number
  created_at: string
  cancelled_by: string | null
  cancellation_reason: string | null
  astroturfs: { name: string; address: string } | null
  time_slots: { slot_date: string; start_time: string; end_time: string } | null
}

type TabKey = 'upcoming' | 'past'

const supabase = createSupabaseBrowserClient()

export default function MyReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')
  const [cancelModal, setCancelModal] = useState<string | null>(null) // reservationId
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
          id, status, payment_status, total_price, created_at,
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

      setReservations((data || []) as unknown as ReservationRow[])
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
    showToast('Reservation cancelled.')
  }

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    if (status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'completed') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
          isActive ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
        title="Cancel reservation?"
        message="Are you sure you want to cancel this reservation?"
        confirmLabel="Cancel reservation"
        variant="danger"
        withReason
        reasonPlaceholder="Reason (optional)"
        loading={cancellingId === cancelModal}
        onConfirm={confirmCancel}
        onClose={() => setCancelModal(null)}
      />
    )}
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Reservations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">See all the slots you have booked.</p>
        </div>

        {loading && (
          <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">Loading reservations...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
            <p className="font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length === 0 && (
          <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-gray-700 dark:text-gray-300">You do not have any reservations yet.</p>
          </div>
        )}

        {!loading && !errorMessage && reservations.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {tabButton('upcoming', 'Upcoming', upcoming.length)}
              {tabButton('past', 'Past', past.length)}
            </div>

            {visibleList.length === 0 ? (
              <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300">Nothing to show here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {visibleList.map((reservation) => {
                  const displayStatus = effectiveStatus(reservation.status, reservation.time_slots?.slot_date)
                  const isPast = dateBucket(reservation.time_slots?.slot_date) === 'past'

                  return (
                    <div key={reservation.id} className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {reservation.astroturfs?.name || 'Astroturf'}
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {reservation.astroturfs?.address || 'No address'}
                          </p>

                          <div className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                            <p>
                              <span className="font-semibold">Date:</span>{' '}
                              {formatDateLabel(reservation.time_slots?.slot_date || '')}
                            </p>
                            <p>
                              <span className="font-semibold">Time:</span>{' '}
                              {formatTime(reservation.time_slots?.start_time)} – {formatTime(reservation.time_slots?.end_time)}
                            </p>
                            <p>
                              <span className="font-semibold">Price:</span> {reservation.total_price} TL
                            </p>
                          </div>

                          {reservation.status === 'cancelled' && reservation.cancelled_by && (
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              Cancelled by {reservation.cancelled_by}
                              {reservation.cancellation_reason ? ` — "${reservation.cancellation_reason}"` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {reservation.payment_status}
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
                                {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel'}
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