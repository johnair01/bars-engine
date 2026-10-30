'use client'

import { useState } from 'react'
import { triangleCharge, triangleWords, wordById } from '@/lib/dojo-practice/constellation'
import type { Draft } from '@/lib/dojo-practice/draft'
import type { EdgeView } from '@/lib/dojo-practice/geometry'
import type { Constellation, Triangle, Word } from '@/lib/dojo-practice/types'
import { CHARGE_COLOUR } from './wall-canvas'

/** The panels under the page, in thumb reach. One is showing at a time. */

const tap = 'min-h-11 min-w-11'
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
export const chargeWord = (n: number) => (n <= -2 ? 'strongly charged' : n === -1 ? 'charged' : n === 0 ? 'held' : n === 1 ? 'opening' : n === 2 ? 'positive' : 'strongly positive')

export function ChargeBadge({ charge }: { charge: number }) {
  const tone = charge < 0 ? 'border-rose-300/40 bg-rose-400/10 text-rose-100' : charge > 0 ? 'border-teal-300/40 bg-teal-400/10 text-teal-100' : 'border-zinc-600 bg-zinc-800 text-zinc-300'
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>{signed(charge)} · {chargeWord(charge)}</span>
}

const panel = 'rounded-2xl border border-teal-300/25 bg-zinc-950/80 p-4'

/** Draw lines one at a time: name the active line, or tap a word from the margin. */
export function DraftDock({ c, draft, active, margin, onPick, onSetActive, onCancel }: {
  c: Constellation; draft: Draft; active: number; margin: Word[]
  onPick: (slot: { wordId: string } | { label: string }) => void; onSetActive: (i: number) => void; onCancel: () => void
}) {
  const [text, setText] = useState('')
  const used = new Set(draft.slots.flatMap(s => (s && 'wordId' in s ? [s.wordId] : [])))
  const name = (s: Draft['slots'][number]) => (!s ? null : 'wordId' in s ? wordById(c, s.wordId)?.label ?? '' : s.label)
  const anchor = draft.kind === 'extend' ? wordById(c, draft.anchorWordId)?.label : null
  return (
    <section aria-label="Draw a triangle" className={panel}>
      <h2 className="text-base font-medium text-white">{draft.kind === 'extend' ? `Building on “${anchor}”` : 'A new triangle'}</h2>
      <p className="mt-1 text-sm text-zinc-400">Name line {active + 1} of {draft.slots.length}. It appears on the page as you go.</p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {draft.slots.map((s, i) => (
          <li key={i}><button type="button" aria-pressed={i === active} onClick={() => onSetActive(i)} className={`${tap} rounded-lg border px-3 text-sm ${i === active ? 'border-teal-300 bg-teal-400/10 text-white' : 'border-zinc-700 text-zinc-300'}`}>{name(s) ?? `Line ${i + 1}`}</button></li>
        ))}
      </ol>
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (text.trim()) { onPick({ label: text }); setText('') } }}>
        <label className="sr-only" htmlFor="line-name">Name this line</label>
        <input id="line-name" value={text} onChange={e => setText(e.target.value)} maxLength={40} autoFocus enterKeyHint="next" placeholder="Name this line…" className={`${tap} min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none`} />
        <button type="submit" disabled={!text.trim()} className={`${tap} rounded-lg bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-40`}>Draw it</button>
      </form>
      {margin.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">Or use a word from the margin</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {margin.filter(w => !used.has(w.id)).map(w => <button key={w.id} type="button" onClick={() => onPick({ wordId: w.id })} className={`${tap} rounded-full border border-zinc-600 px-3 text-sm text-zinc-100`}>{w.label}</button>)}
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className={`${tap} flex-1 rounded-lg border border-zinc-600 px-3 text-sm text-zinc-300`}>Put the pencil down</button>
      </div>
    </section>
  )
}

/** One line selected: its concept, its charge in one tap, rename, and build on it. */
export function LineDock({ c, edge, canExtend, onCharge, onRename, onExtend, onClose }: {
  c: Constellation; edge: EdgeView; canExtend: boolean
  onCharge: (n: number) => void; onRename: (label: string) => void; onExtend: () => void; onClose: () => void
}) {
  const word = wordById(c, edge.wordId)
  const [renaming, setRenaming] = useState(false)
  const [text, setText] = useState('')
  if (!word) return null
  return (
    <section aria-label="This line" className={panel}>
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-medium text-white">{word.label}</h2><ChargeBadge charge={word.charge} /></div>
        <button type="button" onClick={onClose} className={`${tap} rounded-lg px-3 text-sm text-zinc-400`}>Done</button>
      </div>
      <p className="mt-1 text-xs text-zinc-500">On {edge.triangleIds.length} {edge.triangleIds.length === 1 ? 'triangle' : 'triangles'}. Charge is your own report, from −3 to +3.</p>
      <div role="group" aria-label="Charge" className="mt-3 grid grid-cols-7 gap-1">
        {[-3, -2, -1, 0, 1, 2, 3].map(n => (
          <button key={n} type="button" aria-pressed={word.charge === n} onClick={() => onCharge(n)} className={`${tap} rounded-lg border text-sm font-semibold ${word.charge === n ? 'border-white text-zinc-950' : 'border-zinc-700 text-zinc-200'}`} style={word.charge === n ? { backgroundColor: CHARGE_COLOUR[n] } : undefined}>{signed(n)}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={!canExtend} onClick={onExtend} className={`${tap} flex-1 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-40`}>Build on this line</button>
        <button type="button" onClick={() => { setRenaming(r => !r); setText(word.label) }} className={`${tap} rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200`}>Rename</button>
      </div>
      {!canExtend && <p className="mt-2 text-xs text-zinc-500">Both sides of this line already have a triangle.</p>}
      {renaming && (
        <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); onRename(text); setRenaming(false) }}>
          <label className="sr-only" htmlFor="rename">New name</label>
          <input id="rename" value={text} onChange={e => setText(e.target.value)} maxLength={40} className={`${tap} min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`} />
          <button type="submit" className={`${tap} rounded-lg bg-teal-600 px-4 text-sm text-white`}>Save</button>
        </form>
      )}
    </section>
  )
}

/** A whole triangle selected: its total, the floor, take-back, and (in live practice) the 8th-Ray move and bridges. */
export function TriangleDock({ c, t, live, projected, canTakeBack, positives, onProject, onReturn, onTakeBack, onShift, onBridge, onClose }: {
  c: Constellation; t: Triangle; live: boolean; projected: boolean; canTakeBack: boolean; positives: Triangle[]
  onProject: () => void; onReturn: () => void; onTakeBack: () => void
  onShift: (wordId: string, paused: boolean) => void; onBridge: (toId: string, text: string) => void; onClose: () => void
}) {
  const charge = triangleCharge(c, t)
  const [paused, setPaused] = useState(false)
  const [target, setTarget] = useState('')
  const [text, setText] = useState('')
  const charged = triangleWords(c, t).filter(w => w.charge < 0)
  return (
    <section aria-label="This triangle" className={panel}>
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-base font-medium text-white">{triangleWords(c, t).map(w => w.label).join(' · ')}</h2><ChargeBadge charge={charge} /></div>
        <button type="button" onClick={onClose} className={`${tap} rounded-lg px-3 text-sm text-zinc-400`}>Done</button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {projected
          ? <button type="button" onClick={onReturn} className={`${tap} flex-1 rounded-lg border border-teal-300/50 px-4 text-sm text-teal-100`}>Return it to the wall</button>
          : <button type="button" onClick={onProject} className={`${tap} flex-1 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white`}>Project to the dojo floor</button>}
        <button type="button" disabled={!canTakeBack} onClick={onTakeBack} className={`${tap} rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200 disabled:opacity-40`}>Take this triangle back</button>
      </div>
      {!canTakeBack && <p className="mt-2 text-xs text-zinc-500">Another triangle grew from this one. Take that one back first.</p>}

      {live && charge < 0 && (
        <div className="mt-5 rounded-xl border border-rose-300/25 bg-rose-950/20 p-4">
          <h3 className="text-sm font-semibold text-rose-100">8th-Ray practice</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300">A practice you choose, not something the room does to you. Pause, orient, then pick one charged line to shift one step. You can undo it.</p>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-zinc-100"><input type="checkbox" checked={paused} onChange={e => setPaused(e.target.checked)} className="h-5 w-5 accent-teal-400" />I have paused and I choose to work this triangle.</label>
          <ul className="mt-2 flex flex-col gap-2">
            {charged.map(w => <li key={w.id}><button type="button" disabled={!paused} onClick={() => { onShift(w.id, paused); setPaused(false) }} className={`${tap} w-full rounded-lg bg-rose-500/90 px-3 text-left text-sm font-medium text-white disabled:opacity-40`}>Shift “{w.label}” one step ({signed(w.charge)} → {signed(w.charge + 1)})</button></li>)}
          </ul>
        </div>
      )}
      {live && charge < 0 && positives.length > 0 && (
        <div className="mt-5 rounded-xl border border-zinc-700 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Bridge to a positive triangle</h3>
          <p className="mt-1 text-sm text-zinc-400">A bridge keeps the charged pattern as it is and names what could connect it to something good.</p>
          <label className="mt-3 block text-sm text-zinc-300" htmlFor="bridge-to">Cross toward</label>
          <select id="bridge-to" value={target} onChange={e => setTarget(e.target.value)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
            <option value="">Choose a positive triangle…</option>
            {positives.map(p => <option key={p.id} value={p.id}>{triangleWords(c, p).map(w => w.label).join(' · ')}</option>)}
          </select>
          <label className="mt-3 block text-sm text-zinc-300" htmlFor="bridge-text">What makes the crossing possible?</label>
          <input id="bridge-text" value={text} onChange={e => setText(e.target.value)} maxLength={280} placeholder="A small invitation is safe enough" className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-500`} />
          <button type="button" disabled={!target || !text.trim()} onClick={() => { onBridge(target, text); setText(''); setTarget('') }} className={`${tap} mt-3 w-full rounded-lg bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-40`}>Make the bridge</button>
        </div>
      )}
    </section>
  )
}

/** Nothing selected: start drawing, or add a loose word to the margin. */
export function RestDock({ empty, margin, onNew, onAddWord }: { empty: boolean; margin: Word[]; onNew: () => void; onAddWord: (label: string) => void }) {
  const [text, setText] = useState('')
  return (
    <section aria-label="Start" className={panel}>
      <p className="text-sm leading-6 text-zinc-300">{empty ? 'The page is empty. Draw a triangle one line at a time; each line is one word.' : 'Tap a line to mark its charge or build on it. Tap inside a triangle to work with the whole triangle.'}</p>
      <button type="button" onClick={onNew} className={`${tap} mt-3 w-full rounded-lg bg-teal-600 px-4 text-sm font-medium text-white`}>{empty ? 'Draw the first triangle' : 'Start a new triangle'}</button>
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (text.trim()) { onAddWord(text); setText('') } }}>
        <label className="sr-only" htmlFor="margin-word">Add a word to the margin</label>
        <input id="margin-word" value={text} onChange={e => setText(e.target.value)} maxLength={40} placeholder="Jot a word in the margin…" className={`${tap} min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-teal-400 focus:outline-none`} />
        <button type="submit" disabled={!text.trim()} className={`${tap} rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200 disabled:opacity-40`}>Add</button>
      </form>
      {margin.length > 0 && <ul className="mt-3 flex flex-wrap gap-2" aria-label="Words in the margin">{margin.map(w => <li key={w.id} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">{w.label} <span className="text-xs text-zinc-500">{signed(w.charge)}</span></li>)}</ul>}
    </section>
  )
}
