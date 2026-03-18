'use client'

import { promoteMoveProposal, type MoveProposalSummary } from '@/actions/move-proposals'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BookMovesList({
  bookId,
  proposals,
}: {
  bookId: string
  proposals: MoveProposalSummary[]
}) {
  const router = useRouter()
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePromote = async (moveId: string) => {
    setPromotingId(moveId)
    setError(null)
    const result = await promoteMoveProposal(moveId, 'promote')
    setPromotingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  const handleReject = async (moveId: string) => {
    setRejectingId(moveId)
    setError(null)
    const result = await promoteMoveProposal(moveId, 'reject')
    setRejectingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
        <p>No move proposals from this book yet.</p>
        <p className="text-sm mt-2">
          Use &quot;Extract Moves&quot; on the book list to extract transformation moves from the text.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {proposals.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-white">{m.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{m.description}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-500">
                  {m.moveType && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5">{m.moveType}</span>
                  )}
                  {m.sourceChunkIndex != null && (
                    <span>Chunk {m.sourceChunkIndex}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handlePromote(m.id)}
                  disabled={promotingId !== null || rejectingId !== null}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {promotingId === m.id ? 'Promoting...' : 'Promote'}
                </button>
                <button
                  onClick={() => handleReject(m.id)}
                  disabled={promotingId !== null || rejectingId !== null}
                  className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition disabled:opacity-50"
                >
                  {rejectingId === m.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
