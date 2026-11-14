'use client'

import { useEffect, useState } from 'react'

type Loaded = { copy: Record<string, string>; defaults: Record<string, string>; fields: string[]; max: number; canEdit: boolean }

const LABELS: Record<string, string> = {
  ask: 'The question on the blank goal leaf',
  'hint.light': 'Hint under the light card',
  'hint.middle': 'Hint under the middle card',
  'hint.deep': 'Hint under the deep card',
  anyone: 'The line above the cards',
  add: 'The button that keeps a goal',
  another: 'The button that starts a new goal',
  takeOut: 'The button that takes a goal out',
  open: 'The last line of the first minute',
}
const ORDER = ['ask', 'hint.light', 'hint.middle', 'hint.deep', 'anyone', 'add', 'another', 'takeOut', 'open']

export function CopyEditor() {
  const [data, setData] = useState<Loaded | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [note, setNote] = useState<string>('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/friendcraft/copy', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: Loaded) => { setData(j); setDraft({ ...j.defaults, ...j.copy }) })
      .catch(() => setNote('The text could not be loaded. Reload the page.'))
  }, [])

  if (!data) return <p className="text-sm text-zinc-400">{note || 'Loading…'}</p>

  const bad = (v: string) => /[0-9<>]/.test(v) || v.length > data.max
  const anyBad = ORDER.some(k => bad(draft[k] ?? ''))

  async function save() {
    if (!data) return
    setBusy(true); setNote('')
    const copy: Record<string, string> = {}
    for (const k of ORDER) if ((draft[k] ?? '').trim() && draft[k].trim() !== data.defaults[k]) copy[k] = draft[k]
    const r = await fetch('/api/friendcraft/copy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ copy }) }).catch(() => null)
    setBusy(false)
    if (!r || !r.ok) { setNote(r?.status === 403 ? 'Only an admin or a Friendcraft steward can save this text.' : 'The text was not saved. Try again.'); return }
    const j = await r.json()
    setDraft({ ...data.defaults, ...j.copy })
    setNote(j.rejected?.length ? `Saved, but these lines stayed as they were: ${j.rejected.map((k: string) => LABELS[k]).join('; ')}.` : 'Saved. A friend sees it the next time they open their book.')
  }

  return (
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); void save() }}>
      {!data.canEdit && <p className="text-sm text-amber-300">You can read this text but not change it.</p>}
      {ORDER.map(k => (
        <div key={k} className="space-y-1">
          <label htmlFor={`fc-${k}`} className="block text-sm font-medium text-zinc-200">{LABELS[k]}</label>
          <textarea
            id={`fc-${k}`}
            rows={2}
            maxLength={data.max}
            disabled={!data.canEdit}
            value={draft[k] ?? ''}
            onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
            aria-invalid={bad(draft[k] ?? '')}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 p-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {bad(draft[k] ?? '') && <p className="text-xs text-red-300">Use words only: no numbers, no angle brackets, at most {data.max} characters.</p>}
          {draft[k] !== data.defaults[k] && data.canEdit && (
            <button type="button" className="text-xs text-zinc-400 underline" onClick={() => setDraft(d => ({ ...d, [k]: data.defaults[k] }))}>Bring back the built-in words</button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy || anyBad || !data.canEdit} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-amber-300">Save the text</button>
        {note && <p role="status" className="text-sm text-zinc-300">{note}</p>}
      </div>
    </form>
  )
}
