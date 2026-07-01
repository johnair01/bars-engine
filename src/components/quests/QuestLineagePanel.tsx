import type { LensGoalTrace } from '@/lib/lenses/lineage-types'

/**
 * QuestLineagePanel — shows how a quest hangs on the lens-goal hierarchy
 * (week → month → quarter → year) and whether it is aligned or a shadow quest.
 *
 * Presentational only (QLA Phase 2). The fold-in action for shadow quests lands
 * in Phase 3 (foldQuestIntoGoal); here we show the state + the chain.
 */

const CADENCE_LABEL: Record<string, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
}

export function QuestLineagePanel({
  trace,
  aligned,
}: {
  trace: LensGoalTrace | null
  aligned: boolean
}) {
  // Leaf (the goal the quest hangs on) first, then up the parent chain.
  const chain = trace ? [trace.goal, ...trace.parentChain] : []

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        aligned ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-amber-900/50 bg-amber-950/20'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">Lens alignment</span>
        {aligned ? (
          <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Aligned</span>
        ) : (
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400">Shadow quest</span>
        )}
      </div>

      {chain.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chain.map((node, i) => (
            <span key={node.id} className="flex items-center gap-1.5">
              <span className="rounded-md bg-zinc-900/70 border border-zinc-800 px-2 py-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 mr-1.5">
                  {CADENCE_LABEL[node.cadence] ?? node.cadence}
                </span>
                <span className="text-xs text-zinc-200">{node.title}</span>
              </span>
              {i < chain.length - 1 && <span className="text-zinc-600 text-xs">→</span>}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-200/80">
          This quest isn&rsquo;t tied to a weekly goal yet. Fold it into your lenses to bring it into
          alignment — or keep it as a shadow quest running outside your goals.
        </p>
      )}

      {trace && !aligned && (
        <p className="text-[11px] text-amber-200/70">
          Attached above the weekly level — a quest should hang on a <strong>week</strong> goal that
          rolls up. Re-anchor it to this week to align.
        </p>
      )}
    </div>
  )
}
