'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { commitTask, promoteTaskToBar, saveBrainstorm, updateTaskStatus } from '@/actions/tap-the-vein'
import { getLensDomain, isLensDomainKey } from '@/lib/lenses/domains'
import { isLensGoalTrace, type LensGoalTrace } from '@/lib/lenses/lineage-types'
import { MAX_TASKS_PER_DAY } from '@/lib/tap-the-vein/constants'
import type { TtvTaskDTO, TtvToday } from '@/lib/tap-the-vein/types'

function sourceLabel(source: string) {
  switch (source) {
    case 'live':
      return 'Current thread'
    case 'plant_snapshot':
      return 'Planted then'
    case 'attach_snapshot':
      return 'Attached then'
    default:
      return 'Lens thread'
  }
}

function TracePanel({
  trace,
  fallbackTitle,
  fallbackDomain,
}: {
  trace: LensGoalTrace | null
  fallbackTitle?: string | null
  fallbackDomain?: TtvTaskDTO['lensGoalDomain']
}) {
  if (!trace) {
    if (!fallbackTitle || !fallbackDomain) return null
    return (
      <p className="mt-2 text-xs leading-5 text-[#a09e98]">
        Resonates with {getLensDomain(fallbackDomain).label}: {fallbackTitle}
      </p>
    )
  }

  const domain = isLensDomainKey(trace.goal.domain) ? getLensDomain(trace.goal.domain) : null
  const path = [...trace.parentChain].reverse().map((node) => node.title).concat(trace.goal.title)

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#7c3aed]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d8b4fe]">
          {sourceLabel(trace.source)}
        </span>
        {domain && <span className="text-xs text-[#a09e98]">{domain.label}</span>}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#a09e98]">{path.join(' -> ')}</p>
    </div>
  )
}

function TraceLine({ task }: { task: TtvTaskDTO }) {
  return <TracePanel trace={task.lensGoalTrace} fallbackTitle={task.lensGoalTitle} fallbackDomain={task.lensGoalDomain} />
}

export function TapTheVeinClient({ initial }: { initial: TtvToday }) {
  const router = useRouter()
  const [rawEntry, setRawEntry] = useState(initial.rawEntry)
  const [taskText, setTaskText] = useState('')
  const [lensGoalId, setLensGoalId] = useState(initial.lensGoals[0]?.id ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [plantedTrace, setPlantedTrace] = useState<{ barId: string; trace: LensGoalTrace | null } | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(action: () => Promise<{ error?: string } | unknown>, success?: string) {
    setMessage(null)
    setPlantedTrace(null)
    startTransition(async () => {
      const result = await action()
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        setMessage(String(result.error))
        return
      }
      setMessage(success ?? null)
      router.refresh()
    })
  }

  function plantTask(taskId: string) {
    setMessage(null)
    setPlantedTrace(null)
    startTransition(async () => {
      const result = await promoteTaskToBar(taskId)
      if ('error' in result) {
        setMessage(result.error)
        return
      }
      const trace = isLensGoalTrace(result.plantSnapshot) ? result.plantSnapshot : null
      setPlantedTrace({ barId: result.barId, trace })
      setMessage('Planted as BAR.')
      router.refresh()
    })
  }

  const liveTaskCount = initial.tasks.filter((task) => task.status === 'committed' || task.status === 'in_progress').length

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-6 text-[#e8e6e0]">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#a855f7]">Tap the Vein - today</p>
          <h1 className="text-3xl font-black leading-tight">What&apos;s bubbling up?</h1>
          <p className="text-sm leading-7 text-[#a09e98]">
            Capture the day as it comes. Then let your Lenses show which year-frame goal a task quietly serves.
          </p>
        </header>

        <section className="rounded-xl border border-white/10 bg-[#1a1a18] p-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a855f7]">Free-write</label>
          <textarea
            value={rawEntry}
            onChange={(event) => setRawEntry(event.target.value)}
            placeholder="Write the charge of the day. Messy is fine."
            className="mt-3 min-h-40 w-full rounded-lg border border-white/10 bg-[#111110] p-4 text-sm leading-7 outline-none focus:border-[#7c3aed]"
          />
          <button
            className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-[#d8b4fe]"
            disabled={isPending}
            onClick={() => run(() => saveBrainstorm(rawEntry), 'Saved.')}
          >
            Save free-write
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#1a1a18] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a855f7]">Keep actions</p>
              <h2 className="mt-1 text-xl font-black">{liveTaskCount}/{MAX_TASKS_PER_DAY} kept</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              placeholder="One action worth keeping today..."
              className="w-full rounded-lg border border-white/10 bg-[#111110] p-3 text-sm outline-none focus:border-[#7c3aed]"
            />
            <select
              value={lensGoalId}
              onChange={(event) => setLensGoalId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111110] p-3 text-sm text-[#e8e6e0] outline-none focus:border-[#7c3aed]"
            >
              <option value="">No lens goal attached yet</option>
              {initial.lensGoals.map((goal) => {
                const domain = getLensDomain(goal.domain)
                return (
                  <option key={goal.id} value={goal.id}>
                    {domain.label} / {goal.cadence}: {goal.title}
                  </option>
                )
              })}
            </select>
            <button
              className="w-full rounded-lg bg-[#7c3aed] px-5 py-3 font-bold text-white disabled:opacity-40"
              disabled={isPending || liveTaskCount >= MAX_TASKS_PER_DAY}
              onClick={() =>
                run(
                  async () => {
                    const result = await commitTask({ text: taskText, lensGoalId: lensGoalId || null })
                    if (!('error' in result)) setTaskText('')
                    return result
                  },
                  'Task kept.',
                )
              }
            >
              Keep as task
            </button>
          </div>
        </section>

        {message && <p className="rounded-lg border border-white/10 bg-[#111110] p-3 text-sm text-[#d8b4fe]">{message}</p>}

        {plantedTrace && (
          <section className="rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8b4fe]">BAR planted</p>
            <p className="mt-2 text-sm text-[#e8e6e0]">This BAR is now tied to its Lens thread.</p>
            <TracePanel trace={plantedTrace.trace} />
          </section>
        )}

        <section className="space-y-3">
          {initial.tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-[#a09e98]">
              No tasks kept yet.
            </div>
          ) : (
            initial.tasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-white/10 bg-[#1a1a18] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{task.text}</p>
                    <TraceLine task={task} />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">
                      {task.status.replace(/_/g, ' ')} {task.priorityRank ? `- rank ${task.priorityRank}` : ''}
                    </p>
                  </div>
                  {task.barId && <span className="rounded-full border border-[#7c3aed]/40 px-2 py-1 text-[10px] text-[#d8b4fe]">BAR</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#e8e6e0]"
                    disabled={isPending}
                    onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'completed' }), 'Completed.')}
                  >
                    Complete
                  </button>
                  <button
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#e8e6e0]"
                    disabled={isPending}
                    onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'composted', compostReason: 'other' }), 'Composted.')}
                  >
                    Park/compost
                  </button>
                  <button
                    className="rounded-lg bg-[#7c3aed] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    disabled={isPending || !!task.barId}
                    onClick={() => plantTask(task.id)}
                  >
                    Plant as BAR
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
