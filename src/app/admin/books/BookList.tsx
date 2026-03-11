'use client'

import { extractBookText, extractBookToc } from '@/actions/books'
import { analyzeBook, analyzeBookMore, type AnalysisFilters } from '@/actions/book-analyze'
import { createThreadFromBook } from '@/actions/book-to-thread'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

type Book = {
  id: string
  title: string
  author: string | null
  slug: string
  sourcePdfUrl: string | null
  status: string
  metadataJson: string | null
  createdAt: Date
  thread?: { id: string } | null
}

export function BookList({ books }: { books: Book[] }) {
  const router = useRouter()
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [extractResult, setExtractResult] = useState<{ id: string; msg: string } | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analyzingMoreId, setAnalyzingMoreId] = useState<string | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<{ id: string; msg: string } | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<{ id: string; msg: string } | null>(null)
  const [extractingTocId, setExtractingTocId] = useState<string | null>(null)
  const [tocResult, setTocResult] = useState<{ id: string; msg: string } | null>(null)
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

  const handleExtractToc = async (bookId: string) => {
    setExtractingTocId(bookId)
    setTocResult(null)
    const result = await extractBookToc(bookId)
    setExtractingTocId(null)
    if (result.error) {
      setTocResult({ id: bookId, msg: result.error })
    } else {
      setTocResult({
        id: bookId,
        msg: `TOC extracted: ${result.entryCount} entries`,
      })
      router.refresh()
    }
  }

  const handleExtract = async (bookId: string) => {
    setExtractingId(bookId)
    setExtractResult(null)
    const result = await extractBookText(bookId)
    setExtractingId(null)
    if (result.error) {
      setExtractResult({ id: bookId, msg: result.error })
    } else {
      setExtractResult({
        id: bookId,
        msg: `Extracted: ${result.pageCount} pages, ${result.wordCount} words`,
      })
      router.refresh()
    }
  }

  const handleAnalyze = async (bookId: string) => {
    setAnalyzingId(bookId)
    setAnalyzeResult(null)
    const result = await analyzeBook(bookId, hasActiveFilters ? { filters } : undefined)
    setAnalyzingId(null)
    if (result.error) {
      setAnalyzeResult({ id: bookId, msg: result.error })
    } else if ('chunksTotal' in result) {
      const chunkMsg =
        result.chunksTotal != null && result.chunksTotal > result.chunkCount
          ? `${result.chunkCount} of ${result.chunksTotal} chunks`
          : `${result.chunkCount} chunks`
      const filterMsg =
        'chunksFilteredByTarget' in result && result.chunksFilteredByTarget != null && result.chunksFilteredByTarget > 0
          ? ` (${result.chunksFilteredByTarget} skipped by filters)`
          : ''
      setAnalyzeResult({
        id: bookId,
        msg: `Analyzed: ${result.questsCreated} quests from ${chunkMsg}${filterMsg}`,
      })
      router.refresh()
    }
  }

  const handleAnalyzeMore = async (bookId: string) => {
    setAnalyzingMoreId(bookId)
    setAnalyzeResult(null)
    const result = await analyzeBookMore(bookId)
    setAnalyzingMoreId(null)
    if (result.error) {
      setAnalyzeResult({ id: bookId, msg: result.error })
    } else if ('chunksTotal' in result) {
      const chunkMsg =
        result.chunksTotal != null && result.chunksTotal > result.chunkCount
          ? `${result.chunkCount} of ${result.chunksTotal} chunks`
          : `${result.chunkCount} chunks`
      setAnalyzeResult({
        id: bookId,
        msg: `Analyzed: ${result.questsCreated} quests from ${chunkMsg}`,
      })
      router.refresh()
    }
  }

  const handlePublish = async (bookId: string) => {
    setPublishingId(bookId)
    setPublishResult(null)
    const result = await createThreadFromBook(bookId)
    setPublishingId(null)
    if (result.error) {
      setPublishResult({ id: bookId, msg: result.error })
    } else {
      setPublishResult({
        id: bookId,
        msg: `Published: ${result.questCount} quests → thread`,
      })
      router.refresh()
    }
  }

  const statusBadge = (status: string) => {
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
        let meta: {
          pageCount?: number
          wordCount?: number
          analysis?: { questsCreated?: number; chunksAnalyzed?: number; chunksTotal?: number }
          toc?: { entries?: unknown[] }
        } | null = null
        try {
          meta = book.metadataJson ? JSON.parse(book.metadataJson) : null
        } catch {
          // ignore
        }
        return (
          <div
            key={book.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="min-w-0">
              <h3 className="font-medium text-white truncate">{book.title}</h3>
              {book.author && (
                <p className="text-sm text-zinc-500">{book.author}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {statusBadge(book.status)}
                {meta?.pageCount && (
                  <span className="text-xs text-zinc-500">
                    {meta.pageCount} pages
                    {meta.wordCount != null && ` · ${meta.wordCount.toLocaleString()} words`}
                  </span>
                )}
                {meta?.analysis?.questsCreated != null && (
                  <span className="text-xs text-zinc-500">
                    · {meta.analysis.questsCreated} quests
                  </span>
                )}
                {meta?.toc?.entries != null && meta.toc.entries.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    · {meta.toc.entries.length} TOC entries
                  </span>
                )}
                {meta?.analysis?.chunksAnalyzed != null &&
                  meta?.analysis?.chunksTotal != null &&
                  meta.analysis.chunksAnalyzed < meta.analysis.chunksTotal && (
                    <span className="text-xs text-zinc-500">
                      · {meta.analysis.chunksTotal - meta.analysis.chunksAnalyzed} chunks remaining
                    </span>
                  )}
              </div>
              {extractResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{extractResult.msg}</p>
              )}
              {analyzeResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{analyzeResult.msg}</p>
              )}
              {publishResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{publishResult.msg}</p>
              )}
              {tocResult?.id === book.id && (
                <p className="text-sm text-green-400 mt-1">{tocResult.msg}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {book.sourcePdfUrl && (
                <a
                  href={book.sourcePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                >
                  View PDF
                </a>
              )}
              {book.thread && (
                <a
                  href={`/admin/journeys/thread/${book.thread.id}`}
                  className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                >
                  View thread
                </a>
              )}
              {book.status === 'draft' && book.sourcePdfUrl && (
                <button
                  onClick={() => handleExtract(book.id)}
                  disabled={extractingId !== null}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {extractingId === book.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Extracting...
                    </>
                  ) : (
                    'Extract Text'
                  )}
                </button>
              )}
              {(book.status === 'analyzed' || book.status === 'published') && (
                <>
                  <Link
                    href={`/admin/books/${book.id}/quests`}
                    className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition"
                  >
                    Review quests
                  </Link>
                  {meta?.analysis?.chunksAnalyzed != null &&
                    meta?.analysis?.chunksTotal != null &&
                    meta.analysis.chunksAnalyzed < meta.analysis.chunksTotal && (
                      <button
                        onClick={() => handleAnalyzeMore(book.id)}
                        disabled={analyzingMoreId !== null}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {analyzingMoreId === book.id ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze More'
                        )}
                      </button>
                    )}
                </>
              )}
              {(book.status === 'extracted' || book.status === 'analyzed' || book.status === 'published') && (
                <button
                  onClick={() => handleExtractToc(book.id)}
                  disabled={extractingTocId !== null}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition disabled:opacity-50"
                >
                  {extractingTocId === book.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Extracting...
                    </>
                  ) : (
                    'Extract TOC'
                  )}
                </button>
              )}
              {book.status === 'extracted' && (
                <button
                  onClick={() => handleAnalyze(book.id)}
                  disabled={analyzingId !== null}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {analyzingId === book.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Analyzing...
                    </>
                  ) : (
                    'Trigger Analysis'
                  )}
                </button>
              )}
              {(book.status === 'analyzed' || book.status === 'published') && (
                <button
                  onClick={() => handlePublish(book.id)}
                  disabled={publishingId !== null}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {publishingId === book.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Publishing...
                    </>
                  ) : (
                    book.status === 'published' ? 'Re-publish' : 'Publish'
                  )}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
