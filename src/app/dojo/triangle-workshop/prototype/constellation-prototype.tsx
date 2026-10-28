'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Triangle = { id: string; words: [string, string, string]; x: number; y: number; branch?: boolean }
type HarvestWord = { id: string; label: string; state: 'held' | 'charged' | 'salient' }

const seed: Triangle[] = [
  { id: 't1', words: ['Well-being', 'Healthy', 'Clear mind'], x: 18, y: 54 },
  { id: 't2', words: ['Healthy', 'Fresh food', 'Strong body'], x: 39, y: 31 },
  { id: 't3', words: ['Fresh food', 'Abundant gardens', 'Enjoying'], x: 60, y: 48 },
  { id: 't4', words: ['Healthy', 'Uplifting music', 'Great friends'], x: 39, y: 73, branch: true },
  { id: 't5', words: ['Great friends', 'Dinner parties', 'Laughter'], x: 65, y: 76, branch: true },
]

const harvestSeed: HarvestWord[] = [
  { id: 'h1', label: 'Hider', state: 'charged' },
  { id: 'h2', label: 'Shy', state: 'held' },
  { id: 'h3', label: 'Insecure', state: 'salient' },
  { id: 'h4', label: 'Quiet', state: 'held' },
  { id: 'h5', label: 'Embarrassed', state: 'charged' },
]

function TriangleGlyph({ triangle, selected, onSelect }: { triangle: Triangle; selected: boolean; onSelect: () => void }) {
  const [a, b, c] = triangle.words
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select triangle: ${a}, ${b}, ${c}`}
      style={{ left: `${triangle.x}%`, top: `${triangle.y}%` }}
      className={`absolute z-10 h-28 w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition duration-300 ${selected ? 'border-teal-200 bg-teal-400/15 shadow-[0_0_32px_rgba(45,212,191,0.35)]' : 'border-transparent hover:border-amber-100/30 hover:bg-white/5'}`}
    >
      <svg viewBox="0 0 120 92" className="h-[72px] w-[104px] overflow-visible" aria-hidden="true">
        <path d="M60 9 L105 79 L15 79 Z" fill={selected ? 'rgba(45,212,191,.08)' : 'rgba(251,191,36,.025)'} stroke={selected ? 'rgb(94 234 212)' : 'rgba(253,230,138,.55)'} strokeWidth="1.4" />
        {[[60,9],[105,79],[15,79]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r={selected ? 8 : 6} fill={selected ? 'rgb(153 246 228)' : 'rgb(253 230 138)'} />)}
      </svg>
      <span className={`block px-2 text-[10px] font-medium leading-3 ${selected ? 'text-teal-50' : 'text-amber-100/85'}`}>{a} · {b} · {c}</span>
    </button>
  )
}

export function ConstellationPrototype() {
  const [triangles, setTriangles] = useState(seed)
  const [selectedId, setSelectedId] = useState('t2')
  const [projected, setProjected] = useState(false)
  const [lensOpen, setLensOpen] = useState(false)
  const [notice, setNotice] = useState('Tap a triangle on the wall.')
  const [harvest, setHarvest] = useState(harvestSeed)
  const [harvestSelection, setHarvestSelection] = useState<string[]>([])
  const [newWord, setNewWord] = useState('')
  const selected = useMemo(() => triangles.find(({ id }) => id === selectedId) ?? triangles[0], [selectedId, triangles])

  function select(id: string) {
    setSelectedId(id)
    setProjected(false)
    setNotice('Triangle selected. Its string remains visible.')
  }

  function extend(kind: 'continue' | 'branch') {
    const shared = kind === 'continue' ? selected.words[2] : selected.words[0]
    const next: Triangle = kind === 'continue'
      ? { id: `t${triangles.length + 1}`, words: [shared, 'Ease', 'Rhythm'], x: 82, y: 42 }
      : { id: `t${triangles.length + 1}`, words: [shared, 'Beauty', 'Camping'], x: 18, y: 84, branch: true }
    setTriangles((current) => [...current, next])
    setSelectedId(next.id)
    setProjected(false)
    setNotice(`${kind === 'continue' ? 'Continuation' : 'Branch'} grew from “${shared}.”`)
  }

  function cycleHarvestState(id: string) {
    setHarvest((current) => current.map((word) => {
      if (word.id !== id) return word
      const next = word.state === 'held' ? 'charged' : word.state === 'charged' ? 'salient' : 'held'
      return { ...word, state: next }
    }))
  }

  function selectHarvestWord(id: string) {
    setHarvestSelection((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id)
      if (current.length === 3) return [...current.slice(1), id]
      return [...current, id]
    })
  }

  function addHarvestWord() {
    const label = newWord.trim()
    if (!label) return
    const word = { id: `h${Date.now()}`, label, state: 'held' as const }
    setHarvest((current) => [...current, word])
    setNewWord('')
    setNotice(`“${label}” is held in the harvest. Nothing needs to happen to it yet.`)
  }

  function makeTriangleFromHarvest() {
    if (harvestSelection.length !== 3) return
    const words = harvestSelection.map((id) => harvest.find((word) => word.id === id)?.label ?? '') as [string, string, string]
    const next = { id: `t${triangles.length + 1}`, words, x: 78, y: 60, branch: true }
    setTriangles((current) => [...current, next])
    setSelectedId(next.id)
    setProjected(false)
    setNotice('A temporary triangle was made from the harvest. The wider string remains open.')
  }

  return (
    <main className="min-h-screen bg-[#081617] px-4 py-6 text-zinc-100 sm:px-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Triangle Workshop · prototype</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Well-being constellation</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">A playable sketch of Thought Strings: three words make a triangle; a shared word lets the string continue or branch.</p>
          </div>
          <Link href="/dojo/triangle-workshop" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-teal-300 hover:text-white">Back to threshold</Link>
        </header>

        <section className="mt-6 rounded-2xl border border-teal-300/20 bg-zinc-950/65 p-5 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Word harvest</p>
              <h2 className="mt-1 text-lg font-medium text-white">Start with what is here.</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">Words can be held without interpretation. Tap a word to select it; tap its state dot to cycle held → charged → keeps returning. Three selected words can become a temporary triangle.</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400">{harvestSelection.length}/3 selected</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {harvest.map((word) => {
              const selectedWord = harvestSelection.includes(word.id)
              const stateClass = word.state === 'charged' ? 'bg-rose-300' : word.state === 'salient' ? 'bg-amber-200' : 'bg-zinc-500'
              return <div key={word.id} className={`flex overflow-hidden rounded-lg border ${selectedWord ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-900/70'}`}>
                <button type="button" onClick={() => selectHarvestWord(word.id)} className="px-3 py-2 text-sm text-zinc-100">{word.label}</button>
                <button type="button" aria-label={`Mark ${word.label}: currently ${word.state}`} title={`Currently ${word.state}; tap to change`} onClick={() => cycleHarvestState(word.id)} className="border-l border-zinc-700 px-2"><span className={`block h-2.5 w-2.5 rounded-full ${stateClass}`} /></button>
              </div>
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input value={newWord} onChange={(event) => setNewWord(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addHarvestWord() }} placeholder="Add a word when it comes…" className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none" />
            <button type="button" onClick={addHarvestWord} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-teal-300">Hold word</button>
            <button type="button" disabled={harvestSelection.length !== 3} onClick={makeTriangleFromHarvest} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40">Make temporary triangle</button>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,.65fr)]">
          <section className="overflow-hidden rounded-2xl border border-amber-100/15 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,78,24,.26),rgba(8,22,23,.96)_72%)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-100/10 px-5 py-3">
              <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-100/80">Constellation wall</p><p className="mt-1 text-xs text-zinc-500">Focus region · {triangles.length} triangles · stable local growth</p></div>
              <button type="button" onClick={() => setLensOpen(true)} className="rounded-md border border-teal-300/30 bg-teal-400/10 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-teal-400/20">Open focus lens</button>
            </div>
            <div className="relative min-h-[510px] overflow-hidden bg-[linear-gradient(100deg,transparent_0%,rgba(251,191,36,.035)_48%,transparent_100%)]">
              <div className="absolute inset-x-8 bottom-5 h-14 rounded-[50%] border border-amber-100/10 bg-amber-950/10" />
              <div className="absolute left-6 top-6 h-36 w-16 rounded-full border border-amber-100/10 bg-amber-950/20 blur-[1px]" />
              <div className="absolute right-7 top-8 h-44 w-20 rounded-full border border-amber-100/10 bg-amber-950/20 blur-[1px]" />
              <div className="absolute left-[15%] top-[52%] h-px w-[70%] bg-gradient-to-r from-transparent via-amber-100/25 to-transparent" />
              {triangles.map((triangle) => <TriangleGlyph key={triangle.id} triangle={triangle} selected={triangle.id === selected.id} onSelect={() => select(triangle.id)} />)}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-zinc-500">Older string regions would settle into dim strand glyphs here.</div>
            </div>
          </section>

          <aside className="rounded-2xl border border-teal-300/20 bg-zinc-950/70 p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Selected triangle</p>
            <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-teal-300/20 bg-teal-950/20 p-3">
              <svg viewBox="0 0 180 150" className="h-full w-full" aria-hidden="true"><path d="M90 15 L160 130 L20 130 Z" fill="rgba(45,212,191,.08)" stroke="rgb(94 234 212)" strokeWidth="2" />{[[90,15],[160,130],[20,130]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r="12" fill="rgb(153 246 228)" />)}</svg>
            </div>
            <div className="mt-3 grid gap-2">{selected.words.map((word, index) => <div key={word} className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm"><span className="mr-2 text-xs text-teal-300">{index + 1}</span>{word}</div>)}</div>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={() => { setProjected(true); setNotice('The selected triangle is now projected to the three stools.') }} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500">Project to dojo</button>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => extend('continue')} className="rounded-lg border border-zinc-700 px-2 py-2 text-xs text-zinc-300 hover:border-amber-200/50">Continue string</button><button type="button" onClick={() => extend('branch')} className="rounded-lg border border-zinc-700 px-2 py-2 text-xs text-zinc-300 hover:border-amber-200/50">Branch here</button></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">{notice}</p>
          </aside>
        </div>

        <section className={`mt-5 rounded-2xl border p-5 transition ${projected ? 'border-teal-300/45 bg-teal-950/35' : 'border-zinc-800 bg-zinc-950/50 opacity-70'}`}>
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Dojo floor</p><h2 className="mt-1 text-lg font-medium text-white">{projected ? 'The selected triangle has entered the room.' : 'Project a triangle from the wall.'}</h2></div><span className="text-xs text-zinc-500">One projection at a time</span></div>
          <div className="relative mx-auto mt-4 h-64 max-w-2xl overflow-hidden rounded-xl border border-amber-100/10 bg-[radial-gradient(ellipse_at_center,rgba(120,78,24,.18),transparent_65%)]">
            {projected && <svg viewBox="0 0 600 250" className="absolute inset-0 h-full w-full" aria-hidden="true"><path d="M300 42 L490 205 L110 205 Z" fill="rgba(45,212,191,.06)" stroke="rgb(94 234 212)" strokeWidth="2" /></svg>}
            {[[50,17],[82,82],[18,82]].map(([left, top], index) => <div key={index} style={{ left: `${left}%`, top: `${top}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${projected ? 'text-teal-100' : 'text-zinc-600'}`}><div className={`mx-auto h-12 w-16 rounded-[48%] border-4 ${projected ? 'border-teal-200/80 bg-teal-300/20' : 'border-zinc-700 bg-zinc-800'}`} /><p className="mt-1 text-xs">{projected ? selected.words[index] : 'stool'}</p></div>)}
          </div>
        </section>
      </div>

      {lensOpen && <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-6"><div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-t-2xl border border-teal-300/30 bg-[#0b1b1c] p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Focus lens</p><h2 className="mt-1 text-xl font-medium text-white">Close-reading the whole string</h2><p className="mt-1 text-sm text-zinc-400">The production version adds pan, zoom, search, pinning, and an accessible list. This sketch keeps the structural grammar visible.</p></div><button type="button" onClick={() => setLensOpen(false)} className="rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">Close</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{triangles.map((triangle, index) => <button key={triangle.id} type="button" onClick={() => { select(triangle.id); setLensOpen(false) }} className={`rounded-xl border p-4 text-left ${triangle.id === selected.id ? 'border-teal-300 bg-teal-400/10' : 'border-zinc-700 bg-zinc-950/50 hover:border-teal-300/50'}`}><span className="text-xs text-teal-200">{triangle.branch ? 'Branch' : `String step ${index + 1}`}</span><p className="mt-2 text-sm text-white">{triangle.words.join('  ·  ')}</p><p className="mt-2 text-xs text-zinc-500">Tap to bring this triangle back to the wall.</p></button>)}</div></div></div>}
    </main>
  )
}
