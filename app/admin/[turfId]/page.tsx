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
}

type TurfInfo = {
  id: string
  name: string
  address: string
  price_per_hour: number
}

type TabKey = 'past' | 'today' | 'upcoming'

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
  const [activeTab, setActiveTab] = useState<TabKey>('today')

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

    setReservations((resData || []) as unknown as AdminReservation[])
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
      alert(error.message)
      setActingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'confirmed' } : r))
    )
    setActingId(null)
  }

  const handleReject = async (reservationId: string) => {
    if (!userId) return
    if (!window.confirm('Reject this booking request?')) return
    const supabase = createSupabaseBrowserClient()
    setActingId(reservationId)

    const { error } = await supabase.rpc('reject_reservation', {
      p_reservation_id: reservationId,
      p_admin_user_id: userId,
    })

    if (error) {
      alert(error.message)
      setActingId(null)
      return
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'rejected' } : r))
    )
    setActingId(null)
  }

  const handleAdminCancel = async (reservationId: string) => {
    if (!userId) return
    const reason = window.prompt('Reason for cancellation? (optional)')
    if (reason === null) return
    const supabase = createSupabaseBrowserClient()
    setActingId(reservationId)

    const { error } = await supabase.rpc('admin_cancel_reservation', {
      p_reservation_id: reservationId,
      p_admin_user_id: userId,
      p_reason: reason || null,
    })

    if (error) {
      alert(error.message)
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
    if (status === 'confirmed') return 'bg-green-100 text-green-700'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    if (status === 'cancelled') return 'bg-red-100 text-red-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    if (status === 'completed') return 'bg-gray-100 text-gray-600'
    return 'bg-blue-100 text-blue-700'
  }

  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'pending'),
    [reservations]
  )

  const bucketed = useMemo(() => {
    const past: AdminReservation[] = []
    const today: AdminReservation[] = []
    const upcoming: AdminReservation[] = []

    for (const r of reservations) {
      if (r.status === 'pending') continue
      const bucket = dateBucket(r.time_slots?.slot_date)
      if (bucket === 'past') past.push(r)
      else if (bucket === 'today') today.push(r)
      else upcoming.push(r)
    }

    return { past, today, upcoming }
  }, [reservations])

  const visibleList = bucketed[activeTab]

  const renderReservationCard = (r: AdminReservation) => {
    const displayStatus = effectiveStatus(r.status, r.time_slots?.slot_date)

    return (
      <div key={r.id} className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-800">
            <p>
              <span className="font-semibold">
                {formatDateLabel(r.time_slots?.slot_date || '')}
              </span>{' '}
              {formatTime(r.time_slots?.start_time)} – {formatTime(r.time_slots?.end_time)}
            </p>
            <p className="text-gray-600">
              {r.total_price} TL · user {r.user_id.slice(0, 8)}...
            </p>
            {r.status === 'cancelled' && r.cancelled_by && (
              <p className="mt-1 text-xs text-gray-500">
                Cancelled by {r.cancelled_by}
                {r.cancellation_reason ? ` — "${r.cancellation_reason}"` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(
                displayStatus
              )}`}
            >
              {displayStatus}
            </span>
            {r.status === 'confirmed' && dateBucket(r.time_slots?.slot_date) !== 'past' && (
              <button
                onClick={() => handleAdminCancel(r.id)}
                disabled={actingId === r.id}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {actingId === r.id ? '...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const tabButton = (key: TabKey, label: string, count: number) => {
    const isActive = activeTab === key
    return (
      <button
        onClick={() => setActiveTab(key)}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          isActive ? 'bg-gray-900 text-white' : 'border text-gray-700 hover:bg-gray-100'
        }`}
      >
        {label} ({count})
      </button>
    )
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to admin home
        </Link>

        {loading && (
          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-base font-medium text-gray-700">Loading...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && turf && (
          <>
            <div className="mt-4 mb-8">
              <h1 className="text-4xl font-bold text-gray-900">{turf.name}</h1>
              <p className="mt-2 text-gray-600">{turf.address}</p>
            </div>

            {/* Price settings */}
            <section className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Turf Settings</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Hourly price (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900"
                  />
                </div>
                <button
                  onClick={handleSavePrice}
                  disabled={savingPrice}
                  className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {savingPrice ? 'Saving...' : 'Save price'}
                </button>
              </div>
              {priceMessage && <p className="mt-3 text-sm text-gray-700">{priceMessage}</p>}
              <p className="mt-3 text-xs text-gray-500">
                Current price: {turf.price_per_hour} TL/hour
              </p>
            </section>

            {/* Slot generator */}
            <section className="mb-10 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Slot Generator</h2>
              <p className="mt-1 text-sm text-gray-600">
                Set your opening hours and create 1-hour time slots. Existing slots are skipped.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Opening hour (0–23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Closing hour (1–24)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={closeHour}
                    onChange={(e) => setCloseHour(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Bulk: next 30 days</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Generates slots from today through 30 days ahead.
                  </p>
                  <button
                    onClick={handleBulkGenerate}
                    disabled={generating}
                    className="mt-3 rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate next 30 days'}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800">Single day</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pick one specific date to generate slots for.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 text-gray-900"
                      />
                    </div>
                    <button
                      onClick={handleSingleDayGenerate}
                      disabled={generating}
                      className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      {generating ? 'Generating...' : 'Generate for date'}
                    </button>
                  </div>
                </div>
              </div>

              {generatorMessage && (
                <p className="mt-4 text-sm text-gray-700">{generatorMessage}</p>
              )}
            </section>

            {/* Pending requests (all) */}
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                Pending Requests ({pendingReservations.length})
              </h2>

              {pendingReservations.length === 0 && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <p className="text-gray-700">No pending requests.</p>
                </div>
              )}

              <div className="grid gap-4">
                {pendingReservations.map((r) => {
                  const isPastPending = dateBucket(r.time_slots?.slot_date) === 'past'
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border bg-white p-6 shadow-sm ${
                        isPastPending ? 'border-orange-300 bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            Reservation #{r.id.slice(0, 8)}
                            {isPastPending && (
                              <span className="ml-2 rounded-full bg-orange-200 px-2 py-0.5 text-xs font-semibold text-orange-800">
                                past date
                              </span>
                            )}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-800">
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
                            <p className="text-xs text-gray-500">
                              User: {r.user_id.slice(0, 8)}...
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
                              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
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

            {/* Non-pending reservations, bucketed */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Reservations</h2>

              <div className="mb-4 flex flex-wrap gap-2">
                {tabButton('past', 'Past', bucketed.past.length)}
                {tabButton('today', 'Today', bucketed.today.length)}
                {tabButton('upcoming', 'Upcoming', bucketed.upcoming.length)}
              </div>

              {visibleList.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <p className="text-gray-700">No reservations in this tab.</p>
                </div>
              ) : (
                <div className="grid gap-4">{visibleList.map(renderReservationCard)}</div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}