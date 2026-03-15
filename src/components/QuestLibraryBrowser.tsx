'use client'

import { pullFromLibraryAction } from '@/actions/quest-library'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import type { QuestThreadSummary } from '@/actions/quest-library'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

export function QuestLibraryBrowser({
  threads,
}: {
  threads: QuestThreadSummary[]
}) {
  const router = useRouter()
  const [pullingId, setPullingId] = useState<string | null>(null)

  const handlePull = (threadId: string) => {
    setPullingId(threadId)
    pullFromLibraryAction({ threadId }).then((result) => {
      setPullingId(null)
      if ('error' in result) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  if (threads.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
        <p className="text-zinc-500">
          No quest threads in the library yet. Admins can upload PDFs and publish
          book-derived quests from the Books admin page.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-purple-400 hover:text-purple-300"
        >
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((t) => (
        <div
          key={t.id}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{t.title}</h2>
              {t.description && (
                <p className="text-sm text-zinc-500 mt-1">{t.description}</p>
              )}
              {t.bookTitle && (
                <p className="text-xs text-zinc-600 mt-1">From: {t.bookTitle}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {t.moveTypes?.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                  >
                    {MOVE_LABELS[m] ?? m}
                  </span>
                ))}
                <span className="text-xs text-zinc-600">
                  {t.questCount} quest{t.questCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div>
              {t.hasProgress ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                  In your journey →
                </Link>
              ) : (
                <button
                  onClick={() => handlePull(t.id)}
                  disabled={pullingId !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {pullingId === t.id ? 'Starting...' : 'Start'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
