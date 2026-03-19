'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBar } from '@/actions/bar-delete'

export function DeleteBarButton({ barId }: { barId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsPending(true)
    setError(null)
    const result = await deleteBar(barId)
    setIsPending(false)
    setConfirming(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      router.push('/bars')
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 space-y-3">
        <p className="text-sm text-red-200">Delete this BAR? This cannot be undone.</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {isPending ? '…' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={isPending}
            className="px-3 py-1.5 rounded border border-zinc-600 text-zinc-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-1 rounded border border-red-900/60 text-red-400 hover:text-red-300 hover:border-red-800/60 transition-colors"
    >
      Delete
    </button>
  )
}
