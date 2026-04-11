/**
 * @page /admin/books/:id/sections/:sectionId
 * @entity WIKI
 * @description Book OS v1 — section draft, approve, audit trail
 * @permissions admin
 * @params id:string (path, required) — Book id
 * @params sectionId:string (path, required) — BookSection id
 * @relationships BookSection, ApprovalEvent, SectionRun
 * @dimensions WHO:admin, WHAT:WIKI, WHERE:admin/books, ENERGY:approval, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/books/clxyz123/sections/clsec456
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminBookForHub } from '@/actions/books'
import { getBookSectionForAdmin } from '@/actions/book-sections'
import { SectionEditorClient, type BookSectionEditorPayload } from './SectionEditorClient'

function toEditorPayload(s: {
  id: string
  bookId: string
  title: string
  slug: string
  orderIndex: number
  status: string
  sectionType: string
  goal: string | null
  draftText: string | null
  approvedText: string | null
  approvalEvents: { id: string; createdAt: Date; approvedText: string }[]
  runs: { id: string; createdAt: Date; runType: string; actorType: string }[]
  barLinks: { id: string; barId: string; role: string; bar: { id: string; title: string; type: string } }[]
}): BookSectionEditorPayload {
  return {
    id: s.id,
    bookId: s.bookId,
    title: s.title,
    slug: s.slug,
    orderIndex: s.orderIndex,
    status: s.status,
    sectionType: s.sectionType,
    goal: s.goal,
    draftText: s.draftText,
    approvedText: s.approvedText,
    approvalEvents: s.approvalEvents.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      approvedText: a.approvedText,
    })),
    runs: s.runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      runType: r.runType,
      actorType: r.actorType,
    })),
    barLinks: s.barLinks.map((l) => ({
      id: l.id,
      barId: l.barId,
      role: l.role,
      barTitle: l.bar.title,
      barType: l.bar.type,
    })),
  }
}

export default async function AdminBookSectionDetailPage(props: {
  params: Promise<{ id: string; sectionId: string }>
}) {
  const { id, sectionId } = await props.params
  const book = await getAdminBookForHub(id)
  if (!book) notFound()

  const res = await getBookSectionForAdmin(sectionId)
  if (!res.success || res.section.bookId !== id) notFound()

  const payload = toEditorPayload(res.section)

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
        {' · '}
        <Link href={`/admin/books/${id}/sections`} className="text-zinc-500 hover:text-zinc-400">
          Sections
        </Link>
      </p>

      <SectionEditorClient section={payload} />
    </div>
  )
}
