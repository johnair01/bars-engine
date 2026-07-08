'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DiagnosticFlow } from '@/components/practice/DiagnosticFlow'
import { DiagnosticSummary } from '@/components/practice/DiagnosticSummary'
import { DeckDrawReveal } from '@/components/practice/DeckDrawReveal'
import { PracticeCard, type PracticeLogContext } from '@/components/practice/PracticeCard'
import {
  recommendPractice,
  composerCardFromMoveCard,
  seedToAnswers,
  crisisResources,
  type DiagnosticResult,
  type PracticeRecommendation,
  type AlchemySeed,
} from '@/lib/emotional-alchemy'
import type { MoveCard } from '@/lib/allyship-deck/types'

type End =
  | { kind: 'flow' }
  | { kind: 'summary'; result: DiagnosticResult }
  | { kind: 'draw'; result: DiagnosticResult }
  | { kind: 'practice'; result: DiagnosticResult; card: MoveCard; rec: PracticeRecommendation }
  | { kind: 'crisis' }
  | { kind: 'capture' }

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'

export function DiagnoseClient({ seed }: { seed?: AlchemySeed }) {
  const [state, setState] = useState<End>({ kind: 'flow' })
  const begin = () => setState({ kind: 'flow' })
  const initialAnswers = seed ? seedToAnswers(seed) : undefined

  function form(result: DiagnosticResult, card: MoveCard) {
    const rec = recommendPractice(composerCardFromMoveCard(card), result)
    if (rec.kind === 'crisis') return setState({ kind: 'crisis' })
    if (rec.kind === 'capture_only') return setState({ kind: 'capture' })
    setState({ kind: 'practice', result, card, rec })
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
        <div className="mt-4 space-y-3">
          {crisisResources().map((r) => (
            <div key={r.label} className="rounded-xl border border-zinc-800 bg-[#0a0908] px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">{r.label}</p>
              <p className="mt-0.5 text-sm text-zinc-300">{r.contact}{r.note ? ` — ${r.note}` : ''}</p>
            </div>
          ))}
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
            onClick={() => setState({ kind: 'draw', result })}
            className="w-full rounded-xl border border-purple-500/70 bg-purple-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            Form the practice →
          </button>
          <button onClick={begin} className="text-sm text-zinc-500 hover:text-zinc-300">Begin again</button>
        </div>
      </div>
    )
  }

  if (state.kind === 'draw') {
    const result = state.result
    return (
      <DeckDrawReveal onUse={(card) => form(result, card)} onBack={() => setState({ kind: 'summary', result })} />
    )
  }

  if (state.kind === 'practice') {
    const logContext: PracticeLogContext = {
      source: seed?.source ?? 'manual',
      barId: seed?.barId,
      threadLabel: state.result.thread.label,
      drawnCardId: state.card.id,
      flags: state.result.flags,
    }
    return (
      <div className="space-y-6">
        <PracticeCard card={state.card} rec={state.rec} vector={state.result.vector} logContext={logContext} />
        <div className="flex gap-5 text-sm">
          <button onClick={begin} className="text-zinc-500 hover:text-zinc-300">Begin again</button>
          {seed?.returnTo && <Link href={seed.returnTo} className="text-zinc-500 hover:text-zinc-300">← Back</Link>}
        </div>
      </div>
    )
  }

  return (
    <DiagnosticFlow
      initialAnswers={initialAnswers}
      onComplete={(result) => setState({ kind: 'summary', result })}
      onCrisis={() => setState({ kind: 'crisis' })}
      onCaptureOnly={() => setState({ kind: 'capture' })}
    />
  )
}
