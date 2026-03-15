'use client'

import { useState, useTransition } from 'react'
import { submitBarCandidate, completeThresholdEncounter } from '@/actions/threshold-encounter'

interface Props {
  encounterId: string
  onClose: () => void
}

export function PostAdventureOverlay({ encounterId, onClose }: Props) {
  const [barText, setBarText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleComplete = () => {
    startTransition(async () => {
      await completeThresholdEncounter(encounterId)
      if (barText.trim()) {
        const result = await submitBarCandidate(encounterId, barText.trim())
        if ('error' in result && result.error) {
          setError(result.error)
          return
        }
      }
      setSubmitted(true)
      setTimeout(onClose, 1500)
    })
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full mx-4 text-center space-y-3">
          <p className="text-emerald-400 text-lg font-semibold">Encounter complete</p>
          {barText.trim() && (
            <p className="text-zinc-400 text-sm">Your BAR candidate has been submitted for review.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Encounter complete</p>
          <h2 className="text-lg font-semibold text-white">What emerged?</h2>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
            A BAR is a Brave Act of Resistance — a commitment to act from courage.
            Did this encounter surface one?
          </p>
        </div>

        <textarea
          value={barText}
          onChange={(e) => setBarText(e.target.value)}
          placeholder="Optional: describe a BAR that emerged from this scene…"
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-700/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium transition disabled:opacity-40"
          >
            {isPending ? 'Saving…' : barText.trim() ? 'Submit BAR + close' : 'Close encounter'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
