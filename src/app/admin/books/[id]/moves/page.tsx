import { listMoveProposals } from '@/actions/move-proposals'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookMovesList } from './BookMovesList'

export default async function BookMovesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: bookId } = await params

  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { id: true, title: true },
  })

  if (!book) redirect('/admin/books')

  const proposals = await listMoveProposals({ bookId })

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/books" className="text-sm text-zinc-500 hover:text-white transition">
          ← Back to Books
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">
          Move proposals: {book.title}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {proposals.length} proposed move{proposals.length !== 1 ? 's' : ''} from this book
        </p>
      </div>

      <BookMovesList bookId={bookId} proposals={proposals} />
    </div>
  )
}
