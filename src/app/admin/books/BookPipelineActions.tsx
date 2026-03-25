'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import type { AdminBookRow, ParsedBookMeta } from './book-admin-types'
import { chunksRemaining } from './book-admin-types'
import type { BookPipelineShared } from './useBookPipelineActions'

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
  )
}

type Layout = 'list' | 'hub'

export function BookPipelineActions({
  book,
  meta,
  layout,
  shared,
}: {
  book: AdminBookRow
  meta: ParsedBookMeta
  layout: Layout
  shared: BookPipelineShared
}) {
  const {
    extractingId,
    extractingTocId,
    extractingMovesId,
    analyzingId,
    analyzingMoreId,
    publishingId,
    handleExtract,
    handleExtractToc,
    handleExtractMoves,
    handleAnalyze,
    handleAnalyzeMore,
    handlePublish,
  } = shared

  const showTocMoves =
    book.status === 'extracted' || book.status === 'analyzed' || book.status === 'published'
  const showReviewAnalyzePublish = book.status === 'analyzed' || book.status === 'published'
  const moreChunks = chunksRemaining(meta)

  const openBookLink = (
    <Link
      href={`/admin/books/${book.id}`}
      className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg transition min-h-9"
    >
      Open book
    </Link>
  )

  const viewPdf =
    book.sourcePdfUrl != null ? (
      <a
        href={book.sourcePdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition min-h-9"
      >
        View PDF
      </a>
    ) : null

  const viewThread =
    book.thread != null ? (
      <a
        href={`/admin/journeys/thread/${book.thread.id}`}
        className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition min-h-9"
      >
        View thread
      </a>
    ) : null

  const extractText =
    book.status === 'draft' && book.sourcePdfUrl ? (
      <button
        type="button"
        onClick={() => handleExtract(book.id)}
        disabled={extractingId !== null}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50 min-h-9"
      >
        {extractingId === book.id ? (
          <>
            <Spinner />
            Extracting...
          </>
        ) : (
          'Extract Text'
        )}
      </button>
    ) : null

  const triggerAnalysis =
    book.status === 'extracted' ? (
      <button
        type="button"
        onClick={() => handleAnalyze(book.id)}
        disabled={analyzingId !== null}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 min-h-9"
      >
        {analyzingId === book.id ? (
          <>
            <Spinner />
            Analyzing...
          </>
        ) : (
          'Trigger Analysis'
        )}
      </button>
    ) : null

  const reviewQuests =
    showReviewAnalyzePublish ? (
      <Link
        href={`/admin/books/${book.id}/quests`}
        className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition min-h-9"
      >
        Review quests
      </Link>
    ) : null

  const analyzeMore =
    showReviewAnalyzePublish && moreChunks ? (
      <button
        type="button"
        onClick={() => handleAnalyzeMore(book.id)}
        disabled={analyzingMoreId !== null}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 min-h-9"
      >
        {analyzingMoreId === book.id ? (
          <>
            <Spinner />
            Analyzing...
          </>
        ) : (
          'Analyze More'
        )}
      </button>
    ) : null

  const extractToc = showTocMoves ? (
    <button
      type="button"
      onClick={() => handleExtractToc(book.id)}
      disabled={extractingTocId !== null}
      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition disabled:opacity-50 min-h-9"
    >
      {extractingTocId === book.id ? (
        <>
          <Spinner />
          Extracting...
        </>
      ) : (
        'Extract TOC'
      )}
    </button>
  ) : null

  const extractMoves = showTocMoves ? (
    <button
      type="button"
      onClick={() => handleExtractMoves(book.id)}
      disabled={extractingMovesId !== null}
      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50 min-h-9"
    >
      {extractingMovesId === book.id ? (
        <>
          <Spinner />
          Extracting...
        </>
      ) : (
        'Extract Moves'
      )}
    </button>
  ) : null

  const viewMoves = showTocMoves ? (
    <Link
      href={`/admin/books/${book.id}/moves`}
      className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-teal-800 hover:bg-teal-700 text-teal-200 rounded-lg transition min-h-9"
    >
      View moves
    </Link>
  ) : null

  const publish = showReviewAnalyzePublish ? (
    <button
      type="button"
      onClick={() => handlePublish(book.id)}
      disabled={publishingId !== null}
      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50 min-h-9"
    >
      {publishingId === book.id ? (
        <>
          <Spinner />
          Publishing...
        </>
      ) : book.status === 'published' ? (
        'Re-publish'
      ) : (
        'Publish'
      )}
    </button>
  ) : null

  const contextualPrimary = extractText ?? triggerAnalysis ?? reviewQuests

  if (layout === 'hub') {
    return (
      <div className="flex flex-wrap gap-2 w-full min-w-0">
        {viewPdf}
        {viewThread}
        {extractText}
        {reviewQuests}
        {analyzeMore}
        {extractToc}
        {extractMoves}
        {viewMoves}
        {triggerAnalysis}
        {publish}
      </div>
    )
  }

  const primaryNodes = [openBookLink, viewPdf, contextualPrimary].filter(Boolean)

  const secondaryParts: (ReactElement | null)[] = []
  if (viewThread) secondaryParts.push(viewThread)
  if (book.status === 'extracted') {
    secondaryParts.push(extractToc, extractMoves, viewMoves)
  } else if (book.status === 'analyzed' || book.status === 'published') {
    secondaryParts.push(analyzeMore, extractToc, extractMoves, viewMoves, publish)
  }

  const secondaryNodes = secondaryParts.filter(Boolean)

  return (
    <div className="w-full min-w-0 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 w-full">{primaryNodes}</div>
      {secondaryNodes.length > 0 && (
        <details className="w-full group">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 list-none flex items-center gap-1.5 [&::-webkit-details-marker]:hidden">
            <span className="text-zinc-600 group-open:rotate-90 transition-transform inline-block">▶</span>
            More actions
          </summary>
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-zinc-800/80">{secondaryNodes}</div>
        </details>
      )}
    </div>
  )
}
