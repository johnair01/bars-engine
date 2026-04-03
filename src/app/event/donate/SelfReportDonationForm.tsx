'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { reportDonationWithState } from '@/actions/donate'

type Props = {
  instanceId: string
  instanceName: string
  isLoggedIn: boolean
  /** Default USD amount input (e.g. from DSW tier). */
  defaultAmount?: string
  dswPath?: string
  dswTier?: string
  dswNarrative?: string
  dswMilestoneId?: string
  dswEchoQuestId?: string
  /**
   * Where to return after login when pending donation cookie is set (allowlisted server-side).
   * @default '/event/donate'
   */
  donateReturnPath?: string
}

export function SelfReportDonationForm({
  instanceId,
  instanceName,
  isLoggedIn,
  defaultAmount,
  dswPath,
  dswTier,
  dswNarrative,
  dswMilestoneId,
  dswEchoQuestId,
  donateReturnPath = '/event/donate',
}: Props) {
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
      <input type="hidden" name="donateReturnPath" value={donateReturnPath} />
      <input type="hidden" name="instanceId" value={instanceId} />
      {dswPath ? <input type="hidden" name="dswPath" value={dswPath} /> : null}
      {dswTier ? <input type="hidden" name="dswTier" value={dswTier} /> : null}
      {dswNarrative ? <input type="hidden" name="dswNarrative" value={dswNarrative} /> : null}
      {dswMilestoneId ? <input type="hidden" name="dswMilestoneId" value={dswMilestoneId} /> : null}
      {dswEchoQuestId ? <input type="hidden" name="dswEchoQuestId" value={dswEchoQuestId} /> : null}
      <p className="text-xs text-zinc-500">
        Recording for <span className="text-zinc-400">{instanceName}</span>
        {dswTier ? (
          <>
            {' '}
            · tier <span className="text-zinc-400">{dswTier}</span>
          </>
        ) : null}
        {dswMilestoneId ? (
          <>
            {' '}
            · milestone linked
          </>
        ) : null}
        {dswEchoQuestId ? (
          <>
            {' '}
            · quest BAR linked
          </>
        ) : null}
      </p>
      {!dswEchoQuestId && (
        <details className="text-sm text-zinc-500">
          <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">Link a quest BAR id (optional)</summary>
          <p className="mt-2 text-xs text-zinc-600">
            Paste a <code className="text-zinc-500">CustomBar</code> id from admin or quest URL so stewards can trace the gift to a quest artifact.
          </p>
          <input
            name="dswEchoQuestId"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="c…"
            className="mt-2 w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none font-mono"
          />
        </details>
      )}
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
          defaultValue={defaultAmount ?? ''}
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
