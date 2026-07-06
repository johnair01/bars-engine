'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DiagnosticFlow } from '@/components/practice/DiagnosticFlow'
import { DiagnosticSummary } from '@/components/practice/DiagnosticSummary'
import type { DiagnosticResult } from '@/lib/emotional-alchemy'

type End = { kind: 'flow' } | { kind: 'summary'; result: DiagnosticResult } | { kind: 'crisis' } | { kind: 'capture' }

export function DiagnoseClient() {
  const [state, setState] = useState<End>({ kind: 'flow' })

  if (state.kind === 'crisis') {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-amber-200">More than a practice</h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          Naming that is the right move. A card game is a skill practice, not therapy or crisis support — and it&apos;s
          not the trained companion this deserves.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          If you&apos;re in danger or thinking about harming yourself, reach a person now: in the U.S. call or text{' '}
          <span className="font-semibold text-zinc-200">988</span> (Suicide &amp; Crisis Lifeline), or your local
          emergency number. Reaching out is the strong move.
        </p>
        <p className="text-xs text-zinc-600">Nothing you typed was saved or sent.</p>
        <button onClick={() => setState({ kind: 'flow' })} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to start
        </button>
      </div>
    )
  }

  if (state.kind === 'capture') {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-zinc-100">Captured</h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          Getting it down is a complete session. You named it before it faded — that&apos;s the whole ask sometimes.
        </p>
        <p className="text-xs text-zinc-600">Your words stayed on this device.</p>
        <div className="flex gap-4 text-sm">
          <button onClick={() => setState({ kind: 'flow' })} className="text-zinc-500 hover:text-zinc-300">
            Diagnose it now instead
          </button>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300">Dashboard →</Link>
        </div>
      </div>
    )
  }

  if (state.kind === 'summary') {
    return (
      <div className="space-y-8">
        <DiagnosticSummary result={state.result} />
        <button onClick={() => setState({ kind: 'flow' })} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Diagnose another charge
        </button>
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
