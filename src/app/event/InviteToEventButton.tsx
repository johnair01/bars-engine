'use client'

import { useState } from 'react'
import { InviteToEventModal } from './InviteToEventModal'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

type Event = EventArtifactListItem

export function InviteToEventButton({
  instanceId,
  instanceName,
  events,
}: {
  instanceId: string
  instanceName: string
  events: Event[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto text-center px-5 py-3 rounded-xl bg-amber-700/90 hover:bg-amber-600 text-white font-bold border border-amber-500/50 text-sm"
      >
        Invite someone to a listed event…
      </button>
      {open && (
        <InviteToEventModal
          instanceId={instanceId}
          instanceName={instanceName}
          events={events}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
