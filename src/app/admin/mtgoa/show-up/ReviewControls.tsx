'use client'

import { useState, useTransition } from 'react'

import { reviewShowUpHandoff } from '@/actions/mtgoa-show-up-handoff'
import { SHOW_UP_SUBMISSION_STATUSES } from '@/lib/mtgoa-course/show-up-handoff'

/**
 * Steward review: a status and a private note.
 *
 * `withdrawn` is absent from the options on purpose — only the sender can
 * withdraw, and the server action rejects it as well.
 */
export function ReviewControls({
  id,
  status,
  stewardNote,
}: {
  id: string
  status: string
  stewardNote: string
}) {
  const [pending, start] = useTransition()
  const [nextStatus, setNextStatus] = useState(status)
  const [note, setNote] = useState(stewardNote)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-900 bg-black/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`status-${id}`} className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          status
        </label>
        <select
          id={`status-${id}`}
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
        >
          {SHOW_UP_SUBMISSION_STATUSES.filter((s) => s.key !== 'withdrawn').map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await reviewShowUpHandoff({ id, status: nextStatus, stewardNote: note })
              setSaved(result.ok ? 'Saved.' : result.error)
            })
          }
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          Save
        </button>
        {saved ? <span className="text-xs text-zinc-500">{saved}</span> : null}
      </div>
      <textarea
        aria-label="Steward note, private"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Steward note — private, and never shown to the sender."
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-300"
      />
    </div>
  )
}
