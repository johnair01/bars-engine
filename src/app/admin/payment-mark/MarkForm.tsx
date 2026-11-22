'use client'

import { useActionState } from 'react'
import { markPaymentAction, type MarkActionState } from '@/actions/payment-mark'

export function MarkForm() {
  const [state, action, pending] = useActionState<MarkActionState, FormData>(markPaymentAction, null)
  const field = 'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100'
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Paste the payment note</span>
        <textarea name="note" rows={4} required className={field} placeholder="Venmo: J. Doe paid you $11.00 for fern-07" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Amount (blank reads the first $ amount in the note)</span>
        <input name="amount" inputMode="decimal" className={field} placeholder="$11.00" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Your reference (blank uses a fingerprint of the paste, so pasting it twice marks it once)</span>
        <input name="ref" className={field} placeholder="venmo 2026-11-21 J. Doe" />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-amber-600 px-4 py-2 font-medium text-black disabled:opacity-50">
        {pending ? 'Marking…' : 'Mark it'}
      </button>
      {state && <p role="status" className={state.ok ? 'text-emerald-400' : 'text-red-400'}>{state.message}</p>}
    </form>
  )
}
