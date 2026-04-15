'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getPlayerMovePool,
  equipMove,
  unequipMove,
  type MoveSummary,
  type EquippedMove,
  type PlayerMovePoolResult,
} from '@/actions/moves-library'
import Link from 'next/link'

export function MovesLibraryClient() {
  const [pool, setPool] = useState<PlayerMovePoolResult | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = () => {
    getPlayerMovePool().then(setPool)
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleEquip = (moveId: string, slotIndex: 1 | 2 | 3 | 4) => {
    startTransition(async () => {
      const res = await equipMove(moveId, slotIndex)
      if ('success' in res) {
        setFeedback(`Equipped to slot ${slotIndex}`)
        setTimeout(() => setFeedback(null), 2000)
        refresh()
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  const handleUnequip = (slotIndex: 1 | 2 | 3 | 4) => {
    startTransition(async () => {
      const res = await unequipMove(slotIndex)
      if ('success' in res) {
        setFeedback('Unequipped')
        setTimeout(() => setFeedback(null), 2000)
        refresh()
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  if (!pool) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
        <p className="text-zinc-500">Loading moves...</p>
      </div>
    )
  }

  if ('error' in pool) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-red-400 text-sm">{pool.error}</p>
        <p className="text-zinc-500 text-xs mt-2">
          Make sure your profile has a nation set (onboarding).
        </p>
      </div>
    )
  }

  const equippedIds = new Set(
    pool.equipped.filter((e) => e.move).map((e) => e.move!.id)
  )
  const unequippedMoves = pool.unlocked.filter((m) => !equippedIds.has(m.id))

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="rounded-lg bg-emerald-900/30 border border-emerald-800/50 px-4 py-2 text-sm text-emerald-300">
          {feedback}
        </div>
      )}

      {/* Equipped Slots */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px bg-zinc-800 flex-1" />
          <h2 className="text-amber-500 uppercase tracking-widest text-sm font-bold">
            Equipped Moves (4 slots)
          </h2>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>
        <p className="text-zinc-500 text-xs">
          Equip up to 4 moves from your pool. Use them on quests from the quest detail modal.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([1, 2, 3, 4] as const).map((slotIndex) => {
            const slot = pool.equipped.find((e) => e.slotIndex === slotIndex)
            const move = slot?.move ?? null
            return (
              <div
                key={slotIndex}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 min-h-[120px] flex flex-col"
              >
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
                  Slot {slotIndex}
                </div>
                {move ? (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{move.name}</div>
                      <div className="text-zinc-500 text-xs mt-1 line-clamp-2">
                        {move.description}
                      </div>
                      <div className="text-amber-400/80 text-[10px] mt-2">
                        {pool.usesRemaining[move.id] ?? move.usesPerPeriod} uses left today
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnequip(slotIndex)}
                      disabled={isPending}
                      className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
                    >
                      Unequip
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-zinc-600 text-xs italic">Empty</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Unlocked Pool */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px bg-zinc-800 flex-1" />
          <h2 className="text-purple-500 uppercase tracking-widest text-sm font-bold">
            Unlocked Pool
          </h2>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>
        {unequippedMoves.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-zinc-500 text-sm">
              All unlocked moves are equipped. Complete quests to unlock more moves.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {unequippedMoves.map((move) => (
              <div
                key={move.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{move.name}</div>
                  <div className="text-zinc-500 text-xs mt-1 line-clamp-2">
                    {move.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-zinc-500 text-[10px]">Equip to:</span>
                  {([1, 2, 3, 4] as const).map((slotIndex) => (
                    <button
                      key={slotIndex}
                      type="button"
                      onClick={() => handleEquip(move.id, slotIndex)}
                      disabled={isPending}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-purple-600 hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                    >
                      {slotIndex}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-zinc-500">
        <Link href="/wiki/moves" className="hover:text-zinc-300">
          Learn about the 4 Moves (Wake Up, Clean Up, Grow Up, Show Up)
        </Link>
        {' · '}
        <Link href="/wiki/nations" className="hover:text-zinc-300">
          Nations
        </Link>
      </div>
    </div>
  )
}
