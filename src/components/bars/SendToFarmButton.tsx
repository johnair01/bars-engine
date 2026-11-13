'use client'

import { useState } from 'react'

type Sent = { workTypeLabel: string; created: boolean }

/** BAR-to-work: sends this BAR to the player's farm as a seed. The server checks the farm and the character and says why not. */
export function SendToFarmButton({ barId }: { barId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<Sent | null>(null)

  async function send() {
    setPending(true)
    setError(null)
    try {
      const r = await fetch(`/api/bars/${encodeURIComponent(barId)}/send-to-farm`, { method: 'POST' })
      const j = (await r.json().catch(() => ({}))) as { error?: string; workTypeLabel?: string; created?: boolean }
      if (!r.ok) setError(j.error ?? 'The BAR did not reach the farm. Try again.')
      else setSent({ workTypeLabel: j.workTypeLabel ?? '', created: !!j.created })
    } catch {
      setError('The BAR did not reach the farm. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">Plant this BAR on your farm as a seed. It is sorted into a kind of work and waits there for its spec.</p>
      {sent ? (
        <p className="text-sm text-emerald-300" role="status">
          {sent.created ? 'Sent.' : 'Already on your farm.'} Sorted as {sent.workTypeLabel}.{' '}
          <a href="/between/farm.html" className="underline hover:text-white">Open your farm</a>
        </p>
      ) : (
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="px-4 py-2 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          {pending ? 'Sending…' : 'Send to the farm'}
        </button>
      )}
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
    </div>
  )
}
