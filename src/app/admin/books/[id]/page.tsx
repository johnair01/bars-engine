import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminBookForHub } from '@/actions/books'
import { BookHubClient } from '../BookHubClient'
import { BookPraxisBadge } from '../BookPraxisPanel'
import { parseBookMeta } from '../book-admin-types'

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

/**
 * @page /admin/books/:bookId
 * @entity WIKI
 * @description Book detail hub with metadata, status, praxis, TOC, and quest analysis progress
 * @permissions admin
 * @params bookId:string (path, required)
 * @relationships CONTAINS (quests, moves, chunks)
 * @dimensions WHO:admin, WHAT:WIKI, WHERE:praxis, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/books/book_123
 * @agentDiscoverable false
 */
export default async function AdminBookHubPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const book = await getAdminBookForHub(id)
  if (!book) notFound()

  const meta = parseBookMeta(book.metadataJson)

  return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-xs text-zinc-600">
        <Link href="/admin/books" className="text-zinc-500 hover:text-zinc-400">
          ← Back to Books
        </Link>
      </p>

      <div>
        <h1 className="text-2xl font-bold text-white">{book.title}</h1>
        {book.author && <p className="text-sm text-zinc-500 mt-1">{book.author}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-3">
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
      </div>

      <BookHubClient book={book} />
    </div>
  )
}
