'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { decideBookClaim } from '@/actions/book-claims'

export function ClaimDecision({ claimId }: { claimId: string }) {
  const router = useRouter()
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function decide(decision: 'approve' | 'decline') {
    setError(null)
    startTransition(async () => {
      const r = await decideBookClaim({ claimId, decision, reason })
      if (!r.ok) setError(r.error)
      else router.refresh()
    })
  }

  const btn = 'min-h-11 rounded-lg px-4 text-sm font-bold transition-colors disabled:opacity-50'

  return (
    <div className="space-y-2">
      {declining ? (
        <div className="space-y-2">
          <label htmlFor={`reason-${claimId}`} className="block text-xs text-zinc-400">
            What should the reader hear? (optional, goes in the email)
          </label>
          <input
            id={`reason-${claimId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="The picture doesn't show the book's title"
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200"
          />
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => decide('decline')} className={`${btn} bg-amber-700 text-white hover:bg-amber-600`}>
              {pending ? 'Sending…' : 'Decline and email'}
            </button>
            <button type="button" disabled={pending} onClick={() => setDeclining(false)} className={`${btn} bg-zinc-800 text-zinc-200 hover:bg-zinc-700`}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => decide('approve')} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-500`}>
            {pending ? 'Approving…' : 'Approve'}
          </button>
          <button type="button" disabled={pending} onClick={() => setDeclining(true)} className={`${btn} bg-zinc-800 text-zinc-200 hover:bg-zinc-700`}>
            Decline
          </button>
        </div>
      )}
      {error && <p className="text-sm text-amber-300">{error}</p>}
    </div>
  )
}
