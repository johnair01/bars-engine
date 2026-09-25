import Link from 'next/link'
import { DiagnoseClient } from './DiagnoseClient'

/**
 * @page /practice/diagnose
 * @entity EmotionalVector
 * @description Charge Diagnostic — turns a live charge into a structured, composer-ready emotional vector. Pre-card raw flow; raw text never leaves the client (§1.6).
 * @permissions public
 * @relationships EmotionalVector (produced), DiagnosticResult (produced, structured-only)
 * @dimensions WHO:player, WHAT:charge diagnostic, WHERE:practice, ENERGY:emotional_charge, PERSONAL_THROUGHPUT:diagnose_before_move
 * @example /practice/diagnose
 * @agentDiscoverable false
 *
 * Spec: .specify/specs/emotional-alchemy-diagnostic/spec.md
 * DB-free, client-first (deck precedent). No auth gate in Phase 1; persistence
 * and the auth gate arrive with the session log (Practice Atlas target 5).
 */
export default function DiagnosePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="mx-auto max-w-lg space-y-8 px-4 py-12">
        <header className="space-y-1">
          <Link href="/" className="text-xs text-zinc-600 transition hover:text-zinc-400">
            ← Dashboard
          </Link>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-purple-500">Emotional Alchemy</p>
          <h1 className="text-2xl font-bold text-white">Charge Diagnostic</h1>
          <p className="text-sm text-zinc-500">Name what&apos;s live, get a clear read, then move.</p>
        </header>
        <DiagnoseClient />
      </div>
    </div>
  )
}
