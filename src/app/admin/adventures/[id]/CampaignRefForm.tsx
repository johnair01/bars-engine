'use client'

import { updateAdventureCampaignRef } from '../actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

export function CampaignRefForm({
  adventureId,
  currentCampaignRef,
}: {
  adventureId: string
  currentCampaignRef: string | null
}) {
  return (
    <form action={updateAdventureCampaignRef} className="space-y-2">
      <input type="hidden" name="adventureId" value={adventureId} />
      <div className="flex gap-2 items-center">
        <input
          type="text"
          name="campaignRef"
          defaultValue={currentCampaignRef ?? ''}
          placeholder="e.g. bruised-banana"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <SubmitButton />
      </div>
      <p className="text-xs text-zinc-500">
        When set, /campaign?ref=... uses this Adventure for orientation.
      </p>
    </form>
  )
}
