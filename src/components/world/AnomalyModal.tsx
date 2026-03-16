'use client'

import { useState } from 'react'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'

type Props = {
  anchor: AnchorData
  playerId: string
  onClose: () => void
}

export function AnomalyModal({ anchor, onClose }: Props) {
  const [entering, setEntering] = useState(false)

  async function handleEnter() {
    setEntering(true)
    if (anchor.linkedId) {
      try {
        const res = await fetch('/api/threshold-encounter/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anchorId: anchor.id, linkedId: anchor.linkedId }),
        })
        if (res.ok) {
          const data = await res.json() as { url?: string }
          if (data.url) {
            window.location.href = data.url
            return
          }
        }
      } catch {
        // fall through to generic message
      }
    }
    // Generic fallback
    alert('You step into the anomaly. Strange energies swirl around you. Return when you are ready.')
    setEntering(false)
    onClose()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold">{anchor.label ?? 'Anomaly'}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>

      <div className="bg-orange-950/30 border border-orange-900/50 rounded-lg p-4">
        <p className="text-orange-300 text-sm">
          A rift in the emotional field. Something wants to emerge here.
          Entering will place you in a threshold encounter.
        </p>
      </div>

      <button
        onClick={handleEnter}
        disabled={entering}
        className="w-full bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded text-sm font-medium"
      >
        {entering ? 'Entering…' : 'Enter the encounter'}
      </button>
    </div>
  )
}
