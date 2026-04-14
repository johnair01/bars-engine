/**
 * @page /admin/books/:id/import-gameplay
 * @entity WIKI
 * @description Preview/commit quest + BAR imports from a source book (fork lineage)
 * @permissions admin
 * @params id:string (path, required) — Target book id
 * @query source:string (required) — Source book id
 * @dimensions WHO:admin, WHAT:WIKI, WHERE:admin/books, ENERGY:porting
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminBookForHub } from '@/actions/books'
import { listBookSectionsForAdmin } from '@/actions/book-sections'
import { BookGameplayImportClient } from './BookGameplayImportClient'

export default async function BookGameplayImportPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ source?: string }>
}) {
  const { id } = await props.params
  const { source } = await props.searchParams
  const book = await getAdminBookForHub(id)
  if (!book) notFound()

  const sectionsRes = await listBookSectionsForAdmin(id)
  const sections = sectionsRes.success ? sectionsRes.sections.map((s) => ({ id: s.id, title: s.title })) : []

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

      <h1 className="text-xl font-bold text-white">Import gameplay</h1>
      {!source ? (
        <p className="text-sm text-amber-400">
          Add <code className="text-zinc-500">?source=BOOK_ID</code> (parent book) to preview imports into this book.
        </p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-amber-400">
          Create at least one Book OS section on the target book before importing BAR links.
        </p>
      ) : (
        <BookGameplayImportClient targetBookId={id} sourceBookId={source} targetSections={sections} />
      )}
    </div>
  )
}
