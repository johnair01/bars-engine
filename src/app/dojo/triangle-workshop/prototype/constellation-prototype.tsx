'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Triangle = { id: string; words: [string, string, string]; x: number; y: number; branch?: boolean; history?: string[] }
type Word = { id: string; label: string; charge: number; source: 'starter' | 'player' }

const clamp = (number: number) => Math.max(-3, Math.min(3, number))
const initialTriangles: Triangle[] = [
  { id: 't1', words: ['Well-being', 'Healthy', 'Clear mind'], x: 18, y: 54 },
  { id: 't2', words: ['Healthy', 'Fresh food', 'Strong body'], x: 39, y: 31 },
  { id: 't3', words: ['Fresh food', 'Abundant gardens', 'Enjoying'], x: 60, y: 48 },
  { id: 't4', words: ['Healthy', 'Uplifting music', 'Great friends'], x: 39, y: 73, branch: true },
  { id: 't5', words: ['Great friends', 'Dinner parties', 'Laughter'], x: 65, y: 76, branch: true },
]
const initialWords: Word[] = [
  ['Well-being', 2], ['Healthy', 2], ['Clear mind', 1], ['Fresh food', 2], ['Strong body', 2], ['Abundant gardens', 2], ['Enjoying', 2], ['Uplifting music', 2], ['Great friends', 2], ['Dinner parties', 2], ['Laughter', 2], ['Ease', 2], ['Rhythm', 2], ['Capable', 2], ['Hider', -2], ['Shy', -1], ['Insecure', -2], ['Embarrassed', -2],
].map(([label, charge], index) => ({ id: `s${index}`, label: String(label), charge: Number(charge), source: 'starter' as const }))

function Badge({ charge }: { charge: number }) {
  const colour = charge < 0 ? 'border-rose-300/30 bg-rose-400/10 text-rose-200' : charge > 0 ? 'border-teal-300/30 bg-teal-400/10 text-teal-100' : 'border-zinc-600 bg-zinc-800 text-zinc-300'
  const label = charge <= -2 ? 'strongly charged' : charge === -1 ? 'charged' : charge === 0 ? 'held' : charge === 1 ? 'opening' : charge === 2 ? 'positive' : 'strongly positive'
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colour}`}>{charge > 0 ? '+' : ''}{charge} · {label}</span>
}

function Glyph({ triangle, selected, charge, choose }: { triangle: Triangle; selected: boolean; charge: number; choose: () => void }) {
  const stroke = selected ? 'rgb(94 234 212)' : charge < 0 ? 'rgb(253 164 175)' : charge > 0 ? 'rgba(94,234,212,.72)' : 'rgba(253,230,138,.55)'
  return <button type="button" onClick={choose} aria-label={`Select triangle: ${triangle.words.join(', ')}`} style={{ left: `${triangle.x}%`, top: `${triangle.y}%` }} className={`absolute z-10 h-28 w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition ${selected ? 'border-teal-200 bg-teal-400/15 shadow-[0_0_32px_rgba(45,212,191,0.35)]' : 'border-transparent hover:border-amber-100/30 hover:bg-white/5'}`}>
    <svg viewBox="0 0 120 92" className="h-[72px] w-[104px] overflow-visible" aria-hidden="true"><path d="M60 9 L105 79 L15 79 Z" fill={charge < 0 ? 'rgba(251,113,133,.05)' : 'rgba(45,212,191,.025)'} stroke={stroke} strokeWidth="1.6" />{[[60,9], [105,79], [15,79]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r={selected ? 8 : 6} fill={stroke} />)}</svg>
    <span className="block px-2 text-[10px] font-medium leading-3 text-zinc-100">{triangle.words.join(' · ')}</span><span className={`text-[10px] ${charge < 0 ? 'text-rose-200' : charge > 0 ? 'text-teal-100' : 'text-zinc-400'}`}>{charge > 0 ? '+' : ''}{charge} charge</span>
  </button>
}

export function ConstellationPrototype() {
  const [triangles, setTriangles] = useState(initialTriangles)
  const [words, setWords] = useState(initialWords)
  const [chosenWordIds, setChosenWordIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState('t2')
  const [extensionAnchor, setExtensionAnchor] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [projected, setProjected] = useState(false)
  const [lensOpen, setLensOpen] = useState(false)
  const [oriented, setOriented] = useState(false)
  const [notice, setNotice] = useState('Choose words, then let their charge reveal the next useful move.')
  const selected = useMemo(() => triangles.find((triangle) => triangle.id === selectedId) ?? triangles[0], [triangles, selectedId])
  const chargeOf = (label: string) => words.find((word) => word.label.toLowerCase() === label.toLowerCase())?.charge ?? 0
  const triangleCharge = (triangle: Triangle) => triangle.words.reduce((total, label) => total + chargeOf(label), 0)
  const selectedCharge = triangleCharge(selected)

  function selectTriangle(id: string) { setSelectedId(id); setExtensionAnchor(null); setChosenWordIds([]); setProjected(false); setOriented(false); setNotice('Triangle selected. Choose one of its words to grow a continuation or branch from that exact shared concept.') }
  function alterCharge(id: string, delta: number) { setWords((current) => current.map((word) => word.id === id ? { ...word, charge: clamp(word.charge + delta) } : word)) }
  function chooseWord(id: string) {
    const word = words.find((item) => item.id === id)
    if (extensionAnchor && word?.label === extensionAnchor) { setNotice(`“${extensionAnchor}” is already the shared anchor. Choose two new concepts to extend from it.`); return }
    const limit = extensionAnchor ? 2 : 3
    setChosenWordIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length === limit ? [...current.slice(1), id] : [...current, id])
  }
  function addWord() {
    const label = draft.trim()
    if (!label) return
    if (words.some((word) => word.label.toLowerCase() === label.toLowerCase())) { setNotice(`“${label}” already lives in this constellation.`); return }
    setWords((current) => [...current, { id: `p${Date.now()}`, label, charge: 0, source: 'player' }])
    setDraft(''); setNotice(`“${label}” is held at neutral. Only you decide its charge.`)
  }
  function buildTriangle() {
    const required = extensionAnchor ? 2 : 3
    if (chosenWordIds.length !== required) return
    const picked = chosenWordIds.map((id) => words.find((word) => word.id === id)?.label ?? '')
    const labels = (extensionAnchor ? [extensionAnchor, ...picked] : picked) as [string, string, string]
    const next = { id: `t${triangles.length + 1}`, words: labels, x: extensionAnchor ? Math.min(84, selected.x + 22) : 78, y: extensionAnchor ? Math.max(16, Math.min(84, selected.y + (selected.y > 52 ? -20 : 20))) : 60, branch: Boolean(extensionAnchor) }
    setTriangles((current) => [...current, next]); setSelectedId(next.id); setChosenWordIds([]); setExtensionAnchor(null); setProjected(false)
    setNotice(extensionAnchor ? `New triangle extends from the shared word “${extensionAnchor}.”` : 'Temporary triangle made. It is a slice of the wider thought string, not a diagnosis.')
  }
  function useEighthRay() {
    if (!oriented || selectedCharge >= 0) return
    const targetLabel = [...selected.words].sort((a, b) => chargeOf(a) - chargeOf(b))[0]
    const target = words.find((word) => word.label === targetLabel)
    if (!target) return
    alterCharge(target.id, 1)
    setTriangles((current) => current.map((triangle) => triangle.id === selected.id ? { ...triangle, history: [...(triangle.history ?? []), `8th-Ray move: ${targetLabel} shifted one charge step`] } : triangle))
    setOriented(false); setNotice(`8th-Ray practice recorded: “${targetLabel}” shifted one charge step. That change now appears everywhere this word participates.`)
  }

  return <main className="min-h-screen bg-[#081617] px-4 py-6 text-zinc-100 sm:px-7"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Triangle Workshop · prototype</p><h1 className="mt-1 text-2xl font-semibold text-white">Charge-aware thought strings</h1><p className="mt-1 max-w-2xl text-sm text-zinc-400">Build from player-created words or a starter vocabulary. Charge travels through every triangle that shares a word.</p></div><Link href="/dojo/triangle-workshop" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-teal-300 hover:text-white">Back to threshold</Link></header>

    <section className="mt-6 rounded-2xl border border-teal-300/20 bg-zinc-950/65 p-5 shadow-xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Word harvest</p><h2 className="mt-1 text-lg font-medium text-white">Choose the material. Mark its charge.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{extensionAnchor ? `Growing from “${extensionAnchor}”: choose two new concepts.` : 'Tap three words to make a new triangle, or choose a word on an existing triangle to grow from that shared concept.'} Use − / + to name intensity from −3 (strongly charged) to +3 (strongly positive).</p></div><div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400">{chosenWordIds.length}/{extensionAnchor ? 2 : 3} chosen</div></div>
      <div className="mt-4 flex flex-wrap gap-2">{words.map((word) => <div key={word.id} className={`flex items-center overflow-hidden rounded-lg border ${chosenWordIds.includes(word.id) ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-900/70'}`}><button type="button" onClick={() => chooseWord(word.id)} className="px-3 py-2 text-left text-sm text-zinc-100">{word.label}<span className="ml-2"><Badge charge={word.charge} /></span></button><div className="flex border-l border-zinc-700"><button type="button" aria-label={`Lower ${word.label} charge`} onClick={() => alterCharge(word.id, -1)} className="px-2 py-2 text-rose-200 hover:bg-rose-400/10">−</button><button type="button" aria-label={`Raise ${word.label} charge`} onClick={() => alterCharge(word.id, 1)} className="px-2 py-2 text-teal-100 hover:bg-teal-400/10">+</button></div></div>)}</div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addWord() }} placeholder="Add a word when it comes…" className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none" /><button type="button" onClick={addWord} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-teal-300">Add to harvest</button><button type="button" disabled={chosenWordIds.length !== (extensionAnchor ? 2 : 3)} onClick={buildTriangle} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40">{extensionAnchor ? `Extend from “${extensionAnchor}”` : 'Make triangle'}</button></div>
    </section>

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.7fr)]"><section className="overflow-hidden rounded-2xl border border-amber-100/15 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,78,24,.26),rgba(8,22,23,.96)_72%)] shadow-2xl"><div className="flex items-center justify-between border-b border-amber-100/10 px-5 py-3"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-100/80">Constellation wall</p><p className="mt-1 text-xs text-zinc-500">Charge moves across shared words · {triangles.length} triangles</p></div><button type="button" onClick={() => setLensOpen(true)} className="rounded-md border border-teal-300/30 bg-teal-400/10 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-teal-400/20">Open focus lens</button></div><div className="relative min-h-[510px] overflow-hidden bg-[linear-gradient(100deg,transparent_0%,rgba(251,191,36,.035)_48%,transparent_100%)]"><div className="absolute left-[15%] top-[52%] h-px w-[70%] bg-gradient-to-r from-transparent via-amber-100/25 to-transparent" />{triangles.map((triangle) => <Glyph key={triangle.id} triangle={triangle} selected={triangle.id === selected.id} charge={triangleCharge(triangle)} choose={() => selectTriangle(triangle.id)} />)}<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-zinc-500">Rose = charged · teal = positively charged · neutral triangles stay held.</div></div></section>
      <aside className="rounded-2xl border border-teal-300/20 bg-zinc-950/70 p-5 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Selected triangle</p><div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-base font-medium text-white">{selected.words.join(' · ')}</h2><Badge charge={selectedCharge} /></div><div className="mt-4 grid gap-2">{selected.words.map((word, index) => <div key={word} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${extensionAnchor === word ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-800 bg-zinc-900/70'}`}><span><span className="mr-2 text-xs text-teal-300">{index + 1}</span>{word}</span><span className="flex items-center gap-2"><Badge charge={chargeOf(word)} /><button type="button" onClick={() => { setExtensionAnchor(word); setChosenWordIds([]); setNotice(`“${word}” is the shared anchor. Choose two words in the harvest to extend this triangle.`) }} className="rounded border border-teal-300/30 px-2 py-1 text-[10px] text-teal-100 hover:bg-teal-400/10">{extensionAnchor === word ? 'Anchor set' : 'Extend from'}</button></span></div>)}</div>
        {extensionAnchor && <button type="button" onClick={() => { setExtensionAnchor(null); setChosenWordIds([]); setNotice('Extension anchor cleared. You can make a new triangle or select another anchor.') }} className="mt-3 text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-4 hover:text-white">Clear extension anchor</button>}<div className="mt-5 grid gap-2"><button type="button" onClick={() => { setProjected(true); setNotice('The selected triangle is now projected to the three stools.') }} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500">Project to dojo</button></div>
        {selectedCharge < 0 && <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-950/20 p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-100">8th-Ray practice</p><p className="mt-2 text-xs leading-5 text-zinc-300">A deliberate player practice, not automatic clearing. Pause, orient, and choose one small change to the most charged word.</p><label className="mt-3 flex items-center gap-2 text-xs text-zinc-200"><input type="checkbox" checked={oriented} onChange={(event) => setOriented(event.target.checked)} className="h-4 w-4 accent-teal-400" /> I have paused and want to work this triangle.</label><button type="button" disabled={!oriented} onClick={useEighthRay} className="mt-3 w-full rounded-lg bg-rose-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40">Apply 8th-Ray move · shift one step</button></div>}
        {selected.history?.length ? <p className="mt-4 text-xs text-teal-100/75">Latest move: {selected.history[selected.history.length - 1]}</p> : null}<p className="mt-4 text-xs leading-5 text-zinc-500">{notice}</p></aside></div>
    <section className={`mt-5 rounded-2xl border p-5 transition ${projected ? 'border-teal-300/45 bg-teal-950/35' : 'border-zinc-800 bg-zinc-950/50 opacity-70'}`}><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Dojo floor</p><h2 className="mt-1 text-lg font-medium text-white">{projected ? 'The selected triangle has entered the room.' : 'Project a triangle from the wall.'}</h2></div><span className="text-xs text-zinc-500">One projection at a time</span></div><div className="relative mx-auto mt-4 h-64 max-w-2xl overflow-hidden rounded-xl border border-amber-100/10 bg-[radial-gradient(ellipse_at_center,rgba(120,78,24,.18),transparent_65%)]">{projected && <svg viewBox="0 0 600 250" className="absolute inset-0 h-full w-full" aria-hidden="true"><path d="M300 42 L490 205 L110 205 Z" fill="rgba(45,212,191,.06)" stroke="rgb(94 234 212)" strokeWidth="2" /></svg>}{[[50,17], [82,82], [18,82]].map(([left, top], index) => <div key={index} style={{ left: `${left}%`, top: `${top}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${projected ? 'text-teal-100' : 'text-zinc-600'}`}><div className={`mx-auto h-12 w-16 rounded-[48%] border-4 ${projected ? 'border-teal-200/80 bg-teal-300/20' : 'border-zinc-700 bg-zinc-800'}`} /><p className="mt-1 text-xs">{projected ? selected.words[index] : 'stool'}</p></div>)}</div></section>
  </div>
  {lensOpen && <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-6"><div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-t-2xl border border-teal-300/30 bg-[#0b1b1c] p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Focus lens</p><h2 className="mt-1 text-xl font-medium text-white">Read the entire charged string</h2><p className="mt-1 text-sm text-zinc-400">Every triangle derives its charge from the same shared word map.</p></div><button type="button" onClick={() => setLensOpen(false)} className="rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">Close</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{triangles.map((triangle, index) => <button key={triangle.id} type="button" onClick={() => { selectTriangle(triangle.id); setLensOpen(false) }} className={`rounded-xl border p-4 text-left ${triangle.id === selected.id ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-950/50 hover:border-teal-300/50'}`}><span className="text-xs text-teal-200">{triangle.branch ? 'Branch' : `String step ${index + 1}`}</span><p className="mt-2 text-sm text-white">{triangle.words.join(' · ')}</p><p className="mt-2"><Badge charge={triangleCharge(triangle)} /></p></button>)}</div></div></div>}
  </main>
}
