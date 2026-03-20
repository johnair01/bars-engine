/**
 * Minimal RFC 5545 VEVENT for a single EventArtifact (no recurrence).
 */

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

/** format as YYYYMMDDTHHMMSSZ */
function toIcsUtc(dt: Date): string {
  if (Number.isNaN(dt.getTime())) return ''
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  const h = String(dt.getUTCHours()).padStart(2, '0')
  const min = String(dt.getUTCMinutes()).padStart(2, '0')
  const s = String(dt.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${d}T${h}${min}${s}Z`
}

export type IcsEventInput = {
  uid: string
  title: string
  description?: string | null
  location?: string | null
  start: Date
  end: Date | null
  stamp: Date
}

export function buildSingleEventIcs(ev: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BARS Engine//Event Artifact//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(ev.uid)}`,
    `DTSTAMP:${toIcsUtc(ev.stamp)}`,
    `DTSTART:${toIcsUtc(ev.start)}`,
  ]
  if (ev.end && !Number.isNaN(ev.end.getTime())) {
    lines.push(`DTEND:${toIcsUtc(ev.end)}`)
  }
  lines.push(`SUMMARY:${icsEscape(ev.title)}`)
  if (ev.description?.trim()) {
    lines.push(`DESCRIPTION:${icsEscape(ev.description.trim())}`)
  }
  if (ev.location?.trim()) {
    lines.push(`LOCATION:${icsEscape(ev.location.trim())}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
