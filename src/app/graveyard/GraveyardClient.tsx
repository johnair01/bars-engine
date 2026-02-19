'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyNationMoveWithState, type ApplyNationMoveState } from '@/actions/nation-moves'

type DormantQuest = {
  id: string
  title: string
  description: string
  creator: { name: string }
  claimedById: string | null
}

export function GraveyardClient({
  isMetalNation,
  dormantQuests,
  collaborators,
}: {
  isMetalNation: boolean
  dormantQuests: DormantQuest[]
  collaborators: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [questId, setQuestId] = useState(dormantQuests[0]?.id || '')
  const [objectiveRewrite, setObjectiveRewrite] = useState('')
  const [collaboratorId, setCollaboratorId] = useState('')

  const [state, formAction, isPending] = useActionState<ApplyNationMoveState | null, FormData>(
    applyNationMoveWithState,
    null
  )

  const selectedQuest = useMemo(
    () => dormantQuests.find((q) => q.id === questId) || null,
    [dormantQuests, questId]
  )

  useEffect(() => {
    if (!state) return
    if ('ok' in state && state.ok) {
      setObjectiveRewrite('')
      setCollaboratorId('')
      router.refresh()
    }
  }, [state, router])

  return (
    <div className="space-y-8">
      {!isMetalNation && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-amber-200 text-sm">
          Your nation is not Metal. The MVP recycle move ("Reforge the Relic") is implemented for Metal Nation only.
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Reforge the Relic</h2>
          <div className="text-xs text-zinc-500 font-mono">Status: DORMANT -> ACTIVE</div>
        </div>

        {dormantQuests.length === 0 ? (
          <div className="text-zinc-500 italic">
            No dormant quests found.
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="moveKey" value="metal_reforge_the_relic" />

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Quest</label>
              <select
                name="questId"
                value={questId}
                onChange={(e) => setQuestId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                disabled={isPending}
              >
                {dormantQuests.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              {selectedQuest && (
                <div className="text-xs text-zinc-500 mt-2">
                  Created by {selectedQuest.creator.name}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Objective rewrite</label>
              <input
                name="objectiveRewrite"
                value={objectiveRewrite}
                onChange={(e) => setObjectiveRewrite(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                disabled={isPending}
                required
                maxLength={500}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Collaborator</label>
              <select
                name="collaboratorId"
                value={collaboratorId}
                onChange={(e) => setCollaboratorId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                disabled={isPending}
                required
              >
                <option value="">Select...</option>
                {collaborators.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending || !isMetalNation}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-bold text-white text-sm disabled:opacity-50"
            >
              {isPending ? 'Reforging...' : 'Reforge (Revive quest)'}
            </button>

            {state && 'error' in state && state.error && (
              <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
                {state.error}
              </div>
            )}

            {state && 'ok' in state && state.ok && (
              <div className="rounded-xl border border-green-900/60 bg-green-950/20 p-3 text-sm text-green-200">
                Revived. Created BAR: <span className="font-mono">{state.barTitle}</span>
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  )
}

