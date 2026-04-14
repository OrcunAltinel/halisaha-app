import { getIntlLocale, type Locale } from '@/lib/locale'

/**
 * "16:00:00" or "16:00:00+03" -> "16:00"
 */
export function formatTime(t: string | null | undefined): string {
    if (!t) return '-'
    return t.slice(0, 5)
  }
  
  /**
   * Returns today's date as "YYYY-MM-DD" in local time (not UTC).
   */
  export function todayStr(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  
  /**
   * Classify a slot_date string relative to today.
   */
  export function dateBucket(slotDate: string | null | undefined): 'past' | 'today' | 'upcoming' {
    if (!slotDate) return 'upcoming'
    const today = todayStr()
    if (slotDate < today) return 'past'
    if (slotDate === today) return 'today'
    return 'upcoming'
  }
  
  /**
   * Build a month-view calendar grid (6 weeks × 7 days = 42 cells).
   * Starts from Monday. Each cell has { dateStr, day, inCurrentMonth }.
   */
  export type CalendarCell = {
    dateStr: string // "YYYY-MM-DD"
    day: number // 1-31
    inCurrentMonth: boolean
  }
  
  export function buildMonthGrid(year: number, month: number): CalendarCell[] {
    // month is 0-indexed (0 = January)
    const firstOfMonth = new Date(year, month, 1)
    const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7 // 0 = Monday
  
    // Start from the Monday on/before the first of the month
    const gridStart = new Date(year, month, 1 - firstDayOfWeek)
  
    const cells: CalendarCell[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      cells.push({
        dateStr: `${y}-${m}-${day}`,
        day: d.getDate(),
        inCurrentMonth: d.getMonth() === month,
      })
    }
    return cells
  }
  
  /**
   * Format "YYYY-MM-DD" to a readable label like "Mon 14 Apr".
   */
export function formatDateLabel(dateStr: string, locale: Locale = 'en'): string {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(getIntlLocale(locale), {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }
  
  /**
   * Treat a past confirmed reservation as "completed" for display purposes.
   */
  export function effectiveStatus(status: string, slotDate: string | null | undefined): string {
    if (status === 'confirmed' && slotDate && dateBucket(slotDate) === 'past') {
      return 'completed'
    }
    return status
  }
