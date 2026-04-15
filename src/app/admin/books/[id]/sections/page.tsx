import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminBookForHub } from '@/actions/books'
import { listBookSectionsForAdmin } from '@/actions/book-sections'
import { BookSectionsClient } from './BookSectionsClient'

/**
 * @page /admin/books/:id/sections
 * @entity WIKI
 * @description Book OS v1 — section map and create (governed manuscript spine)
 * @permissions admin
 * @params id:string (path, required) — Book id
 * @relationships Book → BookSection
 * @dimensions WHO:admin, WHAT:WIKI, WHERE:admin/books, ENERGY:manuscript, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/books/clxyz123/sections
 */
export default async function AdminBookSectionsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const book = await getAdminBookForHub(id)
  if (!book) notFound()

  const res = await listBookSectionsForAdmin(id)
  const sections = res.success ? res.sections : []

  return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-xs text-zinc-600">
        <Link href="/admin/books" className="text-zinc-500 hover:text-zinc-400">
          ← Books
        </Link>
        {' · '}
        <Link href={`/admin/books/${id}`} className="text-zinc-500 hover:text-zinc-400">
          {book.title}
        </Link>
      </p>

      <div>
        <h1 className="text-2xl font-bold text-white">Book OS — Sections</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Draft vs approved prose, audit runs, context pack for agents. Spec:{' '}
          <code className="text-zinc-400">.specify/specs/book-os-v1-authoring/</code>
        </p>
      </div>

      <BookSectionsClient bookId={id} bookTitle={book.title} initialSections={sections} loadError={'error' in res ? (res.error ?? null) : null} />
    </div>
  )
}
