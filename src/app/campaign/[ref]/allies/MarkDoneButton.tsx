'use client'

/**
 * MarkDoneButton — the steward's loop-closing control.
 *
 * Completion is steward-attested on purpose: self-attested completion is how a
 * bounty economy stops meaning anything. Marking done flips the need, banks its
 * bounty to the claimant's vibeulon ledger, and advances the milestone bar — see
 * `markNeedDone`.
 *
 * Deliberately one-way in the UI. Un-completing would need to un-bank a bounty
 * and roll a milestone backwards, which is a real decision with real semantics,
 * not a button. Fix a mistake in the database.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markNeedDone } from '@/actions/ally-campaign'

export function MarkDoneButton({
  needId,
  label,
  bountyVibeulons,
}: {
  needId: string
  label: string
  bountyVibeulons: number
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function complete() {
    setError(null)
    startTransition(async () => {
      const res = await markNeedDone(needId)
      if (!res.ok) {
        setError(res.error ?? 'Could not mark that done.')
        setConfirming(false)
        return
      }
      router.refresh()
    })
  }

  if (error) {
    return (
      <span className="text-[12px]" style={{ color: '#e28b8b' }}>
        {error}
      </span>
    )
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-white/10"
        style={{ color: '#a09e98', border: '1px solid rgba(255,255,255,.14)' }}
      >
        mark done
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[11px]" style={{ color: '#6b6862' }}>
        {label} — banks {bountyVibeulons} vib?
      </span>
      <button
        onClick={complete}
        disabled={pending}
        className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-black disabled:opacity-50"
        style={{ background: '#d4a017' }}
      >
        {pending ? '…' : 'yes'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: '#6b6862' }}
      >
        cancel
      </button>
    </span>
  )
}
