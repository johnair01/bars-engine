'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DiagnosticFlow } from '@/components/practice/DiagnosticFlow'
import { DiagnosticSummary } from '@/components/practice/DiagnosticSummary'
import type { DiagnosticResult } from '@/lib/emotional-alchemy'

type End = { kind: 'flow' } | { kind: 'summary'; result: DiagnosticResult } | { kind: 'crisis' } | { kind: 'capture' }

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'

export function DiagnoseClient() {
  const [state, setState] = useState<End>({ kind: 'flow' })
  const begin = () => setState({ kind: 'flow' })

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
    return (
      <div className="space-y-8">
        <DiagnosticSummary result={state.result} />
        <div className="space-y-3 border-t border-zinc-900 pt-5">
          {/* The post-card practice card (composer render) is the next build target. */}
          <button disabled className="w-full cursor-not-allowed rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm font-medium text-zinc-500">
            Form the practice → <span className="text-zinc-600">(coming next)</span>
          </button>
          <button onClick={begin} className="text-sm text-zinc-500 hover:text-zinc-300">Begin again</button>
        </div>
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
