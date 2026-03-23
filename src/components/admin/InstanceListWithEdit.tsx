'use client'

import { useState } from 'react'
import { setActiveInstance, updateInstanceKotterStage, updateInstanceFundraise } from '@/actions/instance'
import { KOTTER_STAGES } from '@/lib/kotter'
import { InstanceEditModal } from './InstanceEditModal'
import { InviteToRoleModal } from './InviteToRoleModal'

type Instance = {
  id: string
  slug: string
  name: string
  domainType: string
  allyshipDomain?: string | null
  theme: string | null
  targetDescription: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  campaignRef: string | null
  goalAmountCents: number | null
  currentAmountCents: number
  kotterStage: number
  isEventMode: boolean
  stripeOneTimeUrl: string | null
  patreonUrl: string | null
  venmoUrl: string | null
  cashappUrl: string | null
  paypalUrl: string | null
  moveIds?: string
  sourceInstanceId?: string | null
  parentInstanceId?: string | null
  linkedInstanceId?: string | null
  goalData?: string | null
  childInstances?: Instance[]
}

type PromotedMove = { id: string; key: string; name: string }

function InstanceCard({
  inst,
  activeInstanceId,
  onEdit,
  onInvite,
  onProgress,
  progressInstance,
}: {
  inst: Instance
  activeInstanceId: string | null
  onEdit: (i: Instance) => void
  onInvite: (i: Instance) => void
  onProgress: (i: Instance | null) => void
  progressInstance: Instance | null
}) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-3 flex flex-col gap-3">
      <div className="min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-white text-sm">{inst.name}</div>
            {inst.isEventMode && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-300">
                Event Mode
              </span>
            )}
            {activeInstanceId === inst.id && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-900/30 text-purple-300">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-1 truncate">
            {inst.slug} • {inst.domainType} • {inst.id}
          </div>
          <div className="text-xs text-teal-400 mt-1">
            Stage {inst.kotterStage ?? 1}: {KOTTER_STAGES[(inst.kotterStage ?? 1) as keyof typeof KOTTER_STAGES]?.name ?? 'Urgency'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => onEdit(inst)}
            className="px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 text-xs font-bold border border-emerald-700 min-h-[44px]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onInvite(inst)}
            className="px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 text-xs font-bold border border-purple-700 min-h-[44px]"
          >
            Invite to role
          </button>
          <button
            type="button"
            onClick={() => onProgress(progressInstance?.id === inst.id ? null : inst)}
            className="px-3 py-1.5 rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 text-xs font-bold border border-amber-700 min-h-[44px]"
          >
            Update $
          </button>
          <form action={updateInstanceKotterStage} className="flex items-center gap-2">
            <input type="hidden" name="instanceId" value={inst.id} />
            <select name="kotterStage" className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 min-h-[44px]" defaultValue={inst.kotterStage ?? 1}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}. {KOTTER_STAGES[n as keyof typeof KOTTER_STAGES].name}
                </option>
              ))}
            </select>
            <button type="submit" className="px-2 py-1 rounded bg-teal-900/50 hover:bg-teal-800/50 text-teal-300 text-xs font-bold border border-teal-700 min-h-[44px]">
              Set Stage
            </button>
          </form>
          <form action={setActiveInstance}>
            <input type="hidden" name="instanceId" value={inst.id} />
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold min-h-[44px]">
              Set Active
            </button>
          </form>
        </div>
      </div>
      {progressInstance?.id === inst.id && (
        <ProgressForm
          instance={inst}
          onClose={() => onProgress(null)}
        />
      )}
    </div>
  )
}

export function InstanceListWithEdit({
  instances,
  activeInstanceId,
  promotedMoves,
}: {
  instances: Instance[]
  activeInstanceId: string | null
  promotedMoves: PromotedMove[]
}) {
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null)
  const [progressInstance, setProgressInstance] = useState<Instance | null>(null)
  const [inviteInstance, setInviteInstance] = useState<Instance | null>(null)

  if (instances.length === 0) {
    return (
      <div className="text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl p-6">
        No instances found. If you just deployed, run <span className="font-mono">prisma db push</span> and refresh.
      </div>
    )
  }

  const topLevel = instances.filter((i) => !i.parentInstanceId)

  return (
    <>
      <div className="space-y-3">
        {topLevel.map((inst) => (
          <div key={inst.id} className="space-y-3">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-white">{inst.name}</div>
                {inst.isEventMode && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-300">
                    Event Mode
                  </span>
                )}
                {activeInstanceId === inst.id && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-900/30 text-purple-300">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-1 truncate">
                {inst.slug} • {inst.domainType} • {inst.id}
              </div>
              <div className="text-xs text-teal-400 mt-1">
                Stage {inst.kotterStage ?? 1}: {KOTTER_STAGES[(inst.kotterStage ?? 1) as keyof typeof KOTTER_STAGES]?.name ?? 'Urgency'}
              </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setEditingInstance(inst)}
                className="px-4 py-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 text-xs font-bold border border-emerald-700 min-h-[44px]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setInviteInstance(inst)}
                className="px-4 py-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 text-xs font-bold border border-purple-700 min-h-[44px]"
              >
                Invite to role
              </button>
              <button
                type="button"
                onClick={() => setProgressInstance(progressInstance?.id === inst.id ? null : inst)}
                className="px-4 py-2 rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 text-xs font-bold border border-amber-700 min-h-[44px]"
              >
                Update $
              </button>
              <form action={updateInstanceKotterStage} className="flex items-center gap-2">
                <input type="hidden" name="instanceId" value={inst.id} />
                <select name="kotterStage" className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 min-h-[44px]" defaultValue={inst.kotterStage ?? 1}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}. {KOTTER_STAGES[n as keyof typeof KOTTER_STAGES].name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="px-2 py-1 rounded bg-teal-900/50 hover:bg-teal-800/50 text-teal-300 text-xs font-bold border border-teal-700 min-h-[44px]">
                  Set Stage
                </button>
              </form>
              <form action={setActiveInstance}>
                <input type="hidden" name="instanceId" value={inst.id} />
                <button type="submit" className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold min-h-[44px]">
                  Set Active
                </button>
              </form>
              <form action={setActiveInstance}>
                <input type="hidden" name="instanceId" value="" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold min-h-[44px]">
                  Clear
                </button>
              </form>
              </div>
            </div>

            {progressInstance?.id === inst.id && (
              <ProgressForm
                instance={inst}
                onClose={() => setProgressInstance(null)}
              />
            )}
            </div>

          {inst.childInstances && inst.childInstances.length > 0 && (
            <div className="ml-4 pl-4 border-l-2 border-zinc-700 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Pre-production crews
              </div>
              {inst.childInstances.map((child) => (
                <InstanceCard
                  key={child.id}
                  inst={child}
                  activeInstanceId={activeInstanceId}
                  onEdit={setEditingInstance}
                  onInvite={setInviteInstance}
                  onProgress={setProgressInstance}
                  progressInstance={progressInstance}
                />
              ))}
            </div>
          )}
          </div>
        ))}
      </div>

      {editingInstance && (
        <InstanceEditModal
          instance={editingInstance}
          promotedMoves={promotedMoves}
          instances={instances}
          onClose={() => setEditingInstance(null)}
        />
      )}

      {inviteInstance && (
        <InviteToRoleModal
          instance={inviteInstance}
          onClose={() => setInviteInstance(null)}
        />
      )}
    </>
  )
}

function ProgressForm({ instance, onClose }: { instance: Instance; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const currentDollars = (instance.currentAmountCents / 100).toString()
  const goalDollars = instance.goalAmountCents != null ? (instance.goalAmountCents / 100).toString() : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await updateInstanceFundraise(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    window.location.reload()
  }

  return (
    <div className="w-full mt-2 p-3 bg-zinc-950 border border-zinc-700 rounded-lg">
      {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <input type="hidden" name="instanceId" value={instance.id} />
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-zinc-500">Current $</label>
          <input name="currentAmount" type="text" inputMode="decimal" defaultValue={currentDollars} placeholder="0" className="w-24 bg-black border border-zinc-700 rounded px-2 py-1 text-white text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-zinc-500">Goal $</label>
          <input name="goalAmount" type="text" inputMode="decimal" defaultValue={goalDollars} placeholder="3000" className="w-24 bg-black border border-zinc-700 rounded px-2 py-1 text-white text-sm" />
        </div>
        <button type="submit" className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold min-h-[44px]">
          Save
        </button>
        <button type="button" onClick={onClose} className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold min-h-[44px]">
          Cancel
        </button>
      </form>
    </div>
  )
}
