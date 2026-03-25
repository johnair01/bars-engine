'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnalysisFilters } from '@/actions/book-analyze'
import { BookPraxisBadge, BookPraxisPanel } from './BookPraxisPanel'
import { BookPipelineActions } from './BookPipelineActions'
import { useBookPipelineActions } from './useBookPipelineActions'
import type { AdminBookRow } from './book-admin-types'
import { parseBookMeta } from './book-admin-types'

const MOVE_OPTIONS = [
  { value: 'wakeUp', label: 'Wake Up' },
  { value: 'cleanUp', label: 'Clean Up' },
  { value: 'growUp', label: 'Grow Up' },
  { value: 'showUp', label: 'Show Up' },
] as const

const NATION_OPTIONS = ['Argyra', 'Pyrakanth', 'Lamenth', 'Meridia', 'Virelune'] as const

const ARCHETYPE_OPTIONS = [
  'Bold Heart',
  'Danger Walker',
  'Truth Seer',
  'Still Point',
  'Subtle Influence',
  'Devoted Guardian',
  'Decisive Storm',
  'Joyful Connector',
] as const

const KOTTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-zinc-700 text-zinc-300',
    extracted: 'bg-green-900/30 text-green-400',
    analyzed: 'bg-blue-900/30 text-blue-400',
    published: 'bg-purple-900/30 text-purple-400',
  }
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-zinc-800 text-zinc-500'}`}
    >
      {status}
    </span>
  )
}

export function BookList({ books }: { books: AdminBookRow[] }) {
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<AnalysisFilters>({})

  const hasActiveFilters =
    (filters.moveType?.length ?? 0) > 0 ||
    (filters.nation?.length ?? 0) > 0 ||
    (filters.archetype?.length ?? 0) > 0 ||
    (filters.kotterStage?.length ?? 0) > 0

  const toggleFilter = <K extends keyof AnalysisFilters>(
    key: K,
    value: AnalysisFilters[K] extends (infer E)[] | undefined ? E : never
  ) => {
    setFilters((prev) => {
      const arr = (prev[key] ?? []) as unknown[]
      const has = arr.includes(value)
      const next = has ? arr.filter((x) => x !== value) : [...arr, value]
      return { ...prev, [key]: next.length ? next : undefined }
    })
  }

  const shared = useBookPipelineActions(router, { filters, hasActiveFilters })

  const hasExtractedBooks = books.some((b) => b.status === 'extracted')

  return (
    <div className="space-y-3">
      {hasExtractedBooks && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
          >
            {showFilters ? '▼' : '▶'} Target filters
            {hasActiveFilters && (
              <span className="rounded-full bg-amber-600/50 px-2 py-0.5 text-xs text-amber-200">
                active
              </span>
            )}
          </button>
          {showFilters && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="mb-1 text-xs text-zinc-500">Move</p>
                <div className="flex flex-wrap gap-1">
                  {MOVE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.moveType?.includes(value) ?? false}
                        onChange={() => toggleFilter('moveType', value)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      <span className="text-xs text-zinc-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Nation</p>
                <div className="flex flex-wrap gap-1">
                  {NATION_OPTIONS.map((n) => (
                    <label key={n} className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.nation?.includes(n) ?? false}
                        onChange={() => toggleFilter('nation', n)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      <span className="text-xs text-zinc-300">{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Archetype</p>
                <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                  {ARCHETYPE_OPTIONS.map((a) => (
                    <label key={a} className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.archetype?.includes(a) ?? false}
                        onChange={() => toggleFilter('archetype', a)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      <span className="text-xs text-zinc-300">{a}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Kotter stage</p>
                <div className="flex flex-wrap gap-1">
                  {KOTTER_OPTIONS.map((k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.kotterStage?.includes(k) ?? false}
                        onChange={() => toggleFilter('kotterStage', k)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      <span className="text-xs text-zinc-300">{k}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {books.map((book) => {
        const meta = parseBookMeta(book.metadataJson)
        return (
          <div
            key={book.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4"
          >
            <div className="min-w-0 w-full">
              <h3 className="font-medium text-white truncate">{book.title}</h3>
              {book.author && <p className="text-sm text-zinc-500">{book.author}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {statusBadge(book.status)}
                <BookPraxisBadge metadataJson={book.metadataJson} />
                {meta?.pageCount != null && (
                  <span className="text-xs text-zinc-500">
                    {meta.pageCount} pages
                    {meta.wordCount != null && ` · ${meta.wordCount.toLocaleString()} words`}
                  </span>
                )}
                {meta?.analysis?.questsCreated != null && (
                  <span className="text-xs text-zinc-500">· {meta.analysis.questsCreated} quests</span>
                )}
                {meta?.toc?.entries != null && meta.toc.entries.length > 0 && (
                  <span className="text-xs text-zinc-500">· {meta.toc.entries.length} TOC entries</span>
                )}
                {meta?.analysis?.chunksAnalyzed != null &&
                  meta?.analysis?.chunksTotal != null &&
                  meta.analysis.chunksAnalyzed < meta.analysis.chunksTotal && (
                    <span className="text-xs text-zinc-500">
                      · {meta.analysis.chunksTotal - meta.analysis.chunksAnalyzed} chunks remaining
                    </span>
                  )}
              </div>
              {shared.extractResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{shared.extractResult.msg}</p>
              )}
              {shared.analyzeResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{shared.analyzeResult.msg}</p>
              )}
              {shared.publishResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{shared.publishResult.msg}</p>
              )}
              {shared.extractMovesResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{shared.extractMovesResult.msg}</p>
              )}
              {shared.tocResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{shared.tocResult.msg}</p>
              )}
              <BookPraxisPanel bookId={book.id} metadataJson={book.metadataJson} />
            </div>
            <BookPipelineActions book={book} meta={meta} layout="list" shared={shared} />
          </div>
        )
      })}
    </div>
  )
}
