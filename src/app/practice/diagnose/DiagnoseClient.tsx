'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DiagnosticFlow } from '@/components/practice/DiagnosticFlow'
import { DiagnosticSummary } from '@/components/practice/DiagnosticSummary'
import { PracticeCard } from '@/components/practice/PracticeCard'
import {
  recommendPractice,
  interimComposerCard,
  SUBMOVE_META,
  type DiagnosticResult,
  type PracticeRecommendation,
  type WaveLens,
} from '@/lib/emotional-alchemy'

type End =
  | { kind: 'flow' }
  | { kind: 'summary'; result: DiagnosticResult }
  | { kind: 'forming'; result: DiagnosticResult }
  | { kind: 'practice'; result: DiagnosticResult; rec: PracticeRecommendation }
  | { kind: 'crisis' }
  | { kind: 'capture' }

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'

export function DiagnoseClient() {
  const [state, setState] = useState<End>({ kind: 'flow' })
  const begin = () => setState({ kind: 'flow' })

  function form(result: DiagnosticResult, submove: WaveLens) {
    const rec = recommendPractice(interimComposerCard(submove), result)
    if (rec.kind === 'crisis') return setState({ kind: 'crisis' })
    if (rec.kind === 'capture_only') return setState({ kind: 'capture' })
    setState({ kind: 'practice', result, rec })
  }

  if (state.kind === 'crisis') {
    return (
      <div className="rounded-[20px] border border-amber-800/60 bg-[#242420] p-6 shadow-2xl">
        <p className={eyebrow + ' text-amber-500'}>Pause</p>
        <h2 className="mt-2 text-xl font-bold text-amber-300">This might need more than a game.</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Naming that is the right move. A practice is a skill, not therapy or crisis support — and it&apos;s not the
          trained companion this deserves. Reaching out is the stronger move.
        </p>
        <div className="mt-4 rounded-xl border border-zinc-800 bg-[#0a0908] px-4 py-3">
          <p className="text-lg font-bold tabular-nums text-zinc-100">988</p>
          <p className="mt-0.5 text-sm text-zinc-400">Suicide &amp; Crisis Lifeline — call or text, 24/7 (US). Or your local emergency number.</p>
        </div>
        <p className={eyebrow + ' mt-4'}>Nothing here was saved or sent.</p>
        <div className="mt-5 flex gap-5 text-sm">
          <button onClick={begin} className="text-zinc-400 hover:text-zinc-200">Back to the diagnostic</button>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300">Dashboard →</Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'capture') {
    return (
      <div className="space-y-5">
        <p className={eyebrow}>Captured</p>
        <h2 className="text-xl font-bold text-zinc-100">Getting it down is a complete session.</h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          You named it and let it be named. That counts — no move required. It&apos;ll be here when there&apos;s more room
          to hold it.
        </p>
        <p className={eyebrow}>Your words stayed on this device.</p>
        <div className="flex gap-5 text-sm">
          <button onClick={begin} className="text-zinc-400 hover:text-zinc-200">Begin again</button>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300">Done →</Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'summary') {
    const result = state.result
    return (
      <div className="space-y-8">
        <DiagnosticSummary result={result} />
        <div className="space-y-3 border-t border-zinc-900 pt-5">
          <button
            onClick={() => setState({ kind: 'forming', result })}
            className="w-full rounded-xl border border-purple-500/70 bg-purple-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            Form the practice →
          </button>
          <button onClick={begin} className="text-sm text-zinc-500 hover:text-zinc-300">Begin again</button>
        </div>
      </div>
    )
  }

  if (state.kind === 'forming') {
    const result = state.result
    return (
      <div className="space-y-6">
        <div>
          <p className={eyebrow}>Form the practice</p>
          <h2 className="mt-1 text-xl font-bold text-zinc-100">What move does this need?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The charge is named. Which way does it want to move? You can change this — later a drawn card fixes it for you.
          </p>
        </div>
        <div className="grid gap-2">
          {SUBMOVE_META.map((m) => (
            <button
              key={m.key}
              onClick={() => form(result, m.key)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left transition-colors hover:border-purple-600/70"
            >
              <span className="block text-sm font-semibold text-zinc-100">{m.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">{m.purpose} — “{m.question}”</span>
            </button>
          ))}
        </div>
        <button onClick={() => setState({ kind: 'summary', result })} className="text-sm text-zinc-500 hover:text-zinc-300">← Back to the read</button>
      </div>
    )
  }

  if (state.kind === 'practice') {
    return (
      <div className="space-y-6">
        <PracticeCard rec={state.rec} vector={state.result.vector} />
        <button onClick={begin} className="text-sm text-zinc-500 hover:text-zinc-300">Begin again</button>
      </div>
    )
  }

  return (
    <DiagnosticFlow
      onComplete={(result) => setState({ kind: 'summary', result })}
      onCrisis={() => setState({ kind: 'crisis' })}
      onCaptureOnly={() => setState({ kind: 'capture' })}
    />
  )
}
