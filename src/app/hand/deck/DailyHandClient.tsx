'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { playCard } from '@/actions/bar-deck'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { BarCard } from '@/components/bar-card/BarCard'
import { mapPartialBarToBarCardData } from '@/lib/bar-card-data'
import type { BoundCard } from '@/features/bar-system/types'

const SUIT_LABELS: Record<string, string> = Object.fromEntries(
  ALLYSHIP_DOMAINS.map((d) => [d.key, d.short])
)

function CardFront({ card, isBound }: { card: BoundCard['card']; isBound: boolean }) {
  const suitLabel = SUIT_LABELS[card.suit] ?? card.suit
  return (
    <div className="flex flex-col h-full p-4 border border-zinc-700 rounded-xl bg-zinc-900/80">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider text-amber-400/90">{suitLabel}</span>
        <span className="text-xs text-zinc-500">Rank {card.rank}</span>
      </div>
      <h3 className="font-semibold text-white text-sm mb-2">{card.promptTitle}</h3>
      <p className="text-zinc-400 text-xs flex-1 line-clamp-4">{card.promptText}</p>
      {isBound && (
        <span className="mt-2 inline-flex items-center text-[10px] text-purple-400">
          ● Charged
        </span>
      )}
    </div>
  )
}

function DeckCard({
  bound,
  instanceId,
  playerId,
  onPlayed,
}: {
  bound: BoundCard
  instanceId: string
  playerId: string
  onPlayed: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [playing, setPlaying] = useState(false)
  const isBound = !!bound.binding?.bar

  const handlePlay = async () => {
    setPlaying(true)
    const result = await playCard(bound.card.id, playerId, instanceId)
    setPlaying(false)
    if ('success' in result && result.success) {
      onPlayed()
    } else if ('error' in result) {
      console.error(result.error)
    }
  }

  return (
    <div
      className="relative w-[140px] sm:w-[160px] h-[200px] cursor-pointer"
      onClick={() => !playing && setFlipped((f) => !f)}
    >
      {!flipped ? (
        <CardFront card={bound.card} isBound={isBound} />
      ) : (
        <>
          {isBound && bound.binding?.bar ? (
            <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
              <BarCard
                data={mapPartialBarToBarCardData(bound.binding!.bar!)}
                variant="full"
                className="h-full w-full"
              >
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={playing}
                  className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {playing ? 'Playing…' : 'Play'}
                </button>
              </BarCard>
            </div>
          ) : (
            <div className="flex flex-col h-full p-4 border border-zinc-700 rounded-xl bg-zinc-900/80 items-center justify-center">
              <p className="text-zinc-500 text-xs text-center mb-3">
                Bind a personal BAR to add meaning.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlay()
                }}
                disabled={playing}
                className="py-2 px-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm disabled:opacity-50"
              >
                {playing ? 'Playing…' : 'Play'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function DailyHandClient({
  hand,
  instanceId,
  instanceName,
  playerId,
}: {
  hand: BoundCard[]
  instanceId: string
  instanceName: string
  playerId: string
}) {
  const router = useRouter()

  const refresh = () => router.refresh()

  if (hand.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-500 mb-2">No cards in hand.</p>
        <p className="text-zinc-600 text-sm">
          Draw your daily hand from the deck. If you just drew, refresh the page.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <section>
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        {hand.map((bound) => (
          <DeckCard
            key={bound.card.id}
            bound={bound}
            instanceId={instanceId}
            playerId={playerId}
            onPlayed={refresh}
          />
        ))}
      </div>
      <p className="mt-6 text-zinc-500 text-sm">
        Click a card to flip. Play from the back to move it to discard and draw a replacement.
      </p>
    </section>
  )
}
