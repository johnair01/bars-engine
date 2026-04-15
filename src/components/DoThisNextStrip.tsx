import Link from 'next/link'

type DoThisNextStripProps = {
  /** New player = no completed quests */
  isNewPlayer: boolean
  /** Has at least one active quest (excluding system quests) */
  hasActiveQuest: boolean
  /** Global story stage for residency copy */
  globalStage: number
}

/**
 * Compact "Do this next" strip for the dashboard.
 * Spec: .specify/specs/clarity-efa-initial-flows/spec.md
 */
export function DoThisNextStrip({ isNewPlayer, hasActiveQuest, globalStage }: DoThisNextStripProps) {
  const stageLabel = globalStage >= 1 && globalStage <= 8 ? `Stage ${globalStage}` : 'Stage 1'

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Do this next</h3>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          {isNewPlayer ? (
            <>
              <p className="text-sm text-zinc-200">
                New here?{' '}
                <Link href="/emotional-first-aid" className="text-cyan-400 hover:text-cyan-300 font-medium underline">
                  Start with Emotional First Aid
                </Link>
                {' — 2 minutes to unblock.'}
              </p>
            </>
          ) : hasActiveQuest ? (
            <p className="text-sm text-zinc-200">
              <Link href="/campaign/board?ref=bruised-banana" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
                Continue your quest on the Gameboard
              </Link>
            </p>
          ) : (
            <p className="text-sm text-zinc-200">
              <Link href="/campaign/board?ref=bruised-banana" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
                Pick a quest on the Gameboard
              </Link>
            </p>
          )}
          <p className="text-xs text-zinc-500">
            Bruised Banana: {stageLabel} — Your quests move us forward.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isNewPlayer && (
            <Link
              href="/emotional-first-aid"
              className="px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-700/50 hover:border-cyan-500 text-cyan-200 text-sm font-medium transition"
            >
              Try EFA
            </Link>
          )}
          <Link
            href="/campaign/board?ref=bruised-banana"
            className="px-4 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700/50 hover:border-emerald-500 text-emerald-200 text-sm font-medium transition"
          >
            Gameboard
          </Link>
        </div>
      </div>
    </div>
  )
}
