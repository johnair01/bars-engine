import Link from 'next/link'
import { DiagnoseClient } from './DiagnoseClient'
import { seedFromParams } from '@/lib/emotional-alchemy'

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
 * Spec: .specify/specs/emotional-alchemy-diagnostic/spec.md + emotional-alchemy-service
 * Accepts a service seed via query params (?src=&ch=&i=&thread=&card=&bar=&return=)
 * — seedFromParams validates it; the flow skips seeded steps and logs against the
 * charge BAR when present (Phase 1).
 */
export default async function DiagnosePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') usp.set(k, v)
    else if (Array.isArray(v) && v[0] != null) usp.set(k, v[0])
  }
  const seed = usp.toString() ? seedFromParams(usp) : undefined

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
        <DiagnoseClient seed={seed} />
      </div>
    </div>
  )
}
