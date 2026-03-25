'use client'

import { useState } from 'react'
import { CreateEventModal, type CampaignOption } from './CreateEventModal'

export function CreateEventButton({
  instanceId,
  instanceName,
  campaigns,
  canCreateCampaign,
}: {
  instanceId: string
  instanceName: string
  campaigns: CampaignOption[]
  canCreateCampaign: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-center px-4 py-2 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-amber-50 font-bold border border-amber-600/50 text-sm"
      >
        Add gathering…
      </button>
      {open && (
        <CreateEventModal
          instanceId={instanceId}
          instanceName={instanceName}
          campaigns={campaigns}
          canCreateCampaign={canCreateCampaign}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
