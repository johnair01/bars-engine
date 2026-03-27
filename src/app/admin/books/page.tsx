import { listBooks } from '@/actions/books'
import { isPrismaP6009 } from '@/lib/prisma-errors'
import { BookUploadForm } from './BookUploadForm'
import { BookList } from './BookList'
import Link from 'next/link'

export const maxDuration = 120 // 2 min for book analysis (large books)

/**
 * @page /admin/books
 * @entity WIKI
 * @description Upload PDFs to Quest Library, extract text, and trigger AI analysis for quest generation
 * @permissions admin
 * @relationships CONTAINS (books contain quests and moves)
 * @dimensions WHO:admin, WHAT:WIKI, WHERE:allyshipDomain, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/books
 * @agentDiscoverable false
 */
export default async function AdminBooksPage() {
  let books: Awaited<ReturnType<typeof listBooks>> = []
  let listError: string | null = null

  try {
    books = await listBooks()
  } catch (e) {
    listError = e instanceof Error ? e.message : 'Unable to load books'
    if (isPrismaP6009(e)) {
      console.error('[BOOKS] P6009 response size exceeded:', listError)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Books</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload PDFs for the Quest Library. Extract text, then trigger AI analysis to create quests (move types, allyship domains).
        </p>
      </div>

      <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload PDF</h2>
        <BookUploadForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Books ({books.length})</h2>
        {listError ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-red-300 text-sm">Unable to load books. {listError}</p>
            <p className="text-zinc-500 text-xs mt-2">Refresh the page to try again.</p>
          </div>
        ) : books.length === 0 ? (
          <p className="text-zinc-500 text-sm">No books yet. Upload a PDF above.</p>
        ) : (
          <BookList books={books} />
        )}
      </section>

      <p className="text-xs text-zinc-600">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-400">
          ← Back to Admin
        </Link>
      </p>
    </div>
  )
}
