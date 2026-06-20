import type { AwakenEvent } from './content'

/**
 * Calendar links for awaken events. The events are all-day (date only, no
 * time), so we build all-day Google Calendar template URLs. Google treats the
 * end date as exclusive, hence the +1 day.
 */

function toYmd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`
}

/** Google Calendar "add event" URL for an all-day awaken event. */
export function googleCalendarUrl(event: AwakenEvent): string {
  const start = new Date(`${event.date}T00:00:00Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1) // all-day end is exclusive
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toYmd(start)}/${toYmd(end)}`,
    details: event.blurb,
    location: event.where,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
