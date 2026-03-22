'use client'

import { useActionState, useEffect, useState } from 'react'
import type { SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'
import { CreateBarForm } from '@/components/CreateBarForm'
import {
  bindSceneGridCardToExistingBar,
  getSceneGridBindableBars,
  type SceneGridBindableBarRow,
} from '@/actions/scene-grid-deck'
import {
  buildSceneAtlasBarDescriptionScaffold,
  sceneAtlasDefaultTags,
} from '@/lib/creator-scene-grid-deck/bar-template'
import { SceneAtlasGuidedComposer } from '@/components/creator-scene-deck/SceneAtlasGuidedComposer'
import Link from 'next/link'

type Flow = 'choose' | 'attach' | 'guided' | 'vault'

function partitionBindable(rows: SceneGridBindableBarRow[]) {
  const inspirations = rows.filter((b) => b.type === 'bar')
  const other = rows.filter((b) => b.type !== 'bar')
  return { inspirations, other }
}

export function SceneDeckCardPanel({
  instanceId,
  instanceSlug,
  card,
  onSuccess,
  onCancel,
}: {
  instanceId: string
  instanceSlug: string
  card: SceneGridCardView
  onSuccess: () => void
  onCancel: () => void
}) {
  const [flow, setFlow] = useState<Flow>('choose')
  const [bindable, setBindable] = useState<SceneGridBindableBarRow[]>([])
  const [bindState, bindAction, bindPending] = useActionState(bindSceneGridCardToExistingBar, undefined)

  useEffect(() => {
    getSceneGridBindableBars().then(setBindable)
  }, [])

  useEffect(() => {
    if (bindState?.ok) onSuccess()
  }, [bindState?.ok, onSuccess])

  useEffect(() => {
    setFlow('choose')
  }, [card.id])

  const prefill = {
    title: card.displayTitle,
    description: buildSceneAtlasBarDescriptionScaffold({
      displayTitle: card.displayTitle,
      rowLabel: card.rowLabel,
      rank: card.rank,
    }),
    tags: sceneAtlasDefaultTags(card.suit),
  }

  const { inspirations, other } = partitionBindable(bindable)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Scene Atlas cell</p>
        <h2 id="scene-atlas-cell-dialog-title" className="text-sm font-medium text-zinc-100">
          {card.displayTitle}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Row: {card.rowLabel}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Card prompt</p>
        <div className="text-sm text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
          {card.promptText}
        </div>
      </div>

      {flow === 'choose' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">How do you want to fill this cell?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFlow('attach')}
              className="rounded-xl border border-zinc-700 bg-zinc-900/60 hover:border-emerald-600/60 hover:bg-zinc-900 p-4 text-left transition min-h-[120px] flex flex-col gap-2"
            >
              <span className="text-lg" aria-hidden>
                📌
              </span>
              <span className="text-sm font-semibold text-white">Attach a BAR</span>
              <span className="text-xs text-zinc-500 leading-relaxed">
                Place something you already captured — inspirations (hand) or other vault BARs.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFlow('guided')}
              className="rounded-xl border border-zinc-700 bg-zinc-900/60 hover:border-teal-600/60 hover:bg-zinc-900 p-4 text-left transition min-h-[120px] flex flex-col gap-2"
            >
              <span className="text-lg" aria-hidden>
                🜂
              </span>
              <span className="text-sm font-semibold text-white">Guided new BAR</span>
              <span className="text-xs text-zinc-500 leading-relaxed">
                A few short questions, then a review — we compose the BAR for you. No long form until you choose.
              </span>
            </button>
          </div>
          <p className="text-center text-xs text-zinc-600">
            <button type="button" onClick={() => setFlow('vault')} className="text-amber-500/90 hover:text-amber-400 underline">
              Open full vault form
            </button>{' '}
            — all optional fields, same as Vault → BARs.
          </p>
        </div>
      )}

      {flow === 'attach' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setFlow('choose')}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Back to paths
          </button>
          {bindable.length === 0 ? (
            <>
              <p className="text-sm text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3">
                No BARs in your vault yet. Use <strong className="text-zinc-400">Guided new BAR</strong> or{' '}
                <Link href="/bars/create" className="text-amber-400 hover:text-amber-300">
                  capture one
                </Link>
                .
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <form action={bindAction} className="space-y-3">
              <input type="hidden" name="instanceId" value={instanceId} />
              <input type="hidden" name="cardId" value={card.id} />
              <input type="hidden" name="instanceSlug" value={instanceSlug} />
              <input type="hidden" name="sceneGridSuit" value={card.suit} />
              <input type="hidden" name="sceneGridRank" value={String(card.rank)} />
              <label className="block">
                <span className="text-xs uppercase text-zinc-500">Your BAR</span>
                <select
                  name="barId"
                  required
                  className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {inspirations.length > 0 && (
                    <optgroup label="Inspirations (BAR type — same as /bars)">
                      {inspirations.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {other.length > 0 && (
                    <optgroup label="Other vault captures">
                      {other.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.type})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              <p className="text-xs text-zinc-500">
                Need a new inspiration first?{' '}
                <Link href="/bars/create" className="text-amber-400 hover:text-amber-300">
                  Capture
                </Link>{' '}
                or use <strong className="text-zinc-400">Guided new BAR</strong> above.
              </p>
              {bindState?.error ? <p className="text-sm text-red-400">{bindState.error}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bindPending}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {bindPending ? 'Placing…' : 'Place on card'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {flow === 'guided' && (
        <SceneAtlasGuidedComposer
          instanceId={instanceId}
          instanceSlug={instanceSlug}
          card={card}
          onSuccess={onSuccess}
          onBack={() => setFlow('choose')}
        />
      )}

      {flow === 'vault' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setFlow('choose')}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Back to paths
          </button>
          <CreateBarForm
            key={card.id}
            sceneGridBind={{
              instanceId,
              cardId: card.id,
              instanceSlug,
              promptTitle: card.promptTitle,
              promptExcerpt: card.promptText.slice(0, 160),
              displayTitle: card.displayTitle,
              suit: card.suit,
              rank: card.rank,
              rowLabel: card.rowLabel,
            }}
            prefill={prefill}
            onSceneGridBound={onSuccess}
            onCancel={onCancel}
          />
        </div>
      )}
    </div>
  )
}
