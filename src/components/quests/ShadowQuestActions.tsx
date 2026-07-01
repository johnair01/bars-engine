'use client'

/**
 * ShadowQuestActions — fold a shadow quest into a weekly goal, or knowingly keep
 * it as a shadow (QLA Phase 3). Client island over the quests server actions.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { foldQuestIntoGoal, acknowledgeShadowQuest, type WeeklyGoalOption } from '@/actions/quests'

export function ShadowQuestActions({
  questId,
  acknowledged,
  weeklyGoals,
}: {
  questId: string
  acknowledged: boolean
  weeklyGoals: WeeklyGoalOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [goalId, setGoalId] = useState(weeklyGoals[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const fold = () => {
    if (!goalId) return
    setError(null)
    startTransition(async () => {
      const res = await foldQuestIntoGoal({ questId, weeklyLensGoalId: goalId })
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  const acknowledge = () => {
    setError(null)
    startTransition(async () => {
      const res = await acknowledgeShadowQuest(questId)
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {weeklyGoals.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            disabled={pending}
            className="min-h-[38px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
          >
            {weeklyGoals.map((g) => (
              <option key={g.id} value={g.id}>{g.domain}: {g.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={fold}
            disabled={pending || !goalId}
            className="min-h-[38px] rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
          >
            Fold into this week
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          No weekly goals yet — <a href="/lenses" className="text-purple-400 underline">set one in Lenses</a> to fold this in.
        </p>
      )}

      {!acknowledged && (
        <button
          type="button"
          onClick={acknowledge}
          disabled={pending}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 underline disabled:opacity-50"
        >
          Keep as a shadow quest
        </button>
      )}
      {acknowledged && (
        <p className="text-[11px] text-amber-400/80">Kept as a shadow — running outside your weekly goals.</p>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
