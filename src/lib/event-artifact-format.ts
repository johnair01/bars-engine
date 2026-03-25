import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

/** One-line RSVP / capacity summary for campaign event lists */
export function formatEventCapacityLine(ev: EventArtifactListItem): string {
  const cap = ev.capacity
  const n = ev.rsvpCount ?? 0
  if (cap != null && cap > 0) return `${n} / ${cap} going`
  if (n > 0) return `${n} going`
  return ''
}

export function formatEventScheduleRange(ev: EventArtifactListItem): string {
  const start = ev.startTime != null ? new Date(ev.startTime as Date | string) : null
  const end = ev.endTime != null ? new Date(ev.endTime as Date | string) : null
  if (!start || Number.isNaN(start.getTime())) return 'No time set'
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
  if (end && !Number.isNaN(end.getTime())) {
    return `${start.toLocaleString(undefined, opts)} → ${end.toLocaleString(undefined, opts)}`
  }
  return start.toLocaleString(undefined, opts)
}
