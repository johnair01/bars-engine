'use client'

import { useState } from 'react'
import { CreateAwarenessRunModal } from './CreateAwarenessRunModal'

export function CreateAwarenessRunButton({
  instanceId,
  instanceName,
}: {
  instanceId: string
  instanceName: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-center px-4 py-2 rounded-xl bg-teal-900/80 hover:bg-teal-800 text-teal-50 font-bold border border-teal-600/40 text-sm"
      >
        Add awareness run…
      </button>
      {open && (
        <CreateAwarenessRunModal
          instanceId={instanceId}
          instanceName={instanceName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
