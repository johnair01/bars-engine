'use client'

import { extractBookText } from '@/actions/books'
import { analyzeBook, analyzeBookMore } from '@/actions/book-analyze'
import { createThreadFromBook } from '@/actions/book-to-thread'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    const result = await analyzeBook(bookId)
    setAnalyzingId(null)
    if (result.error) {
      setAnalyzeResult({ id: bookId, msg: result.error })
    } else {
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

  const handleAnalyzeMore = async (bookId: string) => {
    setAnalyzingMoreId(bookId)
    setAnalyzeResult(null)
    const result = await analyzeBookMore(bookId)
    setAnalyzingMoreId(null)
    if (result.error) {
      setAnalyzeResult({ id: bookId, msg: result.error })
    } else {
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

  return (
    <div className="space-y-3">
      {books.map((book) => {
        let meta: {
          pageCount?: number
          wordCount?: number
          analysis?: { questsCreated?: number; chunksAnalyzed?: number; chunksTotal?: number }
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
