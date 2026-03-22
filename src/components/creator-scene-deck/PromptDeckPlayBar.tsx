'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { drawPromptCard, discardPromptCardForQuest } from '@/actions/prompt-deck-play'
import type { PromptHandCardView } from '@/lib/prompt-deck/load-play-snapshot'
import { promptMoveFamilyLabel } from '@/lib/prompt-deck/rank-move-map'

export function PromptDeckPlayBar({
  deckId,
  instanceSlug,
  hand,
  drawCount,
  discardCount,
  handSize,
  handMax,
  onOpenCard,
}: {
  deckId: string
  instanceSlug: string
  hand: PromptHandCardView[]
  drawCount: number
  discardCount: number
  handSize: number
  handMax: number
  onOpenCard: (cardId: string) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const draw = () => {
    startTransition(async () => {
      const r = await drawPromptCard(deckId, instanceSlug)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success('Drew a prompt — it’s in your hand below.')
      router.refresh()
    })
  }

  const discard = (cardId: string) => {
    startTransition(async () => {
      const r = await discardPromptCardForQuest(cardId, instanceSlug)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success('Card sent to discard (grid unchanged).')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Prompt draw & hand</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
            Draw a random prompt from this deck into your shared hand (max {handMax} cards across all prompt
            decks). Playing a move sends the card to <strong className="text-zinc-400">discard</strong> only —
            it does <strong className="text-zinc-400">not</strong> remove BARs from the grid.
          </p>
        </div>
        <button
          type="button"
          onClick={draw}
          disabled={pending || handSize >= handMax}
          className="shrink-0 px-4 py-3 rounded-lg bg-amber-700/90 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-40 disabled:pointer-events-none min-h-11 min-w-[8rem] touch-manipulation"
        >
          {pending ? '…' : 'Draw prompt'}
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>
          In deck: <strong className="text-zinc-300">{drawCount}</strong>
        </span>
        <span>
          Discard: <strong className="text-zinc-300">{discardCount}</strong>
        </span>
        <span>
          Hand:{' '}
          <strong className="text-zinc-300">
            {handSize}/{handMax}
          </strong>
        </span>
      </div>
      {hand.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Hand</p>
          <ul className="flex flex-wrap gap-2">
            {hand.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-2 max-w-[11rem] flex flex-col gap-2"
              >
                <button
                  type="button"
                  onClick={() => onOpenCard(c.id)}
                  className="text-left text-xs text-zinc-200 hover:text-white min-h-11"
                >
                  <span className="font-mono text-zinc-500 text-[10px]">
                    r{c.rank} · {promptMoveFamilyLabel(c.moveFamily)}
                  </span>
                  <span className="block line-clamp-2 mt-0.5">{c.promptTitle || c.displayTitle}</span>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => discard(c.id)}
                  className="text-[10px] text-zinc-500 hover:text-amber-400/90 underline underline-offset-2 text-left"
                >
                  → discard (quest play)
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-zinc-600">Hand is empty — draw a prompt to start.</p>
      )}
    </div>
  )
}
