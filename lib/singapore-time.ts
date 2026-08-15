/** Urgent listing end times are always entered and shown in Singapore time (SGT, UTC+8). */

export const SINGAPORE_TIMEZONE = 'Asia/Singapore'

const sgDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: SINGAPORE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? ''
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** Today's calendar date in Singapore (YYYY-MM-DD). */
export function todayInSingapore(): string {
  const parts = sgDateTimeFormatter.formatToParts(new Date())
  return `${partValue(parts, 'year')}-${partValue(parts, 'month')}-${partValue(parts, 'day')}`
}

/** Parse stored `ends_at` into date/time inputs for forms (Singapore). */
export function parseEndsAtToSingaporeForm(endsAt: string | null): {
  hasEndDate: boolean
  endDate: string
  endTime: string
} {
  if (!endsAt) {
    return { hasEndDate: false, endDate: todayInSingapore(), endTime: '' }
  }

  const parts = sgDateTimeFormatter.formatToParts(new Date(endsAt))
  let hour = partValue(parts, 'hour')
  // Intl can return "24" at midnight with hour12: false in some engines
  if (hour === '24') hour = '00'

  return {
    hasEndDate: true,
    endDate: `${partValue(parts, 'year')}-${partValue(parts, 'month')}-${partValue(parts, 'day')}`,
    endTime: `${hour}:${partValue(parts, 'minute')}`,
  }
}

function normalizeTimeSegment(time: string): string {
  const trimmed = time.trim() || '23:59'
  const segments = trimmed.split(':')
  const h = Number(segments[0])
  const m = Number(segments[1] ?? 59)
  const s = Number(segments[2] ?? 0)
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) {
    return '23:59:00'
  }
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/** Build ISO `ends_at` for the database from form fields (Singapore, +08:00). */
export function buildEndsAtIsoInSingapore(
  hasEndDate: boolean,
  endDate: string,
  endTime: string
): string | null {
  if (!hasEndDate) return null

  const [year, month, day] = endDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const time = normalizeTimeSegment(endTime)
  return `${pad2(year)}-${pad2(month)}-${pad2(day)}T${time}+08:00`
}
