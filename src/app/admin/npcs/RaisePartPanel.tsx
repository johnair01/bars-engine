'use client'

import { useEffect, useState, useTransition } from 'react'
import { listFinished321Sessions, raisePartFrom321 } from '@/actions/npc-from-321'
import { CASTING_BUILDS } from '@/lib/npc-from-321/casting-sheet'

type Row = Awaited<ReturnType<typeof listFinished321Sessions>>[number]

const empty = { gender: '', build: '', nationId: '', classId: '', integralLevel: '', enneagram: '', storyName: '' }

/** Raise a finished 3-2-1 part with a casting sheet. A blank field stays blank; each filled one says where it came from. */
export default function RaisePartPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [picked, setPicked] = useState('')
  const [sheet, setSheet] = useState(empty)
  const [source, setSource] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()

  const load = () => start(async () => { try { setRows(await listFinished321Sessions()) } catch (e) { setMsg(String(e)) } })
  useEffect(load, [])

  const field = (key: keyof typeof empty, label: string, opts?: readonly string[]) => (
    <label className="block text-xs text-zinc-400">
      {label}
      <div className="flex gap-2 mt-1">
        {opts ? (
          <select value={sheet[key]} onChange={(e) => setSheet({ ...sheet, [key]: e.target.value })}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white">
            <option value="">(leave blank)</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input value={sheet[key]} onChange={(e) => setSheet({ ...sheet, [key]: e.target.value })}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white" />
        )}
        <select value={source[key] ?? 'creator'} onChange={(e) => setSource({ ...source, [key]: e.target.value })}
          aria-label={`${label} source`} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-xs text-zinc-300">
          {['creator', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'finalShadowName'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </label>
  )

  const raise = () => start(async () => {
    const res = await raisePartFrom321(picked, { ...sheet, sources: source })
    setMsg(res.error ?? 'Raised.')
    if (!res.error) { setPicked(''); setSheet(empty); setSource({}); setRows(await listFinished321Sessions()) }
  })

  return (
    <section className="space-y-4 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-xl font-bold text-white">Raise a 3-2-1 part</h2>
      <select value={picked} onChange={(e) => setPicked(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm text-white">
        <option value="">Pick a finished session</option>
        {rows.filter((r) => !r.raised).map((r) => <option key={r.id} value={r.id}>{r.partName}</option>)}
      </select>
      {picked && (
        <>
          <p className="text-sm text-zinc-300">Need: {rows.find((r) => r.id === picked)?.need || '(none recorded)'}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('storyName', 'Story-world name')}
            {field('gender', 'Gender', ['m', 'f'])}
            {field('build', 'Build', CASTING_BUILDS)}
            {field('nationId', 'Nation')}
            {field('classId', 'Class')}
            {field('integralLevel', 'Integral level')}
            {field('enneagram', 'Enneagram')}
          </div>
          <button onClick={raise} disabled={pending}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            Raise
          </button>
        </>
      )}
      {msg && <p className="text-sm text-zinc-400">{msg}</p>}
    </section>
  )
}
