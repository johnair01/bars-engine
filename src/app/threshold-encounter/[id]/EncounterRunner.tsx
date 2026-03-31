'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Passage {
  name: string
  prose: string
  links: { text: string; target: string }[]
}

interface Props {
  passages: Record<string, Passage>
  encounterId: string
  gmFace: string
  vector: string
  exportHref: string
}

export function EncounterRunner({ passages, encounterId, gmFace, vector, exportHref }: Props) {
  const [currentPassage, setCurrentPassage] = useState('Start')
  const [history, setHistory] = useState<string[]>([])
  const [barReflection, setBarReflection] = useState('')
  const [fadingIn, setFadingIn] = useState(true)

  const passage = passages[currentPassage]

  const navigate = (target: string) => {
    setFadingIn(false)
    setTimeout(() => {
      setHistory((h) => [...h, currentPassage])
      setCurrentPassage(target)
      setFadingIn(true)
    }, 200)
  }

  const goBack = () => {
    if (history.length === 0) return
    setFadingIn(false)
    setTimeout(() => {
      const prev = history[history.length - 1]
      setHistory((h) => h.slice(0, -1))
      setCurrentPassage(prev)
      setFadingIn(true)
    }, 200)
  }

  if (!passage) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <p className="text-zinc-400">Passage not found: {currentPassage}</p>
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm underline">Return home</Link>
      </div>
    )
  }

  const isArtifact = currentPassage === 'Artifact'
  const isComplete = isArtifact && passage.links.length === 0

  // Progress indicator
  const totalPassages = Object.keys(passages).length
  const visited = history.length + 1
  const progressPct = Math.min(100, Math.round((visited / totalPassages) * 100))

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-400">Home</Link>
            <span className="mx-1">/</span>
            <span>Threshold Encounter</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition"
            >
              ← Back
            </button>
          )}
        </div>
        <h1 className="text-lg font-bold text-white capitalize">{gmFace} Encounter</h1>
        <p className="text-[10px] text-zinc-600 font-mono">{vector}</p>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Current passage */}
      <div
        className={`transition-opacity duration-200 ${fadingIn ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Passage label */}
        <div className="mb-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">
            {passage.name.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Prose */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <div className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {passage.prose}
          </div>
        </div>

        {/* Artifact: reflection input */}
        {isArtifact && (
          <div className="mt-4 space-y-3">
            <textarea
              value={barReflection}
              onChange={(e) => setBarReflection(e.target.value)}
              placeholder="Write your reflection here..."
              rows={3}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none transition"
            />
            <div className="flex gap-3">
              <Link
                href={`/bars/create?source=encounter&ref=${encounterId}${barReflection ? `&prefill=${encodeURIComponent(barReflection)}` : ''}`}
                className="flex-1 py-2.5 text-center text-sm font-medium rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition"
              >
                Create BAR from reflection
              </Link>
              <Link
                href="/"
                className="px-4 py-2.5 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
              >
                Return home
              </Link>
            </div>
          </div>
        )}

        {/* Choices */}
        {!isArtifact && passage.links.length > 0 && (
          <div className="mt-4 space-y-2">
            {passage.links.map((link, i) => (
              <button
                key={i}
                onClick={() => navigate(link.target)}
                className="w-full text-left px-4 py-3 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 hover:border-zinc-600 text-sm text-zinc-300 transition group"
              >
                <span className="group-hover:text-white transition">{link.text}</span>
                <span className="float-right text-zinc-600 group-hover:text-zinc-400 transition">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Complete state (no links, not artifact) */}
        {!isArtifact && passage.links.length === 0 && (
          <div className="mt-4 flex gap-3">
            <a
              href={exportHref}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
            >
              Export .twee
            </a>
            <Link
              href="/"
              className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
            >
              Return home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
