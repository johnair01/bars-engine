'use client'

/**
 * CommitmentWorkspace — the charge/blocker loop on a BAR that is a Tap the Vein
 * commitment.
 *
 * Player signal (2026-08-10, /bars/[id]):
 *   "Since these are tasks moving into this page should move users into being
 *    able to report a blocker and add context to the task as they are working on
 *    it. highlighting and overcoming blockers is the main game"
 *   "Need a way to complete quests when they are done in an easy way."
 * and (2026-08-10, /):
 *   "we need a process for assessing how much charge each committed item has and
 *    a link to do a process that can shrink the charge"
 *
 * The shrink-charge process is 3·2·1, entered against this commitment's artifact.
 * The player names the charge and names the blocker — nothing is inferred.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  addTaskContext,
  clearTaskBlocker,
  reportTaskBlocker,
  setTaskCharge,
  updateTaskStatus,
  type TtvTaskWorkspace,
} from '@/actions/tap-the-vein'
import { TTV_CHARGE_LEVELS, type TtvChargeLevel } from '@/lib/tap-the-vein/types'
import { blockedDays } from '@/lib/tap-the-vein/charge'

const CHARGE_COPY: Record<TtvChargeLevel, { label: string; hint: string; tone: string }> = {
  high: { label: 'High', hint: 'it grips me', tone: '#f87171' },
  medium: { label: 'Medium', hint: 'it tugs', tone: '#fbbf24' },
  low: { label: 'Low', hint: 'it moves', tone: '#4ade80' },
}

const NOTE_COPY: Record<string, { label: string; tone: string }> = {
  blocker: { label: 'Blocked', tone: 'text-red-400' },
  unblock: { label: 'Overcame', tone: 'text-emerald-400' },
  charge: { label: 'Charge', tone: 'text-amber-400' },
  context: { label: 'Context', tone: 'text-zinc-400' },
}

export function CommitmentWorkspace({ workspace }: { workspace: TtvTaskWorkspace }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'none' | 'blocker' | 'unblock' | 'context'>('none')
  const [body, setBody] = useState('')

  const { task, notes, shrinkChargeHref } = workspace
  const blocked = !!task.blockedAt
  const done = task.status === 'completed'
  const terminal = done || task.status === 'composted' || task.status === 'carried_over'

  const run = <T,>(fn: () => Promise<T | { error: string }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === 'object' && 'error' in res) {
        setError((res as { error: string }).error)
        return
      }
      after?.()
      router.refresh()
    })
  }

  const submitNote = () => {
    const text = body.trim()
    if (!text) {
      setError('Write a line first')
      return
    }
    const done = () => {
      setBody('')
      setMode('none')
    }
    if (mode === 'blocker') run(() => reportTaskBlocker({ taskId: task.id, body: text }), done)
    else if (mode === 'unblock') run(() => clearTaskBlocker({ taskId: task.id, body: text }), done)
    else run(() => addTaskContext({ taskId: task.id, body: text }), done)
  }

  return (
    <section
      className={`rounded-xl p-6 border space-y-5 ${
        blocked ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900/30 border-zinc-800'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Working this commitment</h2>
          <p className="text-xs text-zinc-500 mt-1">
            From Tap the Vein · {new Date(task.createdAt).toLocaleDateString()}
            {task.priorityRank ? ` · kept #${task.priorityRank}` : ''}
          </p>
        </div>
        {blocked && task.blockedAt ? (
          <span className="rounded-full border border-red-700/60 px-3 py-1 text-xs text-red-300">
            Blocked {blockedDays(task.blockedAt) === 0 ? 'today' : `${blockedDays(task.blockedAt)}d`}
          </span>
        ) : null}
        {done ? (
          <span className="rounded-full border border-emerald-700/60 px-3 py-1 text-xs text-emerald-300">
            Complete
          </span>
        ) : null}
      </div>

      {/* ── Charge ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
          How charged is it?
        </p>
        <div className="flex flex-wrap gap-2">
          {TTV_CHARGE_LEVELS.map((level) => {
            const active = task.chargeLevel === level
            const copy = CHARGE_COPY[level]
            return (
              <button
                key={level}
                type="button"
                disabled={pending || terminal}
                onClick={() => run(() => setTaskCharge({ taskId: task.id, chargeLevel: level }))}
                className="rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50 min-h-[44px]"
                style={{
                  borderColor: active ? copy.tone : 'var(--bars-line, #3f3f46)',
                  color: active ? copy.tone : '#a1a1aa',
                  background: active ? `color-mix(in srgb, ${copy.tone} 12%, transparent)` : 'transparent',
                }}
              >
                {copy.label}
                <span className="block text-[10px] text-zinc-500">{copy.hint}</span>
              </button>
            )
          })}
        </div>
        {task.chargeNote ? (
          <p className="text-xs text-zinc-400 mt-2 italic">{task.chargeNote}</p>
        ) : null}

        {task.chargeLevel && shrinkChargeHref && !terminal ? (
          <Link
            href={shrinkChargeHref}
            className="inline-flex items-center gap-2 mt-3 rounded-lg border border-fuchsia-700/50 px-3 py-2 text-sm text-fuchsia-300 hover:bg-fuchsia-950/30 min-h-[44px]"
          >
            Shrink the charge — run a 3·2·1 →
          </Link>
        ) : null}
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      {!terminal && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          {blocked ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setMode('unblock')
                setBody('')
              }}
              className="rounded-lg border border-emerald-700/60 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50 min-h-[44px]"
            >
              I got past it
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setMode('blocker')
                setBody('')
              }}
              className="rounded-lg border border-red-800/60 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50 min-h-[44px]"
            >
              Report a blocker
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode('context')
              setBody('')
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 min-h-[44px]"
          >
            Add context
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: 'completed' }))}
            className="ml-auto rounded-lg border border-emerald-600/70 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50 min-h-[44px]"
          >
            {pending ? 'Saving…' : 'Mark it done'}
          </button>
        </div>
      )}

      {mode !== 'none' && (
        <div className="space-y-2">
          <label htmlFor="commitment-note" className="block text-sm text-zinc-400">
            {mode === 'blocker'
              ? 'What is in the way?'
              : mode === 'unblock'
                ? 'How did you get past it?'
                : 'What should future-you know?'}
          </label>
          <textarea
            id="commitment-note"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            autoFocus
            disabled={pending}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm p-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
            placeholder={
              mode === 'blocker'
                ? 'Waiting on someone, missing a decision, too big to start…'
                : mode === 'unblock'
                  ? 'The move that shifted it — this is the part worth keeping'
                  : 'Where you left off, what you learned…'
            }
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitNote}
              disabled={pending}
              className="rounded-lg border border-slate-500/60 bg-zinc-900/80 px-4 py-2 text-sm text-slate-100 hover:bg-zinc-800 disabled:opacity-50 min-h-[44px]"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('none')
                setBody('')
                setError(null)
              }}
              disabled={pending}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {/* ── The log ────────────────────────────────────────────────────────── */}
      {notes.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
            How this one has gone
          </p>
          <ul className="space-y-3">
            {notes.map((note) => {
              const copy = NOTE_COPY[note.kind] ?? NOTE_COPY.context
              return (
                <li key={note.id} className="text-sm">
                  <div className="flex flex-wrap items-baseline gap-2 text-[11px]">
                    <span className={`uppercase tracking-widest ${copy.tone}`}>{copy.label}</span>
                    {note.chargeLevel ? (
                      <span className="text-zinc-600">charge {note.chargeLevel}</span>
                    ) : null}
                    <span className="text-zinc-600 ml-auto">
                      {new Date(note.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap mt-1 border-l-2 border-zinc-800 pl-3">
                    {note.body}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
