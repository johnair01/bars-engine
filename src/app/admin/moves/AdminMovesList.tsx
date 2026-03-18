'use client'

import Link from 'next/link'
import type { AdminMoveSummary } from '@/actions/move-proposals'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

export function AdminMovesList({ moves }: { moves: AdminMoveSummary[] }) {
  if (moves.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
        <p>No moves match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">{moves.length} move{moves.length !== 1 ? 's' : ''}</p>
      <div className="space-y-2">
        {moves.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-white">{m.name}</h3>
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{m.description}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-500">
                  <span className="rounded bg-zinc-800 px-2 py-0.5">{m.tier}</span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5">{m.origin}</span>
                  <span>{m.nationName}</span>
                  {m.moveType && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5">
                      {MOVE_LABELS[m.moveType] ?? m.moveType}
                    </span>
                  )}
                  {m.sourceBookId && (
                    <Link
                      href={`/admin/books/${m.sourceBookId}/moves`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {m.bookTitle ?? m.sourceBookId}
                      {m.sourceChunkIndex != null && ` (chunk ${m.sourceChunkIndex})`}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
