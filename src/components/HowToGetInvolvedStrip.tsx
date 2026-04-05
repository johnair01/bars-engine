import Link from 'next/link'

/**
 * Compact "How to get involved" strip for the event page.
 * Spec: .specify/specs/clarity-efa-initial-flows/spec.md
 */
export function HowToGetInvolvedStrip() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest">How to get involved</h3>
      <ul className="space-y-2 text-sm text-zinc-300">
        <li>
          <Link href="/campaign/board?ref=bruised-banana" className="text-emerald-400 hover:text-emerald-300 underline">
            Play quests on the Gameboard
          </Link>
          {' — complete them and you\'re helping the residency.'}
        </li>
        <li>
          <Link href="/emotional-first-aid" className="text-cyan-400 hover:text-cyan-300 underline">
            Try Emotional First Aid when stuck
          </Link>
          {' — 2 minutes to unblock.'}
        </li>
        <li>
          Donate above — directly support the residency.
        </li>
      </ul>
    </div>
  )
}
