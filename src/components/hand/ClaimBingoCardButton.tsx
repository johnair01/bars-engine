'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimEventBingoCard } from '@/actions/event-bingo'

export function ClaimBingoCardButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClaim() {
    setError(null)
    startTransition(async () => {
      const result = await claimEventBingoCard(eventId)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="shrink-0 text-right">
      {error && <p className="text-[10px] text-red-400 mb-1">{error}</p>}
      <button
        type="button"
        onClick={handleClaim}
        disabled={pending}
        className="rounded px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors disabled:opacity-40"
      >
        {pending ? 'Claiming…' : 'Claim card'}
      </button>
    </div>
  )
}
