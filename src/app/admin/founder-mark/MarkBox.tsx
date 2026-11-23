'use client'

import { useState, useTransition } from 'react'
import { previewMark, submitMark, type Preview } from './actions'

const today = () => new Date().toISOString().slice(0, 10)

/** One box and one button. Paste the note, say what arrived, see whose farm it grows, tap Mark. */
export function MarkBox() {
  const [note, setNote] = useState('')
  const [dollars, setDollars] = useState('11')
  const [ref, setRef] = useState(`venmo ${today()} `)
  const [seen, setSeen] = useState<Preview | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, start] = useTransition()

  const look = (text: string) => {
    setNote(text); setDone(null); setErr(null)
    if (!text.trim()) { setSeen(null); return }
    start(async () => { try { setSeen(await previewMark(text)) } catch (e) { setErr((e as Error).message) } })
  }
  const mark = () => start(async () => {
    setErr(null)
    try {
      const r = await submitMark({ ref: ref.trim(), note, dollars: Number(dollars) })
      if (r.kind === 'marked') setDone(`Marked. ${seen?.kind === 'marked' ? seen.name : r.word}'s farm grows a crop for $${(r.cents / 100).toFixed(2)}.`)
      else if (r.kind === 'already') setDone(`Already marked on ${r.markedAt.toISOString().slice(0, 10)}. Nothing was written twice.`)
      else setErr(r.kind === 'no-word' ? 'No payment word in that note, so nothing was marked.' : `Nobody owns ${r.word}, so nothing was marked.`)
    } catch (e) { setErr((e as Error).message) }
  })

  const ready = seen?.kind === 'marked' && Number(dollars) > 0 && ref.trim().length > 0
  return (
    <div className="space-y-4">
      <label className="block text-sm text-zinc-300">Paste the payment note from Venmo or Cash App
        <textarea value={note} onChange={(e) => look(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-base text-white" placeholder="for the book, fern-07" />
      </label>
      <p aria-live="polite" className={`rounded-xl border p-3 text-sm ${seen?.kind === 'marked' ? 'border-emerald-700 text-emerald-300' : 'border-zinc-800 text-zinc-400'}`}>
        {!seen ? 'Paste a note and this names whose farm it grows.'
          : seen.kind === 'marked' ? `${seen.name} owns the word ${seen.word}. Marking grows their crop.`
          : seen.kind === 'no-word' ? 'That note carries no payment word. Nothing to mark; ask the payer for their word.'
          : `Nobody owns ${seen.word}. Nothing to mark.`}
      </p>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <label className="block text-sm text-zinc-300">Dollars that arrived
          <input value={dollars} onChange={(e) => setDollars(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-base text-white" />
        </label>
        <label className="block text-sm text-zinc-300">Payer and day
          <input value={ref} onChange={(e) => setRef(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-base text-white" />
          <span className="mt-1 block text-xs text-zinc-500">Marking the same payer and day twice writes once.</span>
        </label>
      </div>
      <button type="button" onClick={mark} disabled={!ready || busy} className="min-h-12 w-full rounded-xl bg-emerald-500 px-5 py-3 text-base font-bold text-black disabled:opacity-40">
        {busy ? 'Working…' : 'Mark it'}
      </button>
      {done ? <p role="status" className="text-sm text-emerald-300">{done}</p> : null}
      {err ? <p role="alert" className="text-sm text-red-400">{err}</p> : null}
    </div>
  )
}
