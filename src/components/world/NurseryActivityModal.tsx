'use client'

import { useState, useEffect } from 'react'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { NurseryType } from '@/lib/spatial-world/nursery-rooms'
import { NURSERY_LABELS } from '@/lib/spatial-world/nursery-rooms'
import { getNurseryCompletionState, type NurseryCompletionState } from '@/actions/nursery-ritual'
import { plantBarOnSpoke } from '@/actions/plant-bar-on-spoke'

const NURSERY_DESCRIPTIONS: Record<NurseryType, string> = {
  'wake-up':
    'Notice the signal. Wake Up is about seeing what is really there — the patterns, the feelings, the truth beneath the surface.',
  'clean-up':
    'Release what binds you. Clean Up is about transforming stuck energy — purifying, mourning, trading, or composting what no longer serves.',
  'grow-up':
    'Expand your capacity. Grow Up is about building frameworks, deepening roots, and sustaining what you have cultivated.',
  'show-up':
    'Bring it into the world. Show Up is about acting with commitment — turning insight into deeds, promises into presence.',
}

type Props = {
  anchor: AnchorData
  onClose: () => void
  onLaunchRitual: (nurseryType: NurseryType) => void
  instanceSlug: string
  /** BAR id the player is carrying (from URL ?carrying=) */
  carryingBarId?: string | null
  /** Called when BAR is planted — clears carrying state in parent */
  onBarPlanted?: () => void
}

export function NurseryActivityModal({
  anchor,
  onClose,
  onLaunchRitual,
  instanceSlug,
  carryingBarId,
  onBarPlanted,
}: Props) {
  const [completionState, setCompletionState] = useState<NurseryCompletionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [planting, setPlanting] = useState(false)
  const [planted, setPlanted] = useState(false)

  let nurseryType: NurseryType = 'clean-up'
  let spokeIndex = 0
  if (anchor.config) {
    try {
      const cfg = JSON.parse(anchor.config) as { nurseryType?: string; spokeIndex?: number }
      if (cfg.nurseryType) nurseryType = cfg.nurseryType as NurseryType
      if (typeof cfg.spokeIndex === 'number') spokeIndex = cfg.spokeIndex
    } catch { /* ignore */ }
  }

  useEffect(() => {
    getNurseryCompletionState(instanceSlug, spokeIndex, nurseryType)
      .then(setCompletionState)
      .finally(() => setLoading(false))
  }, [instanceSlug, spokeIndex, nurseryType])

  // Plain async function (no useCallback) — React Compiler auto-memoizes
  // function components, and the manual useCallback was tripping
  // react-hooks/preserve-manual-memoization (pre-existing on this branch).
  async function handlePlant() {
    if (!carryingBarId) return
    setPlanting(true)
    const result = await plantBarOnSpoke({
      barId: carryingBarId,
      instanceSlug,
      spokeIndex,
      nurseryType,
    })
    setPlanting(false)
    if (result.success) {
      setPlanted(true)
      onBarPlanted?.()
      // Clear carrying param from URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('carrying')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }

  const label = NURSERY_LABELS[nurseryType]
  const description = NURSERY_DESCRIPTIONS[nurseryType]

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  // Just planted
  if (planted) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full text-center space-y-4">
        <div className="text-3xl">🌱</div>
        <h2 className="text-white font-bold text-lg">Planted</h2>
        <p className="text-zinc-400 text-sm">Your BAR has been planted on this spoke. It will grow here.</p>
        <button type="button" onClick={onClose} className="w-full px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
          Close
        </button>
      </div>
    )
  }

  // Carrying a BAR — offer to plant
  if (carryingBarId && !completionState?.completed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-white font-bold text-lg mb-2">{label}</h2>
        <p className="text-zinc-300 text-sm leading-relaxed mb-4">{description}</p>

        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-4 py-3 mb-4">
          <p className="text-emerald-400 text-sm font-medium">You are carrying a BAR</p>
          <p className="text-zinc-400 text-xs mt-1">Plant it here to anchor it on this spoke.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePlant}
            disabled={planting}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {planting ? 'Planting...' : 'Plant BAR here'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
            Not yet
          </button>
        </div>
      </div>
    )
  }

  // Already completed
  if (completionState?.completed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white font-bold text-lg">{label}</h2>
          <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded">
            Planted
          </span>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 mb-4 space-y-1">
          <p className="text-zinc-300 text-sm font-medium">{completionState.barTitle}</p>
          {completionState.face && (
            <p className="text-zinc-500 text-xs">
              Guided by {completionState.face.charAt(0).toUpperCase() + completionState.face.slice(1)}
            </p>
          )}
        </div>

        <button type="button" onClick={onClose} className="w-full px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
          Close
        </button>
      </div>
    )
  }

  // Not carrying, not completed — prompt to visit NPC
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
      <h2 className="text-white font-bold text-lg mb-2">{label}</h2>
      <p className="text-zinc-300 text-sm leading-relaxed mb-4">{description}</p>

      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 mb-4 text-center">
        <p className="text-zinc-400 text-sm">Visit a guide in the clearing to begin your ritual.</p>
        <p className="text-zinc-600 text-xs mt-1">Complete their trial to receive a BAR, then return here to plant it.</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onLaunchRitual(nurseryType)}
          className="w-full px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors"
        >
          Begin ritual (CYOA)
        </button>
        <button type="button" onClick={onClose} className="w-full px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
          Back
        </button>
      </div>
    </div>
  )
}
