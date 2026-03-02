import { listBooks } from '@/actions/books'
import { BookUploadForm } from './BookUploadForm'
import { BookList } from './BookList'
import Link from 'next/link'

export const maxDuration = 120 // 2 min for book analysis (large books)

export default async function AdminBooksPage() {
  const books = await listBooks()

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
        {books.length === 0 ? (
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
