'use client'

import { useMemo, useState } from 'react'
import {
  GrammarError, addBridge, addWord, buildTriangle, eighthRayShift, extendTriangle, project, returnToWall, setCharge,
  triangleById, triangleCharge, triangleWords, trianglesHolding, undoShift, wordById,
} from '@/lib/dojo-practice/constellation'
import type { PracticeState } from '@/lib/dojo-practice/types'

/**
 * The Thought String board, shared by the Learning constellation and live practice. It is controlled: the parent owns
 * the PracticeState and decides what a change means (tutorial: nothing is kept; live: autosave). Taps only, no hover.
 */

const chargeWord = (n: number) => (n <= -2 ? 'strongly charged' : n === -1 ? 'charged' : n === 0 ? 'held' : n === 1 ? 'opening' : n === 2 ? 'positive' : 'strongly positive')
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const tone = (n: number) => (n < 0 ? 'border-rose-300/40 bg-rose-400/10 text-rose-100' : n > 0 ? 'border-teal-300/40 bg-teal-400/10 text-teal-100' : 'border-zinc-600 bg-zinc-800 text-zinc-300')
const tap = 'min-h-11 min-w-11'

export function ChargeBadge({ charge }: { charge: number }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${tone(charge)}`}>{signed(charge)} · {chargeWord(charge)}</span>
}

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

export function ThoughtStringBoard({ state, onChange, live, onProject, onReturnToWall, hint }: Props) {
  const c = state.constellation
  const [picked, setPicked] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [paused, setPaused] = useState(false)
  const [bridgeTarget, setBridgeTarget] = useState('')
  const [bridgeText, setBridgeText] = useState('')
  const [notice, setNotice] = useState('')

  const selected = selectedId ? triangleById(c, selectedId) : undefined
  const selectedCharge = selected ? triangleCharge(c, selected) : 0
  const need = anchorId ? 2 : 3
  const positives = useMemo(() => c.triangles.filter(t => triangleCharge(c, t) > 0), [c])

  // Every grammar refusal is a player-safe sentence; show it and keep the wall as it was.
  function attempt(fn: () => void) {
    try { fn(); setNotice('') } catch (e) { setNotice(e instanceof GrammarError ? e.message : 'That did not work. Try again.') }
  }
  const setC = (constellation: PracticeState['constellation']) => onChange({ ...state, constellation })

  function selectTriangle(id: string) { setSelectedId(id); setAnchorId(null); setPicked([]); setPaused(false); setBridgeTarget(''); setNotice('') }

  function togglePick(id: string) {
    setPicked(cur => (cur.includes(id) ? cur.filter(i => i !== id) : cur.length >= need ? [...cur.slice(1), id] : [...cur, id]))
  }

  function make() {
    attempt(() => {
      if (anchorId && selected) {
        const r = extendTriangle(c, selected.id, anchorId, picked)
        setC(r.constellation); setSelectedId(r.triangle.id)
      } else {
        const r = buildTriangle(c, picked)
        setC(r.constellation); setSelectedId(r.triangle.id)
      }
      setPicked([]); setAnchorId(null)
    })
  }

  const lastShift = [...c.history].reverse().find(h => !h.undone)

  return (
    <div className="space-y-5">
      {hint && <p role="status" className="rounded-xl border border-teal-300/30 bg-teal-950/40 p-4 text-sm leading-6 text-teal-50">{hint}</p>}

      <section aria-labelledby="harvest-h" className="rounded-2xl border border-teal-300/20 bg-zinc-950/65 p-4">
        <h2 id="harvest-h" className="text-base font-medium text-white">Words</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">
          {anchorId
            ? `Growing from “${wordById(c, anchorId)?.label}”. Tap two more words.`
            : 'Tap three words to make a triangle. Mark each word’s charge from −3 to +3 whenever it is true for you.'}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {c.words.length === 0 && <li className="text-sm text-zinc-500">No words yet. Add the first one below.</li>}
          {c.words.map(w => {
            const on = picked.includes(w.id)
            return (
              <li key={w.id} className={`flex items-stretch overflow-hidden rounded-xl border ${on ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-900/70'}`}>
                <button type="button" aria-pressed={on} onClick={() => togglePick(w.id)} className={`${tap} flex-1 px-3 py-2 text-left text-sm text-zinc-100`}>
                  <span className="block font-medium">{w.label}</span>
                  <ChargeBadge charge={w.charge} />
                </button>
                <div className="flex border-l border-zinc-700">
                  <button type="button" aria-label={`Lower ${w.label} charge`} disabled={w.charge <= -3} onClick={() => attempt(() => setC(setCharge(c, w.id, w.charge - 1)))} className={`${tap} px-3 text-lg text-rose-200 disabled:opacity-30`}>−</button>
                  <button type="button" aria-label={`Raise ${w.label} charge`} disabled={w.charge >= 3} onClick={() => attempt(() => setC(setCharge(c, w.id, w.charge + 1)))} className={`${tap} px-3 text-lg text-teal-100 disabled:opacity-30`}>+</button>
                </div>
              </li>
            )
          })}
        </ul>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); attempt(() => { setC(addWord(c, draft).constellation); setDraft('') }) }}>
          <label className="sr-only" htmlFor="word-draft">Add a word</label>
          <input id="word-draft" value={draft} onChange={e => setDraft(e.target.value)} maxLength={40} placeholder="Add a word when it comes…" className={`${tap} min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none`} />
          <button type="submit" className={`${tap} rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200`}>Add word</button>
        </form>
        <button type="button" disabled={picked.length !== need} onClick={make} className={`${tap} mt-3 w-full rounded-lg bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-40`}>
          {anchorId ? `Extend from “${wordById(c, anchorId)?.label}” (${picked.length}/2)` : `Make triangle (${picked.length}/3)`}
        </button>
        {notice && <p role="alert" className="mt-3 text-sm text-amber-200">{notice}</p>}
      </section>

      <section aria-labelledby="wall-h" className="rounded-2xl border border-amber-100/15 bg-zinc-950/65 p-4">
        <h2 id="wall-h" className="text-base font-medium text-white">Constellation wall <span className="text-sm font-normal text-zinc-500">· {c.triangles.length} {c.triangles.length === 1 ? 'triangle' : 'triangles'}</span></h2>
        {c.triangles.length === 0 ? <p className="mt-2 text-sm text-zinc-500">Triangles you make appear here.</p> : (
          <>
            <svg viewBox="0 0 100 100" className="mt-3 aspect-square w-full rounded-xl border border-amber-100/10 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,78,24,.22),transparent_70%)]" role="group" aria-label="Wall of triangles">
              {c.triangles.filter(t => t.parentTriangleId).map(t => {
                const p = triangleById(c, t.parentTriangleId!)
                return p ? <line key={`l${t.id}`} x1={p.x} y1={p.y} x2={t.x} y2={t.y} stroke="rgba(253,230,138,.35)" strokeWidth=".4" strokeDasharray="1.2 1.2" /> : null
              })}
              {c.triangles.map(t => {
                const ch = triangleCharge(c, t)
                const on = t.id === selectedId
                const stroke = on ? '#5eead4' : ch < 0 ? '#fda4af' : ch > 0 ? '#5eead4' : '#fde68a'
                const x = t.x, y = t.y
                return (
                  <g key={t.id} role="button" tabIndex={0} aria-label={`Triangle ${triangleWords(c, t).map(w => w.label).join(', ')}, charge ${signed(ch)}`} aria-pressed={on}
                    onClick={() => selectTriangle(t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTriangle(t.id) } }} className="cursor-pointer outline-none">
                    <circle cx={x} cy={y} r="10" fill="transparent" />
                    <path d={`M${x} ${y - 7} L${x + 7} ${y + 5} L${x - 7} ${y + 5} Z`} fill={ch < 0 ? 'rgba(251,113,133,.12)' : 'rgba(45,212,191,.08)'} stroke={stroke} strokeWidth={on ? 1 : .6} />
                    <text x={x} y={y + 10} textAnchor="middle" fontSize="2.8" fill="#e4e4e7">{signed(ch)}</text>
                  </g>
                )
              })}
            </svg>
            <ul className="mt-3 flex flex-col gap-2" aria-label="Triangles, as a list">
              {c.triangles.map(t => {
                const on = t.id === selectedId
                return (
                  <li key={t.id}>
                    <button type="button" aria-pressed={on} onClick={() => selectTriangle(t.id)} className={`${tap} w-full rounded-xl border p-3 text-left ${on ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-900/60'}`}>
                      <span className="block text-sm text-white">{triangleWords(c, t).map(w => w.label).join(' · ')}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">{t.parentTriangleId ? 'Grew from a shared word' : 'Standalone'} <ChargeBadge charge={triangleCharge(c, t)} /></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {selected && (
        <section aria-labelledby="sel-h" className="rounded-2xl border border-teal-300/25 bg-zinc-950/70 p-4">
          <h2 id="sel-h" className="text-base font-medium text-white">Selected triangle</h2>
          <p className="mt-1 text-sm text-zinc-400">To grow it, tap “Share this word”, then choose two more words above.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {triangleWords(c, selected).map(w => (
              <li key={w.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${anchorId === w.id ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-800 bg-zinc-900/70'}`}>
                <span className="text-sm text-zinc-100">{w.label} <ChargeBadge charge={w.charge} /><span className="ml-2 text-xs text-zinc-500">in {trianglesHolding(c, w.id).length}</span></span>
                <button type="button" aria-pressed={anchorId === w.id} onClick={() => { setPicked([]); setAnchorId(anchorId === w.id ? null : w.id) }} className={`${tap} rounded-lg border border-teal-300/40 px-3 text-sm text-teal-100`}>{anchorId === w.id ? 'Shared word ✓' : 'Share this word'}</button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {state.projectedTriangleId === selected.id
              ? <button type="button" onClick={() => attempt(() => { onChange(returnToWall(state)); onReturnToWall?.() })} className={`${tap} flex-1 rounded-lg border border-teal-300/50 px-4 text-sm text-teal-100`}>Return it to the wall</button>
              : <button type="button" onClick={() => attempt(() => { onChange(project(state, selected.id)); onProject?.() })} className={`${tap} flex-1 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white`}>Project to the dojo floor</button>}
          </div>

          {live && selectedCharge < 0 && (
            <div className="mt-5 rounded-xl border border-rose-300/25 bg-rose-950/20 p-4">
              <h3 className="text-sm font-semibold text-rose-100">8th-Ray practice</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">A practice you choose, not something the room does to you. Pause, orient, then pick one charged word to shift one step. You can undo it.</p>
              <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-zinc-100">
                <input type="checkbox" checked={paused} onChange={e => setPaused(e.target.checked)} className="h-5 w-5 accent-teal-400" />
                I have paused and I choose to work this triangle.
              </label>
              <ul className="mt-2 flex flex-col gap-2">
                {triangleWords(c, selected).filter(w => w.charge < 0).map(w => (
                  <li key={w.id}><button type="button" disabled={!paused} onClick={() => attempt(() => { setC(eighthRayShift(c, selected.id, w.id, { paused })); setPaused(false) })} className={`${tap} w-full rounded-lg bg-rose-500/90 px-3 text-left text-sm font-medium text-white disabled:opacity-40`}>Shift “{w.label}” one step ({signed(w.charge)} → {signed(w.charge + 1)})</button></li>
                ))}
              </ul>
            </div>
          )}

          {live && selectedCharge < 0 && positives.length > 0 && (
            <div className="mt-5 rounded-xl border border-zinc-700 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Bridge to a positive triangle</h3>
              <p className="mt-1 text-sm text-zinc-400">A bridge keeps the charged pattern as it is and names what could connect it to something good.</p>
              <label className="mt-3 block text-sm text-zinc-300" htmlFor="bridge-to">Cross toward</label>
              <select id="bridge-to" value={bridgeTarget} onChange={e => setBridgeTarget(e.target.value)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
                <option value="">Choose a positive triangle…</option>
                {positives.map(t => <option key={t.id} value={t.id}>{triangleWords(c, t).map(w => w.label).join(' · ')}</option>)}
              </select>
              <label className="mt-3 block text-sm text-zinc-300" htmlFor="bridge-text">What makes the crossing possible?</label>
              <input id="bridge-text" value={bridgeText} onChange={e => setBridgeText(e.target.value)} maxLength={280} placeholder="A small invitation is safe enough" className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-500`} />
              <button type="button" disabled={!bridgeTarget || !bridgeText.trim()} onClick={() => attempt(() => { setC(addBridge(c, selected.id, bridgeTarget, bridgeText)); setBridgeText(''); setBridgeTarget('') })} className={`${tap} mt-3 w-full rounded-lg bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-40`}>Make the bridge</button>
            </div>
          )}
        </section>
      )}

      {live && c.bridges.length > 0 && (
        <section className="rounded-2xl border border-zinc-700 p-4" aria-label="Bridges">
          <h2 className="text-base font-medium text-white">Bridges</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-300">
            {c.bridges.map(b => <li key={b.id} className="rounded-lg bg-zinc-900/70 p-3">“{b.text}”</li>)}
          </ul>
        </section>
      )}

      {live && lastShift && lastShift.kind === 'eighth_ray' && (
        <button type="button" onClick={() => attempt(() => setC(undoShift(c, lastShift.id)))} className={`${tap} w-full rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200`}>
          Undo the last shift (“{wordById(c, lastShift.wordId)?.label}”)
        </button>
      )}

      {state.projectedTriangleId && (() => {
        const t = triangleById(c, state.projectedTriangleId)
        if (!t) return null
        return (
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
