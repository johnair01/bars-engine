'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  stewardTransitionContribution,
  type StewardTransitionAction,
} from '@/actions/the-crossing-support'
import { STATUS_META, type TheCrossingStatus } from '@/lib/the-crossing-support-moves'

export function ContributorFollowUp({
  barId,
  status,
}: {
  barId: string
  status: TheCrossingStatus
}) {
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function run(action: StewardTransitionAction, label: string, message?: string) {
    setError(null)
    startTransition(async () => {
      const result = await stewardTransitionContribution({ barId, action, message })
      if (result.success) {
        if (action === 'log_message') setDraft('')
        setToast(label)
        router.refresh()
        window.setTimeout(() => setToast(null), 1900)
      } else {
        setError(result.error)
      }
    })
  }

  const isTerminal = status === 'thanked'
  const canLog = draft.trim() !== '' && !isPending && !isTerminal

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#a09e98]">Follow up</h2>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        disabled={isTerminal}
        placeholder="Log what you sent, or jot a note for the board…"
        className="w-full rounded-[9px] border px-3 py-3 text-sm text-[#f4f2ec] outline-none placeholder:text-[#6b6965] focus:border-white/30 disabled:opacity-60"
        style={{ background: '#111110', borderColor: 'rgba(255,255,255,.12)' }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run('log_message', 'Message logged', draft)}
          disabled={!canLog}
          className="rounded-[10px] px-3.5 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
        >
          Log message
        </button>

        {status === 'new' ? (
          <ActionButton
            label="Mark contacted"
            color={STATUS_META.contacted.color}
            disabled={isPending}
            onClick={() => run('mark_contacted', 'Marked contacted')}
          />
        ) : null}

        {status === 'new' || status === 'contacted' ? (
          <ActionButton
            label="Accept offer"
            color={STATUS_META.accepted.color}
            disabled={isPending}
            onClick={() => run('accept', 'Offer accepted')}
          />
        ) : null}

        {!isTerminal && status !== 'declined' ? (
          <ActionButton
            label="Not needed"
            color={STATUS_META.declined.color}
            disabled={isPending}
            onClick={() => run('decline', 'Marked not needed')}
          />
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {toast ? (
        <div
          className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg"
          style={{ background: 'rgba(30,28,26,.96)', border: '1px solid rgba(255,255,255,.12)' }}
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </section>
  )
}

function ActionButton({
  label,
  color,
  disabled,
  onClick,
}: {
  label: string
  color: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[10px] border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
      style={{ borderColor: `${color}66`, color }}
    >
      {label}
    </button>
  )
}
