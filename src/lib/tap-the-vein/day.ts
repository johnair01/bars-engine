/**
 * Tap the Vein's day boundary (six-faces-council position `ttv-day-dawn`, from his 2026-10-24 note that the timer
 * should not reset at midnight): a sitting's day turns at 4 AM in the player's own time zone, not at midnight in the
 * server's. One helper, used by the sitting actions, the status route and the board's ttvToday().
 *
 * The client sends its zone as `tz`, the minutes Date#getTimezoneOffset() gives (UTC minus local; 420 in Pacific
 * daylight time). Nothing here reads the server's clock zone.
 */

/** Hour of the local morning at which a new day begins. */
export const TTV_DAY_TURNS_AT_HOUR = 4

/** Cookie the sitting route sets so server actions called without a body know the player's zone. */
export const TTV_TZ_COOKIE = 'ttv_tz'

const MAX_OFFSET_MIN = 14 * 60

/** A usable offset in minutes, or 0 (UTC) for anything else. */
export function parseTzOffset(raw: unknown): number {
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  if (!Number.isFinite(n) || !Number.isInteger(n) || Math.abs(n) > MAX_OFFSET_MIN) return 0
  return n
}

/** The sitting's day as YYYY-MM-DD: local time, minus four hours. */
export function ttvDayKey(now: Date, tzOffsetMin: number): string {
  const local = new Date(now.getTime() - tzOffsetMin * 60_000 - TTV_DAY_TURNS_AT_HOUR * 3_600_000)
  return local.toISOString().slice(0, 10)
}

/** The value stored in a `@db.Date` sessionDate column: UTC midnight of the sitting's day. */
export function ttvSessionDate(now: Date, tzOffsetMin: number): Date {
  return new Date(`${ttvDayKey(now, tzOffsetMin)}T00:00:00.000Z`)
}

/** The sitting day after `day` (UTC midnight in, UTC midnight out). */
export function ttvNextDay(day: Date): Date {
  return new Date(day.getTime() + 86_400_000)
}
