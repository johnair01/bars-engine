'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { reportDonationWithState } from '@/actions/donate'

type Props = {
  instanceId: string
  instanceName: string
  isLoggedIn: boolean
}

export function SelfReportDonationForm({ instanceId, instanceName, isLoggedIn }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(reportDonationWithState, null)

  useEffect(() => {
    if (state?.requiresAuth && state.redirectTo) {
      router.push(state.redirectTo)
      router.refresh()
    }
    if (state?.success) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="instanceId" value={instanceId} />
      <div>
        <label htmlFor="amountCents" className="block text-xs uppercase text-zinc-500 mb-1">
          Amount donated (USD)
        </label>
        <input
          id="amountCents"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="25.00"
          required
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none"
        />
      </div>
      {state?.error && (
        <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition"
      >
        {isPending ? 'Processing...' : isLoggedIn ? 'Report donation' : 'Report donation (sign in required)'}
      </button>
    </form>
  )
}
