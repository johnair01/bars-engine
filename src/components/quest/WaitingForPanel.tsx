'use client'

import { useState } from 'react'
import {
  WAITING_FOR_KINDS,
  WAITING_FOR_KIND_LABELS,
  type WaitingForKind,
  type WaitingForState,
} from '@/lib/quest-waiting-for'
import {
  clearWaitingFor,
  recordWaitingForPing,
  setWaitingFor,
} from '@/actions/quest-waiting-for'

type Props = {
  questId: string
  initialWaitingFor: WaitingForState | null
  onChanged?: () => void
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function WaitingForPanel({ questId, initialWaitingFor, onChanged }: Props) {
  const [waitingFor, setWaitingForState] = useState<WaitingForState | null>(initialWaitingFor)
  const [expanded, setExpanded] = useState(!initialWaitingFor)
  const [kind, setKind] = useState<WaitingForKind>('person')
  const [label, setLabel] = useState('')
  const [askedFor, setAskedFor] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2000)
  }

  const handleSave = async () => {
    setBusy(true)
    const res = await setWaitingFor({
      questId,
      kind,
      label,
      askedFor: askedFor || undefined,
      followUpAt: followUpAt || undefined,
    })
    setBusy(false)
    if ('success' in res) {
      const next: WaitingForState = {
        kind,
        label: label.trim(),
        since: new Date().toISOString(),
        askedFor: askedFor.trim() || undefined,
        followUpAt: followUpAt || undefined,
      }
      setWaitingForState(next)
      setExpanded(false)
      showFeedback('Marked — ball elsewhere for now')
      onChanged?.()
    } else {
      showFeedback(`❌ ${res.error}`)
    }
  }

  const handleClear = async () => {
    setBusy(true)
    const res = await clearWaitingFor(questId)
    setBusy(false)
    if ('success' in res) {
      setWaitingForState(null)
      setLabel('')
      setAskedFor('')
      setFollowUpAt('')
      setExpanded(true)
      showFeedback('Back in your hands')
      onChanged?.()
    } else {
      showFeedback(`❌ ${res.error}`)
    }
  }

  const handlePing = async () => {
    setBusy(true)
    const res = await recordWaitingForPing(questId)
    setBusy(false)
    if ('success' in res) {
      setWaitingForState((prev) => (prev ? { ...prev, lastPingAt: res.lastPingAt } : prev))
      showFeedback('Noted in your quest log')
      onChanged?.()
    } else {
      showFeedback(`❌ ${res.error}`)
    }
  }

  return (
    <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 overflow-hidden">
      {!waitingFor ? (
        <div className="p-4 space-y-3">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full text-left"
            >
              <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">
                Ball elsewhere?
              </p>
              <p className="text-xs text-sky-100/80">
                Mark when someone outside the game holds the next step.
              </p>
            </button>
          ) : (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">
                  Waiting on
                </p>
                <p className="text-xs text-zinc-400 mb-3">
                  External blocker — not another player in the game.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 col-span-2">
                  Who or what
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as WaitingForKind)}
                  className="col-span-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                >
                  {WAITING_FOR_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {WAITING_FOR_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Landlord, IRS, client reply"
                  className="col-span-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                />
                <input
                  type="text"
                  value={askedFor}
                  onChange={(e) => setAskedFor(e.target.value)}
                  placeholder="What you asked for (optional)"
                  className="col-span-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                />
                <input
                  type="date"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className="col-span-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                  aria-label="Follow up after (optional)"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={!label.trim() || busy}
                  onClick={handleSave}
                  className="rounded-lg bg-sky-700 hover:bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Mark waiting-on'}
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest px-2"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-1">
              Waiting on
            </p>
            <p className="text-sm text-sky-100 font-medium">{waitingFor.label}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {WAITING_FOR_KIND_LABELS[waitingFor.kind]} · since {formatRelativeDate(waitingFor.since)}
            </p>
            {waitingFor.askedFor && (
              <p className="text-xs text-zinc-400 mt-2">Asked for: {waitingFor.askedFor}</p>
            )}
            {waitingFor.followUpAt && (
              <p className="text-xs text-zinc-400">Follow up after: {waitingFor.followUpAt}</p>
            )}
            {waitingFor.lastPingAt && (
              <p className="text-xs text-zinc-500 mt-1">
                Last noted: {formatRelativeDate(waitingFor.lastPingAt)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handlePing}
              className="rounded-lg border border-sky-800 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900/40 disabled:opacity-50"
            >
              Note a follow-up
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleClear}
              className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest px-2"
            >
              Back in my hands
            </button>
          </div>
        </div>
      )}
      {feedback && <p className="px-4 pb-3 text-xs text-zinc-400">{feedback}</p>}
    </div>
  )
}
