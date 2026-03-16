'use client'

import { useEffect, useState } from 'react'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import { getPublicBarsForWorld, claimPublicBar } from '@/actions/world-anchors'

type BarItem = { id: string; title: string; description: string; type: string; reward: number }

type Props = {
  anchor: AnchorData
  playerId: string
  onClose: () => void
}

export function BarTableModal({ anchor, onClose }: Props) {
  const [bars, setBars] = useState<BarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set())

  useEffect(() => {
    void getPublicBarsForWorld(20).then(items => {
      setBars(items)
      setLoading(false)
    })
  }, [])

  async function handleClaim(barId: string) {
    setClaiming(barId)
    try {
      await claimPublicBar(barId)
      setClaimed(prev => new Set(prev).add(barId))
    } catch (e) {
      console.error(e)
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold">{anchor.label ?? 'BAR Exchange'}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>

      <p className="text-zinc-500 text-xs">Public BARs available to claim.</p>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : bars.length === 0 ? (
        <p className="text-zinc-500 text-sm">No public BARs available.</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {bars.map(b => (
            <li key={b.id} className="bg-zinc-800 rounded-lg p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white text-sm font-medium">{b.title}</p>
                  <p className="text-zinc-400 text-xs mt-1">{b.description}</p>
                </div>
                <button
                  onClick={() => handleClaim(b.id)}
                  disabled={!!claiming || claimed.has(b.id)}
                  className="shrink-0 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs px-2 py-1 rounded"
                >
                  {claimed.has(b.id) ? 'Claimed' : claiming === b.id ? '…' : 'Claim'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
