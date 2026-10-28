'use client'

import { useState } from 'react'
import {
  GrammarError, addBridge, addWord, eighthRayShift, marginWords, project, removeTriangle, renameWord, returnToWall, setCharge,
  triangleById, triangleCharge, triangleWords, undoShift, wordById,
} from '@/lib/dojo-practice/constellation'
import {
  clearSlot, commitDraft, extendDraft, extensionFor, fillSlot, ghostFor, newDraft, nextEmptySlot, type Draft, type Slot,
} from '@/lib/dojo-practice/draft'
import { edgesOf } from '@/lib/dojo-practice/geometry'
import type { PracticeState } from '@/lib/dojo-practice/types'
import { DraftDock, LineDock, RestDock, TriangleDock } from './board-dock'
import { WallCanvas, type Ghost, type Selection } from './wall-canvas'

export { ChargeBadge } from './board-dock'

/**
 * The Thought String board, shared by the Learning constellation and live practice. It is controlled: the parent owns
 * the PracticeState and decides what a change means (tutorial: nothing is kept; live: autosave). Lines are drawn one at
 * a time on the page; every refusal from the grammar is shown as a sentence and leaves the page as it was.
 */

type Props = {
  state: PracticeState
  onChange: (next: PracticeState) => void
  /** Live practice only: the 8th-Ray move, bridges and undo. The Learning constellation never offers them. */
  live: boolean
  onProject?: () => void
  onReturnToWall?: () => void
  /** The screen's current instruction, shown first so a phone player always sees what to do next. */
  hint?: string
}

const slotLabel = (c: PracticeState['constellation'], s: Slot) => (!s ? null : 'wordId' in s ? wordById(c, s.wordId)?.label ?? null : s.label)

function ghostOf(c: PracticeState['constellation'], draft: Draft | null, active: number): Ghost | null {
  const points = draft && ghostFor(c, draft)
  if (!draft || !points) return null
  const slotEdges = draft.kind === 'new' ? [0, 1, 2] : [1, 2]
  const edges = [0, 1, 2].map(i => {
    const slot = slotEdges.indexOf(i)
    const anchor = draft.kind === 'extend' && i === 0 ? wordById(c, draft.anchorWordId)?.label ?? null : null
    return { a: points[i], b: points[(i + 1) % 3], label: slot >= 0 ? slotLabel(c, draft.slots[slot]) : anchor, slot: slot >= 0 ? slot : null, active: slot === active }
  })
  return { points, edges }
}

export function ThoughtStringBoard({ state, onChange, live, onProject, onReturnToWall, hint }: Props) {
  const c = state.constellation
  const [selection, setSelection] = useState<Selection>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [active, setActive] = useState(0)
  const [notice, setNotice] = useState('')

  const edges = edgesOf(c)
  const edge = selection?.kind === 'edge' ? edges.find(e => e.key === selection.key) : undefined
  const tri = selection?.kind === 'triangle' ? triangleById(c, selection.id) : undefined
  const lastShift = [...c.history].reverse().find(h => !h.undone)

  // Every grammar refusal is a player-safe sentence; show it and keep the page as it was.
  function attempt(fn: () => void) {
    try { fn(); setNotice('') } catch (e) { setNotice(e instanceof GrammarError ? e.message : 'That did not work. Try again.') }
  }
  const setC = (constellation: typeof c) => onChange({ ...state, constellation })

  function begin(next: Draft) { setSelection(null); setDraft(next); setActive(0); setNotice('') }

  function fill(slot: NonNullable<Slot>) {
    if (!draft) return
    const filled = fillSlot(draft, active, slot)
    const next = nextEmptySlot(filled)
    if (next >= 0) { setDraft(filled); setActive(next); return }
    try {
      const done = commitDraft(c, filled)
      setC(done.constellation); setDraft(null); setSelection({ kind: 'triangle', id: done.triangle.id }); setNotice('')
    } catch (e) {
      // Keep the lines already drawn; reopen the last one so it can be named differently.
      setDraft(clearSlot(filled, active)); setNotice(e instanceof GrammarError ? e.message : 'That did not work. Try again.')
    }
  }

  function extendFromLine() {
    const target = edge && extensionFor(c, edge)
    if (target) begin(extendDraft(target.triangleId, target.anchorWordId))
  }

  return (
    <div className="space-y-4">
      {hint && <p role="status" className="rounded-xl border border-teal-300/30 bg-teal-950/40 p-4 text-sm leading-6 text-teal-50">{hint}</p>}

      <WallCanvas
        constellation={c} ghost={ghostOf(c, draft, active)} selection={selection}
        onSelectEdge={key => { setDraft(null); setSelection({ kind: 'edge', key }); setNotice('') }}
        onSelectTriangle={id => { setDraft(null); setSelection({ kind: 'triangle', id }); setNotice('') }}
        onSelectGhostLine={slot => { if (draft) setActive(slot) }}
        onClear={() => { if (!draft) setSelection(null) }}
        onNewTriangle={draft ? undefined : () => begin(newDraft())}
      />

      {notice && <p role="alert" className="text-sm text-amber-200">{notice}</p>}

      {draft && <DraftDock c={c} draft={draft} active={active} margin={marginWords(c)} onPick={fill} onSetActive={setActive} onCancel={() => { setDraft(null); setNotice('') }} />}

      {!draft && edge && (
        <LineDock
          c={c} edge={edge} canExtend={!!extensionFor(c, edge)} onClose={() => setSelection(null)} onExtend={extendFromLine}
          onCharge={n => attempt(() => setC(setCharge(c, edge.wordId, n)))} onRename={label => attempt(() => setC(renameWord(c, edge.wordId, label)))}
        />
      )}

      {!draft && tri && (
        <TriangleDock
          c={c} t={tri} live={live} projected={state.projectedTriangleId === tri.id} positives={c.triangles.filter(t => triangleCharge(c, t) > 0)}
          canTakeBack={!c.triangles.some(t => t.parentTriangleId === tri.id)} onClose={() => setSelection(null)}
          onProject={() => attempt(() => { onChange(project(state, tri.id)); onProject?.() })}
          onReturn={() => attempt(() => { onChange(returnToWall(state)); onReturnToWall?.() })}
          onTakeBack={() => attempt(() => {
            const constellation = removeTriangle(c, tri.id)
            onChange({ constellation, projectedTriangleId: state.projectedTriangleId === tri.id ? null : state.projectedTriangleId }); setSelection(null)
          })}
          onShift={(wordId, paused) => attempt(() => setC(eighthRayShift(c, tri.id, wordId, { paused })))}
          onBridge={(toId, text) => attempt(() => setC(addBridge(c, tri.id, toId, text)))}
        />
      )}

      {!draft && !edge && !tri && (
        <RestDock empty={c.triangles.length === 0} margin={marginWords(c)} onNew={() => begin(newDraft())} onAddWord={label => attempt(() => setC(addWord(c, label).constellation))} />
      )}

      {live && c.bridges.length > 0 && (
        <section className="rounded-2xl border border-zinc-700 p-4" aria-label="Bridges">
          <h2 className="text-base font-medium text-white">Bridges</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-300">{c.bridges.map(b => <li key={b.id} className="rounded-lg bg-zinc-900/70 p-3">“{b.text}”</li>)}</ul>
        </section>
      )}

      {live && lastShift?.kind === 'eighth_ray' && (
        <button type="button" onClick={() => attempt(() => setC(undoShift(c, lastShift.id)))} className="min-h-11 w-full rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200">
          Undo the last shift (“{wordById(c, lastShift.wordId)?.label}”)
        </button>
      )}

      {state.projectedTriangleId && (() => {
        const t = triangleById(c, state.projectedTriangleId)
        return t && (
          <section aria-labelledby="floor-h" className="rounded-2xl border border-teal-300/45 bg-teal-950/35 p-4">
            <h2 id="floor-h" className="text-base font-medium text-white">Dojo floor</h2>
            <ol className="mt-3 grid grid-cols-3 gap-2 text-center text-sm text-teal-50">
              {triangleWords(c, t).map(w => <li key={w.id} className="rounded-full border-2 border-teal-200/70 bg-teal-300/10 px-2 py-4">{w.label}</li>)}
            </ol>
            <p className="mt-2 text-xs text-zinc-400">One triangle stands here at a time. Return it to the wall whenever you like.</p>
          </section>
        )
      })()}
    </div>
  )
}
