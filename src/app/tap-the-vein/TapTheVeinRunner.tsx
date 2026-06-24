'use client'

/**
 * Tap the Vein — functional runner SKELETON (Layer A).
 *
 * ⚠️ DESIGN SEAM: the markup below is deliberately minimal and unstyled. It wires
 * the full ritual state machine to the server actions so the flow works
 * end-to-end. The visual layer — pre-card free-write well, seed/growing/composted
 * task cards via CultivationCard, the commit "raw → formed" moment, the
 * upgrade-to-quest Ritual state, and the NOW panel — is specified for Claude
 * design to build and should REPLACE this placeholder UI:
 *
 *   docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md
 *
 * Three-channel mapping (element/altitude/stage per task status) lives in that
 * spec §2. `nationElement` is passed through for the eventual element accent.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  type TtvToday,
  type TtvTaskDTO,
  MAX_TASKS_PER_DAY,
  saveBrainstorm,
  commitTask,
  updateTaskStatus,
  carryTask,
  upgradeTaskToQuest,
  sealSession,
} from '@/actions/tap-the-vein'

const COMPOST_REASONS = [
  'not_relevant',
  'already_done',
  'assigned_elsewhere',
  'too_small',
  'too_big',
  'other',
] as const

type Props = {
  initial: TtvToday
  nationElement: string | null
}

export function TapTheVeinRunner({ initial, nationElement: _nationElement }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [rawEntry, setRawEntry] = useState(initial.rawEntry)
  const [draft, setDraft] = useState('')
  const sealed = initial.status === 'sealed'

  const liveTasks = initial.tasks.filter((t) => t.status !== 'composted')
  const atCap = liveTasks.length >= MAX_TASKS_PER_DAY

  const run = <T,>(fn: () => Promise<T | { error: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === 'object' && 'error' in res) {
        setError((res as { error: string }).error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition text-xs uppercase tracking-widest">
            ← Back
          </Link>
          <span className="text-zinc-700 text-xs font-mono">Tap the Vein · {initial.sessionDate}</span>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-zinc-700 font-mono uppercase tracking-widest">Morning ritual</p>
          <h1 className="text-2xl font-bold text-white">Tap the Vein</h1>
          <p className="text-zinc-500 text-xs leading-relaxed pt-1">
            Free-write the day&rsquo;s charge, then commit up to {MAX_TASKS_PER_DAY} tasks you&rsquo;ll actually do.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Phase B — brainstorm (pre-card well) */}
        <section className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600">Brainstorm</h2>
          <textarea
            value={rawEntry}
            onChange={(e) => setRawEntry(e.target.value)}
            onBlur={() => run(() => saveBrainstorm(rawEntry))}
            disabled={sealed || pending}
            rows={8}
            placeholder="Dump the morning charge…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 disabled:opacity-50"
          />
          <p className="text-[10px] text-zinc-500 font-mono">
            {rawEntry.trim().split(/\s+/).filter(Boolean).length} words · 750 is the daily floor
          </p>
        </section>

        {/* Phase C — commit (raw → seed) */}
        {!sealed && (
          <section className="space-y-2">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-600">
              Commit ({liveTasks.length} / {MAX_TASKS_PER_DAY})
            </h2>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={atCap || pending}
                placeholder={atCap ? 'Daily cap reached — compost one to make room' : 'A task you will do today…'}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim() && !atCap) {
                    run(async () => {
                      const r = await commitTask({ text: draft })
                      if (!('error' in r)) setDraft('')
                      return r
                    })
                  }
                }}
              />
              <button
                type="button"
                disabled={!draft.trim() || atCap || pending}
                onClick={() =>
                  run(async () => {
                    const r = await commitTask({ text: draft })
                    if (!('error' in r)) setDraft('')
                    return r
                  })
                }
                className="px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-700/50 text-sm text-purple-200 disabled:opacity-40"
              >
                Commit
              </button>
            </div>
          </section>
        )}

        {/* Phase D — work the tasks */}
        <section className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600">Today&rsquo;s tasks</h2>
          {initial.tasks.length === 0 && <p className="text-xs text-zinc-600">No tasks committed yet.</p>}
          <div className="space-y-2">
            {initial.tasks.map((task) => (
              <TaskRow key={task.id} task={task} pending={pending} sealed={sealed} run={run} />
            ))}
          </div>
        </section>

        {/* Phase E — seal */}
        {!sealed ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => sealSession())}
            className="w-full py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-sm text-zinc-200 disabled:opacity-50"
          >
            Seal the day
          </button>
        ) : (
          <p className="text-center text-sm text-emerald-400">The vein is tapped — today is sealed.</p>
        )}
      </div>
    </div>
  )
}

const TERMINAL = new Set([
  'completed',
  'carried_over',
  'composted',
  'assigned_to_campaign',
  'upgraded_to_quest',
])

function TaskRow({
  task,
  pending,
  sealed,
  run,
}: {
  task: TtvTaskDTO
  pending: boolean
  sealed: boolean
  run: <T>(fn: () => Promise<T | { error: string }>) => void
}) {
  const [composting, setComposting] = useState(false)
  const isTerminal = TERMINAL.has(task.status)

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={isTerminal ? 'text-zinc-500 line-through' : 'text-zinc-200'}>
          {task.isCarried && <span className="text-[10px] text-amber-400 mr-1">carried ×{task.carryCount}</span>}
          {task.text}
        </span>
        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{task.status.replace(/_/g, ' ')}</span>
      </div>

      {!isTerminal && !sealed && (
        <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
          {task.status === 'committed' && (
            <Action label="Start" onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'in_progress' }))} pending={pending} />
          )}
          <Action label="Complete" onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'completed' }))} pending={pending} />
          <Action label="Carry →" onClick={() => run(() => carryTask(task.id))} pending={pending} />
          <Action label="Compost" onClick={() => setComposting((v) => !v)} pending={pending} />
          <Action label="Upgrade to quest" onClick={() => run(() => upgradeTaskToQuest(task.id))} pending={pending} />
        </div>
      )}

      {composting && (
        <div className="flex flex-wrap gap-1 mt-2">
          {COMPOST_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={pending}
              onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'composted', compostReason: reason }))}
              className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 disabled:opacity-40"
            >
              {reason.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Action({ label, onClick, pending }: { label: string; onClick: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
    >
      {label}
    </button>
  )
}
