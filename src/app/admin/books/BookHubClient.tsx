'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnalysisFilters } from '@/actions/book-analyze'
import { BookPraxisPanel } from './BookPraxisPanel'
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

export function BookHubClient({ book }: { book: AdminBookRow }) {
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
  const meta = parseBookMeta(book.metadataJson)

  return (
    <div className="space-y-4">
      {book.status === 'extracted' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
          >
            {showFilters ? '▼' : '▶'} Target filters
            {hasActiveFilters && (
              <span className="rounded-full bg-amber-600/50 px-2 py-0.5 text-xs text-amber-200">active</span>
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

      {shared.extractResult?.id === book.id && (
        <p className="text-sm text-green-400">{shared.extractResult.msg}</p>
      )}
      {shared.analyzeResult?.id === book.id && (
        <p className="text-sm text-green-400">{shared.analyzeResult.msg}</p>
      )}
      {shared.publishResult?.id === book.id && (
        <p className="text-sm text-green-400">{shared.publishResult.msg}</p>
      )}
      {shared.extractMovesResult?.id === book.id && (
        <p className="text-sm text-green-400">{shared.extractMovesResult.msg}</p>
      )}
      {shared.tocResult?.id === book.id && (
        <p className="text-sm text-green-400">{shared.tocResult.msg}</p>
      )}

      <BookPraxisPanel bookId={book.id} metadataJson={book.metadataJson} />

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">Actions</h2>
        <BookPipelineActions book={book} meta={meta} layout="hub" shared={shared} />
      </div>
    </div>
  )
}
