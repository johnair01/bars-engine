import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'
import { formatEventCapacityLine, formatEventScheduleRange } from '@/lib/event-artifact-format'
import { EditEventScheduleButton } from '@/app/event/EditEventScheduleButton'
import { EditEventDetailsButton } from '@/app/event/EditEventDetailsButton'
import { EventGuestsPanel } from '@/app/event/EventGuestsPanel'

type Props = {
  eventArtifacts: EventArtifactListItem[]
  instanceId: string
  player: { id: string } | null
  canSendEventInvites: boolean
}

/**
 * Flat index of pre-production / crew events (child EventArtifacts) for quick scanning.
 * Root+nested UI remains on the main "Events on this campaign" list.
 */
export function EventCrewSurface({
  eventArtifacts,
  instanceId,
  player,
  canSendEventInvites,
}: Props) {
  const titleById = new Map(eventArtifacts.map((e) => [e.id, e.title]))
  const crew = eventArtifacts
    .filter((e) => e.parentEventArtifactId)
    .sort((a, b) => {
      const ta = a.startTime?.getTime() ?? 0
      const tb = b.startTime?.getTime() ?? 0
      return ta - tb
    })

  if (crew.length === 0) return null

  return (
    <section
      className="bg-slate-950/30 border border-slate-800/60 rounded-2xl p-6 space-y-4"
      aria-labelledby="event-crews-heading"
    >
      <div>
        <h2 id="event-crews-heading" className="text-lg font-bold text-white">
          Event crews
        </h2>
        <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
          Pre-production and crew gatherings that support a main scheduled night. RSVP and logistics follow the same
          pattern as other events on this campaign.
        </p>
      </div>
      <ul className="space-y-3 rounded-xl bg-black/25 border border-slate-800/50 p-3">
        {crew.map((ev) => {
          const parentTitle = ev.parentEventArtifactId
            ? titleById.get(ev.parentEventArtifactId) ?? 'Main event'
            : ''
          return (
            <li
              key={ev.id}
              className="rounded-lg border border-slate-800/40 bg-black/30 px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-medium text-slate-100">{ev.title}</span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">pre-production</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-slate-400">For</span> {parentTitle}
                </p>
                <span className="block text-sm text-zinc-500 mt-0.5">{formatEventScheduleRange(ev)}</span>
                {formatEventCapacityLine(ev) ? (
                  <span className="block text-xs text-slate-600 mt-0.5">{formatEventCapacityLine(ev)}</span>
                ) : null}
                {player && ev.startTime ? (
                  <a
                    href={`/api/events/${ev.id}/ics`}
                    className="inline-block mt-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    Add to calendar (.ics)
                  </a>
                ) : null}
                {canSendEventInvites ? (
                  <EventGuestsPanel instanceId={instanceId} eventId={ev.id} />
                ) : null}
              </div>
              {canSendEventInvites ? (
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  <EditEventDetailsButton instanceId={instanceId} event={ev} />
                  <EditEventScheduleButton instanceId={instanceId} event={ev} />
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
