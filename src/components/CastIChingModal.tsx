'use client'

import { useState } from 'react'
import { castIChingTraditional, persistHexagramContext } from '@/actions/cast-iching'

interface CastIChingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (targetNodeId: string) => void
  targetNodeId: string
}

export function CastIChingModal({
  isOpen,
  onClose,
  onComplete,
  targetNodeId,
}: CastIChingModalProps) {
  const [phase, setPhase] = useState<'ready' | 'casting' | 'revealed' | 'accepted'>('ready')
  const [error, setError] = useState<string | null>(null)

  const handleCast = async () => {
    setPhase('casting')
    setError(null)

    await new Promise((r) => setTimeout(r, 1500))

    const result = await castIChingTraditional()

    if ('error' in result) {
      setError(result.error)
      setPhase('ready')
      return
    }

    const persist = await persistHexagramContext(result)
    if (!persist.success) {
      setError(persist.error ?? 'Failed to save')
      setPhase('ready')
      return
    }

    setPhase('revealed')
    await new Promise((r) => setTimeout(r, 600))
    onComplete(targetNodeId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Cast the I Ching</h3>

        {phase === 'ready' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              The six lines connect to the six Game Master faces. Cast to receive guidance for your path.
            </p>
            <button
              onClick={handleCast}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-lg transition-colors"
            >
              ✧ Cast the I Ching ✧
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {phase === 'casting' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-pulse">☰</div>
            <p className="text-yellow-400 font-mono text-sm">Casting the yarrow stalks...</p>
          </div>
        )}

        {phase === 'revealed' && (
          <p className="text-green-400 text-center py-4">Wisdom received. Continuing...</p>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
