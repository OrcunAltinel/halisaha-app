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
  todayStr as getTodayStr,
} from '@/lib/date-helpers'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastProvider'
import FootballLoader from '@/components/FootballLoader'
import { getIntlLocale, t, translateCancellationActor, translateStatus } from '@/lib/locale'
import { useLocale } from '@/components/LocaleProvider'

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
  user_profiles: { name: string | null; surname: string | null; phone: string | null } | null
}

type TurfInfo = {
  id: string
  name: string
  address: string
  price_per_hour: number
}

type TimeSlotRow = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
}

function shiftDate(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AdminTurfPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const params = useParams<{ turfId: string }>()
  const turfId = params.turfId

  const [userId, setUserId] = useState<string | null>(null)
  const [turf, setTurf] = useState<TurfInfo | null>(null)
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [deletingTurf, setDeletingTurf] = useState(false)
  const [modal, setModal] = useState<
    | { type: 'reject' | 'cancel'; reservationId: string }
    | { type: 'deleteTurf' }
    | null
  >(null)
  const [calendarStart, setCalendarStart] = useState('')
  const [todayDate, setTodayDate] = useState('')
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const { showToast } = useToast()

  // Time slots for current calendar week
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([])

  // Reserve-slot modal (admin walk-in booking)
  const [blockModal, setBlockModal] = useState<{ slotId: string; date: string; hour: number } | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [blocking, setBlocking] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  // Relocate reservation modal
  const [relocateModal, setRelocateModal] = useState<{ reservationId: string } | null>(null)
  const [relocateDate, setRelocateDate] = useState('')
  const [relocateSlots, setRelocateSlots] = useState<TimeSlotRow[]>([])
  const [relocateSelectedSlot, setRelocateSelectedSlot] = useState<string | null>(null)
  const [relocateLoading, setRelocateLoading] = useState(false)
  const [relocateSlotsLoading, setRelocateSlotsLoading] = useState(false)
  const [relocateError, setRelocateError] = useState<string | null>(null)

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
      // Not in astroturf_admins — check if super admin and auto-grant access
      const { data: superRow } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!superRow) {
        setErrorMessage(t(locale, 'You do not have access to this turf.', 'Bu sahaya erişim yetkin yok.'))
        setLoading(false)
        return
      }

      const { error: grantError } = await supabase.rpc('super_admin_grant_access', {
        p_super_admin_user_id: user.id,
        p_astroturf_id: turfId,
      })
      if (grantError) {
        setErrorMessage(grantError.message)
        setLoading(false)
        return
      }
    }

    const { data: turfData, error: turfError } = await supabase
      .from('astroturfs')
      .select('id, name, address, price_per_hour')
      .eq('id', turfId)
      .single()

    if (turfError || !turfData) {
      setErrorMessage(t(locale, 'Turf not found.', 'Saha bulunamadı.'))
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
      .select('user_id, name, surname, phone')
      .in('user_id', uniqueUserIds)

    const profileMap: Record<string, { name: string | null; surname: string | null; phone: string | null }> = {}
    for (const p of profilesData ?? []) {
      profileMap[p.user_id] = { name: p.name, surname: p.surname, phone: p.phone ?? null }
    }

    setReservations(
      rows.map((r) => ({
        ...r,
        user_profiles: profileMap[r.user_id] ?? { name: null, surname: null },
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    const today = getTodayStr()
    setTodayDate(today)
    setCalendarStart(today)
  }, [])

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
    if (!modal || modal.type !== 'reject' || !userId) return
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
    showToast(t(locale, 'Booking rejected.', 'Rezervasyon reddedildi.'))
  }

  const handleAdminCancel = (reservationId: string) => {
    setModal({ type: 'cancel', reservationId })
  }

  const handleDeleteTurf = () => {
    setModal({ type: 'deleteTurf' })
  }

  const confirmAdminCancel = async (reason?: string) => {
    if (!modal || modal.type !== 'cancel' || !userId) return
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
    showToast(t(locale, 'Reservation cancelled.', 'Rezervasyon iptal edildi.'))
  }

  const confirmDeleteTurf = async () => {
    setDeletingTurf(true)

    const response = await fetch(`/api/admin/turfs/${turfId}`, {
      method: 'DELETE',
    })

    const json = (await response.json().catch(() => null)) as { error?: string } | null

    setDeletingTurf(false)
    setModal(null)

    if (!response.ok) {
      showToast(
        json?.error ?? t(locale, 'Failed to delete turf.', 'Saha silinemedi.'),
        'error'
      )
      return
    }

    showToast(t(locale, 'Turf deleted.', 'Saha silindi.'))
    router.push('/admin')
    router.refresh()
  }

  const handleSavePrice = async () => {
    if (!userId || !turf) return
    const parsed = Number(newPrice)
    if (isNaN(parsed) || parsed < 0) {
      setPriceMessage(t(locale, 'Enter a valid non-negative number.', 'Geçerli ve negatif olmayan bir sayı gir.'))
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
    setPriceMessage(t(locale, 'Price updated.', 'Ücret güncellendi.'))
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
        t(locale, 'Opening hour must be 0-23, closing hour must be 1-24, and opening < closing.', 'Açılış saati 0-23, kapanış saati 1-24 arasında olmalı ve açılış < kapanış olmalıdır.')
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

    setGeneratorMessage(locale === 'tr' ? `${data ?? 0} yeni saat oluşturuldu.` : `Created ${data ?? 0} new slots.`)
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
      setGeneratorMessage(t(locale, 'Please pick a date.', 'Lütfen bir tarih seç.'))
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
    if (!calendarStart) return []

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(calendarStart + 'T00:00:00')
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }, [calendarStart])

  useEffect(() => {
    if (!turfId || calendarDates.length === 0) return
    const supabase = createSupabaseBrowserClient()
    supabase
      .from('time_slots')
      .select('id, slot_date, start_time, end_time, is_available')
      .eq('astroturf_id', turfId)
      .in('slot_date', calendarDates)
      .then(({ data }) => setTimeSlots(data ?? []))
  }, [turfId, calendarDates])

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
    for (const s of timeSlots) {
      const h = parseInt(s.start_time.split(':')[0], 10)
      if (h < min) min = h
      if (h > max) max = h
    }
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [reservations, timeSlots])

  const slotMap = useMemo(() => {
    const map: Record<string, Record<number, TimeSlotRow>> = {}
    for (const s of timeSlots) {
      const hour = parseInt(s.start_time.split(':')[0], 10)
      if (!map[s.slot_date]) map[s.slot_date] = {}
      map[s.slot_date][hour] = s
    }
    return map
  }, [timeSlots])

  const shortDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(getIntlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const scheduledReservations = useMemo(
    () => reservations.filter((r) => r.status !== 'pending' && r.time_slots?.slot_date),
    [reservations]
  )

  const selectedReservation = useMemo(
    () => reservations.find((r) => r.id === selectedReservationId) ?? null,
    [reservations, selectedReservationId]
  )

  const changeCalendarWeek = (days: number) => {
    if (!calendarStart) return
    setCalendarStart(shiftDate(calendarStart, days))
  }

  const refreshTimeSlots = async (dates: string[]) => {
    if (!turfId || dates.length === 0) return
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from('time_slots')
      .select('id, slot_date, start_time, end_time, is_available')
      .eq('astroturf_id', turfId)
      .in('slot_date', dates)
    setTimeSlots(data ?? [])
  }

  const handleBlockSlot = async () => {
    if (!blockModal || !turf || !userId) return
    setBlocking(true)
    setBlockError(null)
    const res = await fetch('/api/admin/block-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time_slot_id: blockModal.slotId,
        astroturf_id: turf.id,
        customer_name: customerName.trim() || null,
      }),
    })
    const json = await res.json()
    setBlocking(false)
    if (!res.ok) {
      setBlockError(json.error ?? t(locale, 'Failed to reserve slot', 'Saat rezerve edilemedi'))
      return
    }
    setBlockModal(null)
    setCustomerName('')
    await loadData()
    await refreshTimeSlots(calendarDates)
  }

  const openRelocateModal = (reservationId: string) => {
    setRelocateModal({ reservationId })
    setRelocateDate('')
    setRelocateSlots([])
    setRelocateSelectedSlot(null)
    setRelocateError(null)
  }

  const fetchRelocateSlots = async (date: string) => {
    if (!turfId) return
    setRelocateDate(date)
    setRelocateSelectedSlot(null)
    setRelocateError(null)
    if (!date) { setRelocateSlots([]); return }

    const supabase = createSupabaseBrowserClient()
    setRelocateSlotsLoading(true)
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, slot_date, start_time, end_time, is_available')
      .eq('astroturf_id', turfId)
      .eq('slot_date', date)
      .eq('is_available', true)
      .order('start_time', { ascending: true })
    setRelocateSlotsLoading(false)
    if (error) { setRelocateError(error.message); return }
    setRelocateSlots(data ?? [])
  }

  const handleRelocate = async () => {
    if (!relocateModal || !relocateSelectedSlot || !userId) return
    const supabase = createSupabaseBrowserClient()
    setRelocateLoading(true)
    setRelocateError(null)

    const { error } = await supabase.rpc('admin_relocate_reservation', {
      p_reservation_id: relocateModal.reservationId,
      p_new_time_slot_id: relocateSelectedSlot,
      p_admin_user_id: userId,
    })

    setRelocateLoading(false)

    if (error) {
      setRelocateError(error.message)
      return
    }

    setRelocateModal(null)
    setSelectedReservationId(null)
    showToast(t(locale, 'Reservation relocated.', 'Rezervasyon taşındı.'))
    await loadData()
    await refreshTimeSlots(calendarDates)
  }

  return (
    <>
    {modal?.type === 'reject' && (
      <ConfirmModal
        title={t(locale, 'Reject booking request?', 'Rezervasyon talebini reddet?')}
        message={t(locale, 'This will reject the reservation and free up the time slot.', 'Bu işlem rezervasyonu reddeder ve saati boşa çıkarır.')}
        confirmLabel={t(locale, 'Reject', 'Reddet')}
        variant="danger"
        loading={actingId === modal.reservationId}
        onConfirm={confirmReject}
        onClose={() => setModal(null)}
      />
    )}
    {modal?.type === 'cancel' && (
      <ConfirmModal
        title={t(locale, 'Cancel reservation?', 'Rezervasyonu iptal et?')}
        message={t(locale, 'This will cancel the confirmed reservation and free up the time slot.', 'Bu işlem onaylı rezervasyonu iptal eder ve saati boşa çıkarır.')}
        confirmLabel={t(locale, 'Cancel reservation', 'Rezervasyonu iptal et')}
        variant="danger"
        withReason
        reasonPlaceholder={t(locale, 'Reason for cancellation (optional)', 'İptal nedeni (isteğe bağlı)')}
        loading={actingId === modal.reservationId}
        onConfirm={confirmAdminCancel}
        onClose={() => setModal(null)}
      />
    )}
    {modal?.type === 'deleteTurf' && (
      <ConfirmModal
        title={t(locale, 'Delete this turf?', 'Bu sahayı sil?')}
        message={t(
          locale,
          'This will remove the turf from the app and revoke all admin access to it.',
          'Bu işlem sahayı uygulamadan kaldırır ve tüm yönetici erişimini iptal eder.'
        )}
        confirmLabel={t(locale, 'Delete turf', 'Sahayı sil')}
        variant="danger"
        loading={deletingTurf}
        onConfirm={confirmDeleteTurf}
        onClose={() => setModal(null)}
      />
    )}

    {/* Reserve slot modal (admin walk-in booking) */}
    {blockModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t(locale, 'Reserve this slot', 'Bu saati rezerve et')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {shortDateLabel(blockModal.date)}
            {' · '}
            {String(blockModal.hour).padStart(2, '0')}:00 – {String(blockModal.hour + 1).padStart(2, '0')}:00
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t(locale, 'Customer name', 'Müşteri adı')}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBlockSlot()}
              autoFocus
              placeholder={t(locale, 'e.g. Ali Yılmaz', 'ör. Ali Yılmaz')}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          {blockError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{blockError}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setBlockModal(null); setCustomerName(''); setBlockError(null) }}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t(locale, 'Cancel', 'İptal')}
            </button>
            <button
              onClick={handleBlockSlot}
              disabled={blocking}
              className="flex-1 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition disabled:opacity-50"
            >
              {blocking ? t(locale, 'Reserving…', 'Rezerve ediliyor…') : t(locale, 'Confirm reservation', 'Rezervasyonu onayla')}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Relocate reservation modal */}
    {relocateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t(locale, 'Relocate reservation', 'Rezervasyonu taşı')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {t(locale, 'Pick a new date and available time slot.', 'Yeni bir tarih ve müsait saat seç.')}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t(locale, 'New date', 'Yeni tarih')}
            </label>
            <input
              type="date"
              value={relocateDate}
              onChange={(e) => fetchRelocateSlots(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {relocateDate && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t(locale, 'Available slots', 'Müsait saatler')}
              </label>
              {relocateSlotsLoading ? (
                <p className="text-sm text-gray-400">{t(locale, 'Loading…', 'Yükleniyor…')}</p>
              ) : relocateSlots.length === 0 ? (
                <p className="text-sm text-gray-400">{t(locale, 'No available slots on this date.', 'Bu tarihte müsait saat yok.')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {relocateSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setRelocateSelectedSlot(slot.id === relocateSelectedSlot ? null : slot.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        relocateSelectedSlot === slot.id
                          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {relocateError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{relocateError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setRelocateModal(null)}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t(locale, 'Cancel', 'İptal')}
            </button>
            <button
              onClick={handleRelocate}
              disabled={!relocateSelectedSlot || relocateLoading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {relocateLoading
                ? t(locale, 'Moving…', 'Taşınıyor…')
                : t(locale, 'Relocate', 'Taşı')}
            </button>
          </div>
        </div>
      </div>
    )}

    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          {t(locale, '← Back to admin home', '← Yönetim ana sayfasına dön')}
        </Link>

        {loading && (
          <div className="mt-6 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <FootballLoader message={t(locale, 'Loading pitch data…', 'Saha verileri yükleniyor…')} />
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{turf.name}</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{turf.address}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteTurf}
                  disabled={deletingTurf}
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {deletingTurf ? t(locale, 'Deleting...', 'Siliniyor...') : t(locale, 'Delete turf', 'Sahayı sil')}
                </button>
              </div>
            </div>

            {/* Price settings */}
            <section className="mb-10 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t(locale, 'Turf Settings', 'Saha Ayarları')}</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(locale, 'Hourly price (TL)', 'Saatlik ücret (TL)')}
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
                  {savingPrice ? t(locale, 'Saving...', 'Kaydediliyor...') : t(locale, 'Save price', 'Ücreti kaydet')}
                </button>
              </div>
              {priceMessage && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{priceMessage}</p>}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {locale === 'tr' ? `Mevcut ücret: ${turf.price_per_hour} TL/saat` : `Current price: ${turf.price_per_hour} TL/hour`}
              </p>
            </section>

            {/* Slot generator */}
            <section className="mb-10 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t(locale, 'Slot Generator', 'Saat Üretici')}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t(locale, 'Set your opening hours and create 1-hour time slots. Existing slots are skipped.', 'Açılış saatlerini belirle ve 1 saatlik zaman dilimleri oluştur. Var olan saatler atlanır.')}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(locale, 'Opening hour (0–23)', 'Açılış saati (0–23)')}
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
                    {t(locale, 'Closing hour (1–24)', 'Kapanış saati (1–24)')}
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
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t(locale, 'Bulk: next 30 days', 'Toplu: sonraki 30 gün')}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t(locale, 'Generates slots from today through 30 days ahead.', 'Bugünden itibaren 30 günlük saatler oluşturur.')}
                  </p>
                  <button
                    onClick={handleBulkGenerate}
                    disabled={generating}
                    className="mt-3 rounded-xl bg-gray-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {generating ? t(locale, 'Generating...', 'Oluşturuluyor...') : t(locale, 'Generate next 30 days', 'Sonraki 30 günü oluştur')}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t(locale, 'Single day', 'Tek gün')}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t(locale, 'Pick one specific date to generate slots for.', 'Saat oluşturmak için belirli bir tarih seç.')}
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t(locale, 'Date', 'Tarih')}</label>
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
                      {generating ? t(locale, 'Generating...', 'Oluşturuluyor...') : t(locale, 'Generate for date', 'Tarih için oluştur')}
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
                {t(locale, 'Pending Requests', 'Bekleyen Talepler')} ({pendingReservations.length})
              </h2>

              {pendingReservations.length === 0 && (
                <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300">{t(locale, 'No pending requests.', 'Bekleyen talep yok.')}</p>
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
                            {locale === 'tr' ? `Rezervasyon #${r.id.slice(0, 8)}` : `Reservation #${r.id.slice(0, 8)}`}
                            {isPastPending && (
                              <span className="ml-2 rounded-full bg-orange-200 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-400">
                                {t(locale, 'past date', 'geçmiş tarih')}
                              </span>
                            )}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                            <p>
                              <span className="font-semibold">{t(locale, 'Date:', 'Tarih:')}</span>{' '}
                              {formatDateLabel(r.time_slots?.slot_date || '', locale)}
                            </p>
                            <p>
                              <span className="font-semibold">{t(locale, 'Time:', 'Saat:')}</span>{' '}
                              {formatTime(r.time_slots?.start_time)} –{' '}
                              {formatTime(r.time_slots?.end_time)}
                            </p>
                            <p>
                              <span className="font-semibold">{t(locale, 'Price:', 'Ücret:')}</span>{' '}
                              {r.total_price} TL
                            </p>
                            <p>
                              <span className="font-semibold">{t(locale, 'Customer:', 'Müşteri:')}</span>{' '}
                              {r.user_profiles?.name
                                ? `${r.user_profiles.name} ${r.user_profiles.surname ?? ''}`.trim()
                                : <span className="text-gray-400 dark:text-gray-500">{t(locale, 'No name set', 'İsim girilmemiş')}</span>}
                            </p>
                            {r.user_profiles?.phone && (
                              <p>
                                <span className="font-semibold">{t(locale, 'Phone:', 'Telefon:')}</span>{' '}
                                {r.user_profiles.phone}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {t(locale, 'Ref.', 'Ref.')} #{r.id.slice(0, 8).toUpperCase()}
                              {' · '}
                              {new Date(r.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(
                              r.status
                            )}`}
                          >
                            {translateStatus(locale, r.status)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actingId === r.id}
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actingId === r.id ? '...' : t(locale, 'Approve', 'Onayla')}
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actingId === r.id}
                              className="rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                              {t(locale, 'Reject', 'Reddet')}
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
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t(locale, 'Reservations', 'Rezervasyonlar')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t(
                      locale,
                      'Review confirmed, cancelled, rejected, and completed bookings by week.',
                      'Onaylanmış, iptal edilmiş, reddedilmiş ve tamamlanmış rezervasyonları haftalık görünümde incele.'
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => changeCalendarWeek(-7)}
                    disabled={!calendarStart}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t(locale, 'Previous week', 'Önceki hafta')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (todayDate) setCalendarStart(todayDate)
                    }}
                    disabled={!todayDate}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t(locale, 'This week', 'Bu hafta')}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeCalendarWeek(7)}
                    disabled={!calendarStart}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t(locale, 'Next week', 'Sonraki hafta')}
                  </button>
                </div>
              </div>

              {scheduledReservations.length === 0 && timeSlots.length === 0 ? (
                <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    {t(locale, 'No processed reservations yet.', 'Henüz işlenmiş rezervasyon yok.')}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 w-16 min-w-[64px] border-r bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400" />
                          {calendarDates.map((date) => (
                            <th
                              key={date}
                              className={`min-w-[110px] border-r px-2 py-2 text-center text-xs font-semibold dark:border-gray-800 ${
                                date === todayDate
                                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-50 text-gray-600 dark:bg-gray-900/60 dark:text-gray-400'
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
                            <td className="sticky left-0 z-10 border-r bg-gray-50 px-3 py-2 font-mono text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
                              {String(hour).padStart(2, '0')}:00
                            </td>
                            {calendarDates.map((date) => {
                              const reservation = reservationMap[date]?.[hour]
                              const slot = slotMap[date]?.[hour]
                              const isSelected = selectedReservationId === reservation?.id
                              const cellStatus = reservation
                                ? effectiveStatus(reservation.status, reservation.time_slots?.slot_date)
                                : null

                              let cellColor: string
                              let clickHandler: (() => void) | undefined

                              if (reservation) {
                                if (cellStatus === 'confirmed') {
                                  cellColor = `cursor-pointer bg-green-100 text-green-800 hover:brightness-95 dark:bg-green-900/40 dark:text-green-300 ${isSelected ? 'ring-2 ring-inset ring-green-500' : ''}`
                                } else if (cellStatus === 'cancelled' || cellStatus === 'rejected') {
                                  cellColor = `cursor-pointer bg-red-100 text-red-600 hover:brightness-95 dark:bg-red-900/30 dark:text-red-400 ${isSelected ? 'ring-2 ring-inset ring-red-400' : ''}`
                                } else {
                                  cellColor = `cursor-pointer bg-gray-200 text-gray-600 hover:brightness-95 dark:bg-gray-700 dark:text-gray-400 ${isSelected ? 'ring-2 ring-inset ring-gray-400' : ''}`
                                }
                                clickHandler = () => setSelectedReservationId(isSelected ? null : reservation.id)
                              } else if (slot?.is_available) {
                                cellColor = 'cursor-pointer bg-white dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-900/10'
                                clickHandler = () => setBlockModal({ slotId: slot.id, date, hour })
                              } else {
                                cellColor = 'bg-white dark:bg-gray-900'
                                clickHandler = undefined
                              }

                              return (
                                <td
                                  key={date}
                                  onClick={clickHandler}
                                  className={`border-r px-2 py-1.5 text-center align-middle transition dark:border-gray-800 ${cellColor}`}
                                >
                                  {reservation ? (
                                    <span className="block truncate text-xs font-semibold leading-tight">
                                      {translateStatus(locale, cellStatus ?? reservation.status)}
                                    </span>
                                  ) : slot?.is_available ? (
                                    <span className="block text-xs text-gray-300 dark:text-gray-600 select-none">+</span>
                                  ) : null}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedReservation && (
                    <div className="flex flex-col gap-4 border-t px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
                        <p className="text-base font-semibold">
                          {formatDateLabel(selectedReservation.time_slots?.slot_date || '', locale)}
                          {' · '}
                          {formatTime(selectedReservation.time_slots?.start_time)} –{' '}
                          {formatTime(selectedReservation.time_slots?.end_time)}
                        </p>

                        {/* Customer info */}
                        <p>
                          <span className="font-semibold">{t(locale, 'Customer:', 'Müşteri:')}</span>{' '}
                          {selectedReservation.user_profiles?.name
                            ? `${selectedReservation.user_profiles.name} ${selectedReservation.user_profiles.surname ?? ''}`.trim()
                            : <span className="text-gray-400">{t(locale, 'No name set', 'İsim girilmemiş')}</span>}
                        </p>
                        {selectedReservation.user_profiles?.phone && (
                          <p>
                            <span className="font-semibold">{t(locale, 'Phone:', 'Telefon:')}</span>{' '}
                            {selectedReservation.user_profiles.phone}
                          </p>
                        )}

                        {/* Walk-in customer name stored in cancellation_reason */}
                        {selectedReservation.status === 'confirmed' && selectedReservation.cancellation_reason && !selectedReservation.user_profiles?.name && (
                          <p>
                            {t(locale, 'Walk-in customer', 'Kapıdan müşteri')}: <span className="font-semibold">{selectedReservation.cancellation_reason}</span>
                          </p>
                        )}

                        <p>
                          <span className="font-semibold">{t(locale, 'Price:', 'Ücret:')}</span>{' '}
                          ₺{selectedReservation.total_price}
                        </p>

                        <p>
                          <span className="font-semibold">{t(locale, 'Payment:', 'Ödeme:')}</span>{' '}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            selectedReservation.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : selectedReservation.payment_status === 'refunded'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {selectedReservation.payment_status}
                          </span>
                        </p>

                        {selectedReservation.status === 'cancelled' && selectedReservation.cancelled_by && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {locale === 'tr'
                              ? `${translateCancellationActor(locale, selectedReservation.cancelled_by)} tarafından iptal edildi`
                              : `Cancelled by ${translateCancellationActor(locale, selectedReservation.cancelled_by)}`}
                            {selectedReservation.cancellation_reason ? ` — "${selectedReservation.cancellation_reason}"` : ''}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {t(locale, 'Ref.', 'Ref.')} #{selectedReservation.id.slice(0, 8).toUpperCase()}
                          {' · '}
                          {new Date(selectedReservation.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                            effectiveStatus(selectedReservation.status, selectedReservation.time_slots?.slot_date)
                          )}`}
                        >
                          {translateStatus(
                            locale,
                            effectiveStatus(selectedReservation.status, selectedReservation.time_slots?.slot_date)
                          )}
                        </span>
                        {selectedReservation.status === 'confirmed' &&
                          dateBucket(selectedReservation.time_slots?.slot_date) !== 'past' && (
                            <>
                              <button
                                onClick={() => openRelocateModal(selectedReservation.id)}
                                className="rounded-xl border border-blue-300 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                {t(locale, 'Relocate', 'Taşı')}
                              </button>
                              <button
                                onClick={() => handleAdminCancel(selectedReservation.id)}
                                disabled={actingId === selectedReservation.id}
                                className="rounded-xl border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                {actingId === selectedReservation.id
                                  ? '...'
                                  : t(locale, 'Cancel reservation', 'Rezervasyonu iptal et')}
                              </button>
                            </>
                          )}
                        <button
                          onClick={() => setSelectedReservationId(null)}
                          className="rounded-xl border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
    </>
  )
}
