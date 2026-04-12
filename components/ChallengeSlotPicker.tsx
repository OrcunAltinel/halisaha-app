'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { formatTime, todayStr } from '@/lib/date-helpers'

type TimeSlot = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
  price: number | null
}

type Props = {
  astroturfId: string
  pricePerHour: number
  onSlotSelected: (slot: {
    id: string
    slot_date: string
    start_time: string
    end_time: string
  }) => void
}

const DAYS_TO_SHOW = 14
const supabase = createSupabaseBrowserClient()

function buildDateStrip(days: number) {
  const result: { dateStr: string; date: Date }[] = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    result.push({ dateStr: `${yyyy}-${mm}-${dd}`, date: d })
  }
  return result
}

export default function ChallengeSlotPicker({ astroturfId, pricePerHour, onSlotSelected }: Props) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    supabase
      .from('time_slots')
      .select('id, slot_date, start_time, end_time, is_available, price')
      .eq('astroturf_id', astroturfId)
      .eq('is_available', true)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        if (mounted) {
          setSlots((data ?? []) as TimeSlot[])
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [astroturfId, today])

  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>()
    for (const s of slots) {
      if (!map.has(s.slot_date)) map.set(s.slot_date, [])
      map.get(s.slot_date)!.push(s)
    }
    return map
  }, [slots])

  const dateStrip = useMemo(() => buildDateStrip(DAYS_TO_SHOW), [])
  const selectedSlots = (slotsByDate.get(selectedDate) ?? []).sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  )

  const selectedLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }, [selectedDate])

  function scrollStrip(dir: 'left' | 'right') {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -Math.round(el.clientWidth * 0.8) : Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLButtonElement>(`[data-date="${selectedDate}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDate])

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Pick a date & slot</h3>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scrollStrip('left')} className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            ←
          </button>
          <button onClick={() => scrollStrip('right')} className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            →
          </button>
        </div>
      </div>

      {/* Date strip */}
      <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {dateStrip.map(({ dateStr, date }) => {
          const count = slotsByDate.get(dateStr)?.length ?? 0
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              data-date={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 transition ${
                isSelected
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xs font-medium uppercase">
                {date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold leading-tight">{date.getDate()}</span>
              <span className={`text-xs mt-0.5 ${count > 0 ? 'text-green-500' : 'opacity-40'}`}>
                {count > 0 ? `${count} free` : 'none'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Slots */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {selectedLabel}
        </p>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading slots…</p>
        ) : selectedSlots.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No available slots on this day.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {selectedSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSlotSelected({
                  id: slot.id,
                  slot_date: slot.slot_date,
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                })}
                className="flex flex-col items-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-3 text-center transition hover:border-gray-900 dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(slot.start_time)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  – {formatTime(slot.end_time)}
                </span>
                <span className="mt-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                  {slot.price ?? pricePerHour} TL
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
