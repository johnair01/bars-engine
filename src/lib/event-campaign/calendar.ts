/**
 * Event Campaign — Calendar Export (.ics)
 *
 * Generates RFC 5545 iCalendar content for event artifacts.
 * Spec: docs/architecture/event-campaign-api.md
 */

type EventForIcs = {
  id: string
  title: string
  description: string
  locationDetails: string | null
  startTime: Date | null
  endTime: Date | null
  timezone: string | null
}

function formatIcsDate(d: Date, tz?: string | null): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getUTCFullYear()
  const m = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const h = pad(d.getUTCHours())
  const min = pad(d.getUTCMinutes())
  const s = pad(d.getUTCSeconds())
  return `${y}${m}${day}T${h}${min}${s}Z`
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Generate .ics content for an event.
 */
export function createIcsForEvent(event: EventForIcs): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bars Engine//Event Campaign//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@bars`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
  ]

  if (event.startTime) {
    lines.push(`DTSTART:${formatIcsDate(event.startTime, event.timezone)}`)
  }
  if (event.endTime) {
    lines.push(`DTEND:${formatIcsDate(event.endTime, event.timezone)}`)
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  }
  if (event.locationDetails) {
    lines.push(`LOCATION:${escapeIcsText(event.locationDetails)}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}
