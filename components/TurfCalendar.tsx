'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import BookSlotButton from './BookSlotButton'
import { formatTime, todayStr } from '@/lib/date-helpers'

type TimeSlot = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
}

type Props = {
  astroturfId: string
  pricePerHour: number
  slots: TimeSlot[]
}

const DAYS_TO_SHOW = 14

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

export default function TurfCalendar({ astroturfId, pricePerHour, slots }: Props) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const stripRef = useRef<HTMLDivElement>(null)

  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>()
    for (const s of slots) {
      if (!map.has(s.slot_date)) map.set(s.slot_date, [])
      map.get(s.slot_date)!.push(s)
    }
    return map
  }, [slots])

  const dateStrip = useMemo(() => buildDateStrip(DAYS_TO_SHOW), [])

  const selectedSlots = (slotsByDate.get(selectedDate) || []).sort((a, b) =>
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
    const amount = Math.round(el.clientWidth * 0.8)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLButtonElement>(`[data-date="${selectedDate}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDate])

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pick a date</h3>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scrollStrip('left')}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Scroll dates left"
          >
            ←
          </button>
          <button
            onClick={() => scrollStrip('right')}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Scroll dates right"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {dateStrip.map(({ dateStr, date }) => {
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const daySlots = slotsByDate.get(dateStr) || []
          const availableCount = daySlots.filter((s) => s.is_available).length

          const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
          const dayNum = date.getDate()
          const monthShort = date.toLocaleDateString('en-GB', { month: 'short' })

          return (
            <button
              key={dateStr}
              data-date={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={[
                'flex min-w-[88px] flex-col items-center justify-center rounded-2xl border px-4 py-3 transition',
                isSelected
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <span className={`text-xs font-semibold uppercase tracking-wide ${isSelected ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {isToday ? 'Today' : weekday}
              </span>
              <span className="mt-1 text-xl font-bold leading-none">{dayNum}</span>
              <span className={`mt-0.5 text-[11px] ${isSelected ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {monthShort}
              </span>

              <span className={[
                'mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                availableCount > 0
                  ? isSelected
                    ? 'bg-green-400/20 text-green-200 dark:text-green-600'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : isSelected
                  ? 'bg-white/10 dark:bg-black/10 text-gray-300 dark:text-gray-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              ].join(' ')}>
                {availableCount > 0 ? `${availableCount} open` : 'Full'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
        <h4 className="mb-4 text-base font-bold text-gray-900 dark:text-white">{selectedLabel}</h4>

        {selectedSlots.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No slots for this day.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {selectedSlots.map((slot) => (
              <div
                key={slot.id}
                className={[
                  'flex flex-col gap-2 rounded-xl border p-3 transition',
                  slot.is_available
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60',
                ].join(' ')}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">₺{pricePerHour}</p>
                <BookSlotButton
                  timeSlotId={slot.id}
                  astroturfId={astroturfId}
                  totalPrice={pricePerHour}
                  isAvailable={slot.is_available}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
