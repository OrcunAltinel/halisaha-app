'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import {
  dateBucket,
  effectiveStatus,
  formatDateLabel,
  formatTime,
} from '@/lib/date-helpers'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastProvider'
import FootballLoader from '@/components/FootballLoader'

type AdminReservation = {
  id: string
  status: string
  payment_status: string
  total_price: number
  created_at: string
  user_id: string
  cancelled_by: string | null
  cancellation_reason: string | null
  time_slots: { slot_date: string; start_time: string; end_time: string } | null
  user_profiles: { username: string | null } | null
}

type TurfInfo = {
  id: string
  name: string
  address: string
  price_per_hour: number
}

export default function AdminTurfPage() {
  const router = useRouter()
  const params = useParams<{ turfId: string }>()
  const turfId = params.turfId

  const [userId, setUserId] = useState<string | null>(null)
  const [turf, setTurf] = useState<TurfInfo | null>(null)
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ type: 'reject' | 'cancel'; reservationId: string } | null>(null)
  const [calendarStart, setCalendarStart] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [selectedRes, setSelectedRes] = useState<AdminReservation | null>(null)
  const { showToast } = useToast()

  // Price editing
  const [newPrice, setNewPrice] = useState<string>('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [priceMessage, setPriceMessage] = useState('')

  // Slot generator
  const [openHour, setOpenHour] = useState<string>('9')
  const [closeHour, setCloseHour] = useState<string>('23')
  const [singleDate, setSingleDate] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatorMessage, setGeneratorMessage] = useState('')

  const loadData = async () => {
    const supabase = createSupabaseBrowserClient()
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/admin/${turfId}`)
      return
    }
    setUserId(user.id)

    const { data: adminRow, error: adminError } = await supabase
      .from('astroturf_admins')
      .select('astroturf_id')
      .eq('user_id', user.id)
      .eq('astroturf_id', turfId)
      .maybeSingle()

    if (adminError || !adminRow) {
      setErrorMessage('You do not have access to this turf.')
      setLoading(false)
      return
    }

    const { data: turfData, error: turfError } = await supabase
      .from('astroturfs')
      .select('id, name, address, price_per_hour')
      .eq('id', turfId)
      .single()

    if (turfError || !turfData) {
      setErrorMessage('Turf not found.')
      setLoading(false)
      return
    }

    setTurf(turfData as TurfInfo)
    setNewPrice(String(turfData.price_per_hour))

    const { data: resData, error: resError } = await supabase
      .from('reservations')
      .select(
        `
        id, status, payment_status, total_price, created_at, user_id,
        cancelled_by, cancellation_reason,
        time_slots ( slot_date, start_time, end_time )
      `
      )
      .eq('astroturf_id', turfId)
      .order('created_at', { ascending: false })

    if (resError) {
      setErrorMessage(resError.message)
      setLoading(false)
      return
    }

    const rows = (resData || []) as unknown as AdminReservation[]

    const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))]
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('user_id, username')
      .in('user_id', uniqueUserIds)

    const usernameMap: Record<string, string | null> = {}
    for (const p of profilesData ?? []) {
      usernameMap[p.user_id] = p.username
    }

    setReservations(
      rows.map((r) => ({
        ...r,
        user_profiles: { username: usernameMap[r.user_id] ?? null },
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turfId])

  const handleApprove = async (reservationId: string) => {
    if (!userId) return
    const supabase = createSupabaseBrowserClient()
    setActingId(reservationId)

    const { error } = await supabase.rpc('approve_reservation', {
      p_reservation_id: reservationId,
      p_admin_user_id: userId,
    })

    if (error) {
      showToast(error.message, 'error')
      setActingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'confirmed' } : r))
    )
    setActingId(null)
  }

  const handleReject = (reservationId: string) => {
    setModal({ type: 'reject', reservationId })
  }

  const confirmReject = async () => {
    if (!modal || !userId) return
    const { reservationId } = modal
    const supabase = createSupabaseBrowserClient()
    setActingId(reservationId)

    const { error } = await supabase.rpc('reject_reservation', {
      p_reservation_id: reservationId,
      p_admin_user_id: userId,
    })

    setModal(null)

    if (error) {
      showToast(error.message, 'error')
      setActingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'rejected' } : r))
    )
    setActingId(null)
    showToast('Booking rejected.')
  }

  const handleAdminCancel = (reservationId: string) => {
    setModal({ type: 'cancel', reservationId })
  }

  const confirmAdminCancel = async (reason?: string) => {
    if (!modal || !userId) return
    const { reservationId } = modal
    const supabase = createSupabaseBrowserClient()
    setActingId(reservationId)

    const { error } = await supabase.rpc('admin_cancel_reservation', {
      p_reservation_id: reservationId,
      p_admin_user_id: userId,
      p_reason: reason || null,
    })

    setModal(null)

    if (error) {
      showToast(error.message, 'error')
      setActingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: 'cancelled',
              cancelled_by: 'admin',
              cancellation_reason: reason || null,
            }
          : r
      )
    )
    setActingId(null)
    showToast('Reservation cancelled.')
  }

  const handleSavePrice = async () => {
    if (!userId || !turf) return
    const parsed = Number(newPrice)
    if (isNaN(parsed) || parsed < 0) {
      setPriceMessage('Enter a valid non-negative number.')
      return
    }

    const supabase = createSupabaseBrowserClient()
    setSavingPrice(true)
    setPriceMessage('')

    const { error } = await supabase.rpc('update_turf_price', {
      p_astroturf_id: turf.id,
      p_admin_user_id: userId,
      p_new_price: parsed,
    })

    setSavingPrice(false)

    if (error) {
      setPriceMessage(error.message)
      return
    }

    setTurf({ ...turf, price_per_hour: parsed })
    setPriceMessage('Price updated.')
  }

  const runGenerator = async (startDate: string, endDate: string) => {
    if (!userId || !turf) return

    const open = Number(openHour)
    const close = Number(closeHour)

    if (
      isNaN(open) ||
      isNaN(close) ||
      open < 0 ||
      open > 23 ||
      close < 1 ||
      close > 24 ||
      open >= close
    ) {
      setGeneratorMessage(
        'Opening hour must be 0-23, closing hour must be 1-24, and opening < closing.'
      )
      return
    }

    const supabase = createSupabaseBrowserClient()
    setGenerating(true)
    setGeneratorMessage('')

    const { data, error } = await supabase.rpc('generate_time_slots', {
      p_astroturf_id: turf.id,
      p_admin_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_open_hour: open,
      p_close_hour: close,
    })

    setGenerating(false)

    if (error) {
      setGeneratorMessage(error.message)
      return
    }

    setGeneratorMessage(`Created ${data ?? 0} new slots.`)
  }

  const handleBulkGenerate = async () => {
    const today = new Date()
    const end = new Date()
    end.setDate(today.getDate() + 29)

    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    await runGenerator(fmt(today), fmt(end))
  }

  const handleSingleDayGenerate = async () => {
    if (!singleDate) {
      setGeneratorMessage('Please pick a date.')
      return
    }
    await runGenerator(singleDate, singleDate)
  }

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    if (status === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (status === 'completed') return 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  }

  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'pending'),
    [reservations]
  )

  const calendarDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(calendarStart + 'T00:00:00')
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }, [calendarStart])

  const reservationMap = useMemo(() => {
    const map: Record<string, Record<number, AdminReservation>> = {}
    for (const r of reservations) {
      if (r.status === 'pending') continue
      const date = r.time_slots?.slot_date
      const startTime = r.time_slots?.start_time
      if (!date || !startTime) continue
      const hour = parseInt(startTime.split(':')[0], 10)
      if (!map[date]) map[date] = {}
      map[date][hour] = r
    }
    return map
  }, [reservations])

  const hourRange = useMemo(() => {
    let min = 9, max = 22
    for (const r of reservations) {
      if (r.status === 'pending' || !r.time_slots?.start_time) continue
      const h = parseInt(r.time_slots.start_time.split(':')[0], 10)
      if (h < min) min = h
      if (h > max) max = h
    }
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [reservations])

  const shiftCalendar = (days: number) => {
    const d = new Date(calendarStart + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setCalendarStart(d.toISOString().split('T')[0])
    setSelectedRes(null)
  }

  const shortDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <>
    {modal?.type === 'reject' && (
      <ConfirmModal
        title="Reject booking request?"
        message="This will reject the reservation and free up the time slot."
        confirmLabel="Reject"
        variant="danger"
        loading={actingId === modal.reservationId}
        onConfirm={confirmReject}
        onClose={() => setModal(null)}
      />
    )}
    {modal?.type === 'cancel' && (
      <ConfirmModal
        title="Cancel reservation?"
        message="This will cancel the confirmed reservation and free up the time slot."
        confirmLabel="Cancel reservation"
        variant="danger"
        withReason
        reasonPlaceholder="Reason for cancellation (optional)"
        loading={actingId === modal.reservationId}
        onConfirm={confirmAdminCancel}
        onClose={() => setModal(null)}
      />
    )}
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          ← Back to admin home
        </Link>

        {loading && (
          <div className="mt-6 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <FootballLoader message="Loading pitch data…" />
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm">
            <p className="font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && turf && (
          <>
            <div className="mt-4 mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{turf.name}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{turf.address}</p>
            </div>

            {/* Price settings */}
            <section className="mb-10 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Turf Settings</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hourly price (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleSavePrice}
                  disabled={savingPrice}
                  className="rounded-xl bg-gray-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
                >
                  {savingPrice ? 'Saving...' : 'Save price'}
                </button>
              </div>
              {priceMessage && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{priceMessage}</p>}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Current price: {turf.price_per_hour} TL/hour
              </p>
            </section>

            {/* Slot generator */}
            <section className="mb-10 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Slot Generator</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Set your opening hours and create 1-hour time slots. Existing slots are skipped.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Opening hour (0–23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Closing hour (1–24)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={closeHour}
                    onChange={(e) => setCloseHour(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bulk: next 30 days</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Generates slots from today through 30 days ahead.
                  </p>
                  <button
                    onClick={handleBulkGenerate}
                    disabled={generating}
                    className="mt-3 rounded-xl bg-gray-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate next 30 days'}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Single day</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Pick one specific date to generate slots for.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                      <input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleSingleDayGenerate}
                      disabled={generating}
                      className="rounded-xl bg-gray-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
                    >
                      {generating ? 'Generating...' : 'Generate for date'}
                    </button>
                  </div>
                </div>
              </div>

              {generatorMessage && (
                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{generatorMessage}</p>
              )}
            </section>

            {/* Pending requests (all) */}
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Pending Requests ({pendingReservations.length})
              </h2>

              {pendingReservations.length === 0 && (
                <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300">No pending requests.</p>
                </div>
              )}

              <div className="grid gap-4">
                {pendingReservations.map((r) => {
                  const isPastPending = dateBucket(r.time_slots?.slot_date) === 'past'
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm ${
                        isPastPending ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20' : 'dark:border-gray-800'
                      }`}
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Reservation #{r.id.slice(0, 8)}
                            {isPastPending && (
                              <span className="ml-2 rounded-full bg-orange-200 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-400">
                                past date
                              </span>
                            )}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                            <p>
                              <span className="font-semibold">Date:</span>{' '}
                              {formatDateLabel(r.time_slots?.slot_date || '')}
                            </p>
                            <p>
                              <span className="font-semibold">Time:</span>{' '}
                              {formatTime(r.time_slots?.start_time)} –{' '}
                              {formatTime(r.time_slots?.end_time)}
                            </p>
                            <p>
                              <span className="font-semibold">Price:</span>{' '}
                              {r.total_price} TL
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              User: {r.user_profiles?.username ?? r.user_id.slice(0, 8) + '…'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(
                              r.status
                            )}`}
                          >
                            {r.status}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actingId === r.id}
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actingId === r.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actingId === r.id}
                              className="rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Reservation calendar */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Reservations</h2>

              <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                {/* Calendar navigation */}
                <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-800">
                  <button
                    onClick={() => shiftCalendar(-7)}
                    className="rounded-xl border dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    ← Prev week
                  </button>
                  <button
                    onClick={() => { setCalendarStart(todayStr); setSelectedRes(null) }}
                    className="rounded-xl px-3 py-1.5 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => shiftCalendar(7)}
                    className="rounded-xl border dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    Next week →
                  </button>
                </div>

                {/* Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="w-16 min-w-[64px] border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 z-10" />
                        {calendarDates.map((date) => (
                          <th
                            key={date}
                            className={`min-w-[110px] border-r dark:border-gray-800 px-2 py-2 text-center text-xs font-semibold ${
                              date === todayStr
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {shortDateLabel(date)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hourRange.map((hour) => (
                        <tr key={hour} className="border-t dark:border-gray-800">
                          <td className="border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-3 py-2 text-xs font-mono text-gray-500 dark:text-gray-400 sticky left-0 z-10">
                            {String(hour).padStart(2, '0')}:00
                          </td>
                          {calendarDates.map((date) => {
                            const r = reservationMap[date]?.[hour]
                            const isSelected = selectedRes?.id === r?.id
                            const cellStatus = r ? effectiveStatus(r.status, r.time_slots?.slot_date) : null

                            const cellColor = !r
                              ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-default'
                              : cellStatus === 'confirmed'
                              ? `cursor-pointer hover:brightness-95 ${isSelected ? 'ring-2 ring-inset ring-green-500' : ''} bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300`
                              : cellStatus === 'pending'
                              ? `cursor-pointer hover:brightness-95 ${isSelected ? 'ring-2 ring-inset ring-yellow-500' : ''} bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300`
                              : cellStatus === 'cancelled' || cellStatus === 'rejected'
                              ? `cursor-pointer hover:brightness-95 ${isSelected ? 'ring-2 ring-inset ring-red-400' : ''} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`
                              : `cursor-pointer hover:brightness-95 ${isSelected ? 'ring-2 ring-inset ring-gray-400' : ''} bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400`

                            return (
                              <td
                                key={date}
                                onClick={() => r && setSelectedRes(isSelected ? null : r)}
                                className={`border-r dark:border-gray-800 px-2 py-1.5 text-center align-middle transition ${cellColor}`}
                              >
                                {r && (
                                  <span className="block truncate text-xs font-semibold leading-tight">
                                    {cellStatus}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detail panel */}
                {selectedRes && (
                  <div className="border-t dark:border-gray-800 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                      <p className="font-semibold text-base">
                        {formatDateLabel(selectedRes.time_slots?.slot_date || '')}
                        {' · '}
                        {formatTime(selectedRes.time_slots?.start_time)} – {formatTime(selectedRes.time_slots?.end_time)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRes.total_price} TL · {selectedRes.user_profiles?.username ?? selectedRes.user_id.slice(0, 8) + '…'}
                      </p>
                      {selectedRes.status === 'cancelled' && selectedRes.cancelled_by && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cancelled by {selectedRes.cancelled_by}
                          {selectedRes.cancellation_reason ? ` — "${selectedRes.cancellation_reason}"` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(effectiveStatus(selectedRes.status, selectedRes.time_slots?.slot_date))}`}>
                        {effectiveStatus(selectedRes.status, selectedRes.time_slots?.slot_date)}
                      </span>
                      {selectedRes.status === 'confirmed' && dateBucket(selectedRes.time_slots?.slot_date) !== 'past' && (
                        <button
                          onClick={() => handleAdminCancel(selectedRes.id)}
                          disabled={actingId === selectedRes.id}
                          className="rounded-xl border border-red-300 dark:border-red-800 px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {actingId === selectedRes.id ? '…' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRes(null)}
                        className="rounded-xl border dark:border-gray-700 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {hourRange.length === 0 && (
                  <p className="px-5 py-6 text-gray-500 dark:text-gray-400 text-sm">No reservations yet.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
    </>
  )
}