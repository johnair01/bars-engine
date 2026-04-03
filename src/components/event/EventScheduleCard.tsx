'use client'

import { useState } from 'react'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'
import { formatEventScheduleRange, formatEventCapacityLine } from '@/app/event/EditEventScheduleButton'

interface EventScheduleCardProps {
  event: EventArtifactListItem
  children?: EventArtifactListItem[]
  /** Whether this is the next upcoming event (renders expanded) */
  isNext: boolean
  /** Anchor ID for deep-linking */
  anchorId?: string
  /** Whether the user is logged in (for calendar link) */
  isAuthenticated: boolean
}

export function EventScheduleCard({
  event,
  children = [],
  isNext,
  anchorId,
  isAuthenticated,
}: EventScheduleCardProps) {
  const [expanded, setExpanded] = useState(isNext)
  const isPast = event.startTime && new Date(event.startTime) < new Date()
  const capacity = formatEventCapacityLine(event)

  return (
    <div
      id={anchorId}
      className={`cs-surface overflow-hidden transition-all ${isPast ? 'opacity-60' : ''}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--cs-text-primary)' }}>
              {event.title}
            </span>
            {isPast && (
              <span className="text-[10px] uppercase tracking-wider cs-text-muted font-mono">
                completed
              </span>
            )}
          </div>
          <span className="block text-sm cs-text-secondary mt-0.5">
            {formatEventScheduleRange(event)}
          </span>
        </div>
        <span className={`cs-text-muted transition-transform text-sm ${expanded ? 'rotate-90' : ''}`}>
          ▸
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--cs-border)' }}>
          {capacity && (
            <p className="text-xs cs-text-accent-1 pt-3">{capacity}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            {isAuthenticated && event.startTime && (
              <a
                href={`/api/events/${event.id}/ics`}
                className="text-xs cs-text-accent-2 hover:underline"
              >
                Add to calendar
              </a>
            )}
          </div>

          {/* Sub-events */}
          {children.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] uppercase tracking-widest cs-text-muted">Pre-production</p>
              {children.map((sub) => (
                <div key={sub.id} className="pl-3 border-l-2 py-1" style={{ borderColor: 'var(--cs-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--cs-text-primary)' }}>{sub.title}</span>
                  <span className="block text-xs cs-text-secondary">{formatEventScheduleRange(sub)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
