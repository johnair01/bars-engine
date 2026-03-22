'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SceneAtlasDailyView, SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'
import type { PromptDeckPlaySnapshot } from '@/lib/prompt-deck/load-play-snapshot'
import type { ResolvedGridPolarities } from '@/lib/creator-scene-grid-deck/polarities'
import { nextEmptySceneAtlasCell } from '@/lib/creator-scene-grid-deck/scene-atlas-nav'
import { SceneDeckCardPanel } from '@/components/creator-scene-deck/SceneDeckCardPanel'
import { PromptDeckPlayBar } from '@/components/creator-scene-deck/PromptDeckPlayBar'
import { SCENE_ATLAS_DISPLAY_NAME } from '@/lib/creator-scene-grid-deck/branding'
import Link from 'next/link'

function gridAxisSourceLabel(source: ResolvedGridPolarities['source']): string {
  switch (source) {
    case 'adventure':
      return 'Values orientation (your choices)'
    case 'oriented':
      return 'Onboarding (axes committed)'
    case 'derived':
      return 'Nation + playbook (archetype profile)'
    default:
      return 'Default grid'
  }
}

export function SceneDeckClient({
  instanceId,
  instanceSlug,
  instanceName,
  deckId,
  polarities,
  cardsBySuit,
  orderedSuits,
  filledCount,
  dailySceneAtlas,
  playSnapshot,
}: {
  instanceId: string
  instanceSlug: string
  instanceName: string
  deckId: string
  polarities: ResolvedGridPolarities
  cardsBySuit: Record<string, SceneGridCardView[]>
  orderedSuits: string[]
  filledCount: number
  dailySceneAtlas: SceneAtlasDailyView
  playSnapshot: PromptDeckPlaySnapshot
}) {
  const router = useRouter()
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  /** P3: suits start collapsed (dense grid); expand one row at a time. */
  const [expandedSuits, setExpandedSuits] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(orderedSuits.map((s) => [s, false]))
  )

  const openCardById = useCallback(
    (id: string) => {
      setOpenCardId(id)
      const suit = orderedSuits.find((s) => (cardsBySuit[s] ?? []).some((c) => c.id === id))
      if (suit) setExpandedSuits((prev) => ({ ...prev, [suit]: true }))
    },
    [orderedSuits, cardsBySuit]
  )

  const expandAllSuits = useCallback(() => {
    setExpandedSuits(Object.fromEntries(orderedSuits.map((s) => [s, true])))
  }, [orderedSuits])
  const collapseAllSuits = useCallback(() => {
    setExpandedSuits(Object.fromEntries(orderedSuits.map((s) => [s, false])))
  }, [orderedSuits])

  const close = useCallback(() => setOpenCardId(null), [])

  useEffect(() => {
    if (!openCardId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openCardId, close])
  const onBound = useCallback(() => {
    const prevId = openCardId
    router.refresh()
    const next = nextEmptySceneAtlasCell(orderedSuits, cardsBySuit, prevId)
    if (next) {
      openCardById(next.id)
      toast.success('Saved — opening your next empty scene.')
    } else {
      setOpenCardId(null)
      toast.success(
        'Saved — no empty cells after this one in deck order. Pick another on the grid if you skipped any, or you’re done.'
      )
    }
  }, [router, openCardId, orderedSuits, cardsBySuit, openCardById])

  const openCard =
    openCardId === null
      ? null
      : orderedSuits.flatMap((s) => cardsBySuit[s] ?? []).find((c) => c.id === openCardId) ?? null

  return (
    <>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">{instanceName}</h2>
          <div className="text-sm text-zinc-400 text-right space-y-0.5">
            <p>
              {filledCount} / 52 cards answered (private BARs)
            </p>
            {dailySceneAtlas.limit > 0 ? (
              <p className="text-xs text-zinc-500">
                Scene Atlas answers today (UTC): {dailySceneAtlas.used} / {dailySceneAtlas.limit}
                {dailySceneAtlas.remaining <= 0 ? (
                  <span className="text-red-400/90"> · daily limit reached</span>
                ) : dailySceneAtlas.remaining <= 2 ? (
                  <span className="text-amber-500/90"> · {dailySceneAtlas.remaining} left</span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
        <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
          <li>Pick a card — you&apos;ll choose <strong className="text-zinc-300">Attach</strong>,{' '}
            <strong className="text-zinc-300">Guided new BAR</strong>, or the full vault form.</li>
          <li>Guided path: short questions → review → save. Attach: pick from inspirations or other vault captures.</li>
          <li>
            Repeat — Charge → BAR → <strong className="text-zinc-300">Scene Atlas cell</strong>, same pattern as the
            rest of the game.
          </li>
          <li>
            After you save, we jump to the <strong className="text-zinc-300">next empty cell</strong> in deck order
            (suits × ranks) so you can keep working without hunting.
          </li>
        </ol>
        <p className="text-xs text-zinc-500">
          <Link href="/wiki/grid-deck" className="text-amber-400 hover:text-amber-300">
            KB: {SCENE_ATLAS_DISPLAY_NAME}
          </Link>
          {' · '}
          <Link href="/hand" className="text-amber-400 hover:text-amber-300">
            Your hand
          </Link>
        </p>
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs text-zinc-400 space-y-1">
          <p>
            <span className="text-zinc-500">Row/column labels — </span>
            <span className="text-zinc-300">{gridAxisSourceLabel(polarities.source)}</span>
            {polarities.provenance ? (
              <span className="text-zinc-600"> · {polarities.provenance}</span>
            ) : null}
          </p>
          <p>
            Axis 1: <span className="text-zinc-300">{polarities.pair1.negativeLabel}</span> ↔{' '}
            <span className="text-zinc-300">{polarities.pair1.positiveLabel}</span>
            {' · '}
            Axis 2: <span className="text-zinc-300">{polarities.pair2.negativeLabel}</span> ↔{' '}
            <span className="text-zinc-300">{polarities.pair2.positiveLabel}</span>
          </p>
        </div>
      </div>

      <PromptDeckPlayBar
        deckId={deckId}
        instanceSlug={instanceSlug}
        hand={playSnapshot.hand}
        drawCount={playSnapshot.drawCount}
        discardCount={playSnapshot.discardCount}
        handSize={playSnapshot.handSize}
        handMax={playSnapshot.handMax}
        onOpenCard={openCardById}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 text-xs mt-4">
        <button
          type="button"
          onClick={expandAllSuits}
          className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          Expand all rows
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={collapseAllSuits}
          className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          Collapse all
        </button>
      </div>

      <div className="space-y-4">
        {orderedSuits.map((suitKey) => {
          const cards = cardsBySuit[suitKey] ?? []
          const rowLabel = cards[0]?.rowLabel ?? suitKey
          const filledInRow = cards.filter((c) => c.boundBar).length
          const expanded = expandedSuits[suitKey] ?? false
          return (
            <section key={suitKey} className="rounded-xl border border-zinc-800/90 bg-zinc-950/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSuits((prev) => ({ ...prev, [suitKey]: !expanded }))}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-zinc-900/50 transition-colors min-h-[44px]"
                aria-expanded={expanded}
              >
                <h3 className="text-sm uppercase tracking-widest text-emerald-400/90">{rowLabel}</h3>
                <span className="text-xs text-zinc-500 shrink-0">
                  {filledInRow}/{cards.length} filled
                  <span className="text-zinc-600 ml-2">{expanded ? '▼' : '▶'}</span>
                </span>
              </button>
              {expanded ? (
                <div className="flex flex-wrap gap-2 px-3 pb-3 pt-0 border-t border-zinc-800/80">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCardById(c.id)}
                      className={`rounded-lg border px-2 py-2 text-left text-xs min-h-11 min-w-11 sm:min-w-[4.75rem] max-w-[6.5rem] transition-colors touch-manipulation ${
                        c.boundBar
                          ? 'border-emerald-700/80 bg-emerald-950/30 text-emerald-100'
                          : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-amber-700/50 active:border-amber-600'
                      }`}
                    >
                      <span className="font-mono text-zinc-500">{c.rank}</span>
                      {c.boundBar ? (
                        <span className="block mt-1 line-clamp-2 leading-snug">{c.boundBar.title}</span>
                      ) : (
                        <span className="block mt-1 text-zinc-500">Empty</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      {openCard ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scene-atlas-cell-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <SceneDeckCardPanel
                instanceId={instanceId}
                instanceSlug={instanceSlug}
                card={openCard}
                onSuccess={onBound}
                onCancel={close}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
