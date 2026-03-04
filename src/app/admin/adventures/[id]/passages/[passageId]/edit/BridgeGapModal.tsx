'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { expandEdgeWithStory, expandEdgeWithQuest } from '@/actions/quest-grammar'
import { ALL_CANONICAL_MOVES } from '@/lib/quest-grammar'

type BridgeType = 'storyteller' | 'quest'

export function BridgeGapModal({
  adventureId,
  fromNodeId,
  toNodeId,
  choiceLabel,
  onClose,
}: {
  adventureId: string
  fromNodeId: string
  toNodeId: string
  choiceLabel: string
  onClose: () => void
}) {
  const router = useRouter()
  const [bridgeType, setBridgeType] = useState<BridgeType>('storyteller')
  const [moveId, setMoveId] = useState(ALL_CANONICAL_MOVES[0]?.id ?? '')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('pending')
    setError(null)
    const result =
      bridgeType === 'storyteller'
        ? await expandEdgeWithStory(adventureId, fromNodeId, toNodeId, moveId)
        : await expandEdgeWithQuest(adventureId, fromNodeId, toNodeId, moveId)
    if (result.success) {
      setStatus('success')
      router.refresh()
      onClose()
    } else {
      setStatus('error')
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-2">Bridge this gap</h3>
        <p className="text-sm text-zinc-400 mb-4">
          {fromNodeId} → {toNodeId}
          {choiceLabel && (
            <span className="ml-2 text-zinc-500">({choiceLabel})</span>
          )}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Bridge type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bridgeType"
                  value="storyteller"
                  checked={bridgeType === 'storyteller'}
                  onChange={() => setBridgeType('storyteller')}
                  className="text-purple-500"
                />
                <span className="text-sm text-zinc-300">Storyteller Bridge</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="bridgeType"
                  value="quest"
                  checked={bridgeType === 'quest'}
                  onChange={() => setBridgeType('quest')}
                  className="text-purple-500"
                />
                <span className="text-sm text-zinc-300">Quest Bridge</span>
              </label>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {bridgeType === 'storyteller'
                ? 'Multiple passages, no choices. Linear narrative.'
                : 'Epiphany Bridge with choices that flavor the path.'}
            </p>
          </div>
          <div>
            <label htmlFor="moveId" className="block text-sm font-medium text-zinc-300 mb-2">
              Emotional alchemy move
            </label>
            <select
              id="moveId"
              value={moveId}
              onChange={(e) => setMoveId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
            >
              {ALL_CANONICAL_MOVES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.narrative}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'pending'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {status === 'pending' ? 'Generating…' : 'Generate bridge'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
