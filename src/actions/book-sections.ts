'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const CONTEXT_PACK_MAX_CHARS = 12_000

const SECTION_BAR_ROLES = new Set(['source', 'output', 'critique', 'refinement', 'note'])

async function requireAdminPlayerId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function allocateSectionSlug(bookId: string, title: string): Promise<string> {
  let base = slugFromTitle(title.trim()) || 'section'
  for (let n = 0; n < 200; n++) {
    const slug = n === 0 ? base : `${base}-${n}`
    const clash = await db.bookSection.findUnique({
      where: { bookId_slug: { bookId, slug } },
    })
    if (!clash) return slug
  }
  throw new Error('Could not allocate unique section slug')
}

export async function listBookSectionsForAdmin(bookId: string) {
  try {
    await requireAdminPlayerId()
    const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true } })
    if (!book) return { error: 'Book not found' as const }
    const sections = await db.bookSection.findMany({
      where: { bookId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        orderIndex: true,
        status: true,
        sectionType: true,
        goal: true,
        draftText: true,
        approvedText: true,
        updatedAt: true,
      },
    })
    return { success: true as const, sections }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to list sections'
    return { error: msg as const }
  }
}

export type CreateBookSectionInput = {
  title: string
  sectionType?: string
  goal?: string | null
}

export async function createBookSection(bookId: string, input: CreateBookSectionInput) {
  try {
    await requireAdminPlayerId()
    const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true } })
    if (!book) return { error: 'Book not found' as const }
    const title = input.title?.trim()
    if (!title) return { error: 'Title is required' as const }

    const slug = await allocateSectionSlug(bookId, title)
    const agg = await db.bookSection.aggregate({
      where: { bookId },
      _max: { orderIndex: true },
    })
    const orderIndex = (agg._max.orderIndex ?? -1) + 1

    const section = await db.bookSection.create({
      data: {
        bookId,
        title,
        slug,
        orderIndex,
        sectionType: input.sectionType?.trim() || 'standard',
        goal: input.goal?.trim() || null,
        status: 'draft',
      },
    })

    await db.sectionRun.create({
      data: {
        sectionId: section.id,
        runType: 'intake',
        actorType: 'human',
        outputText: `Section created: ${title}`,
      },
    })

    revalidatePath(`/admin/books/${bookId}/sections`)
    revalidatePath(`/admin/books/${bookId}/sections/${section.id}`)
    return { success: true as const, sectionId: section.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create section'
    return { error: msg as const }
  }
}

export type UpdateBookSectionInput = {
  title?: string
  goal?: string | null
  draftText?: string | null
  teachingIntent?: string | null
  status?: string
}

export async function updateBookSection(sectionId: string, input: UpdateBookSectionInput) {
  try {
    await requireAdminPlayerId()
    const existing = await db.bookSection.findUnique({
      where: { id: sectionId },
      select: { id: true, bookId: true },
    })
    if (!existing) return { error: 'Section not found' as const }

    const data: Prisma.BookSectionUpdateInput = {}
    if (input.title !== undefined) {
      const t = input.title.trim()
      if (!t) return { error: 'Title cannot be empty' as const }
      data.title = t
    }
    if (input.goal !== undefined) data.goal = input.goal?.trim() || null
    if (input.draftText !== undefined) data.draftText = input.draftText
    if (input.teachingIntent !== undefined) data.teachingIntent = input.teachingIntent?.trim() || null
    if (input.status !== undefined) data.status = input.status

    await db.bookSection.update({
      where: { id: sectionId },
      data,
    })

    revalidatePath(`/admin/books/${existing.bookId}/sections`)
    revalidatePath(`/admin/books/${existing.bookId}/sections/${sectionId}`)
    return { success: true as const }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update section'
    return { error: msg as const }
  }
}

export async function approveBookSection(
  sectionId: string,
  opts: { useDraft?: boolean; approvedText?: string; notes?: string | null }
) {
  try {
    const playerId = await requireAdminPlayerId()
    const section = await db.bookSection.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        bookId: true,
        draftText: true,
        approvedText: true,
      },
    })
    if (!section) return { error: 'Section not found' as const }

    const text = opts.useDraft
      ? section.draftText?.trim()
      : opts.approvedText?.trim()
    if (!text) {
      return { error: opts.useDraft ? 'No draft text to approve' : 'approvedText is required' }
    }

    await db.$transaction([
      db.approvalEvent.create({
        data: {
          sectionId,
          approvedById: playerId,
          approvedText: text,
          notes: opts.notes?.trim() || null,
          promotedToCanon: true,
        },
      }),
      db.sectionRun.create({
        data: {
          sectionId,
          runType: 'approval',
          actorType: 'human',
          actorId: playerId,
          outputText: text.slice(0, 2000),
        },
      }),
      db.bookSection.update({
        where: { id: sectionId },
        data: {
          approvedText: text,
          status: 'approved',
        },
      }),
    ])

    revalidatePath(`/admin/books/${section.bookId}/sections`)
    revalidatePath(`/admin/books/${section.bookId}/sections/${sectionId}`)
    return { success: true as const }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to approve section'
    return { error: msg as const }
  }
}

export type SectionContextPackV1 = {
  model: 'book_section_context_v1'
  sectionId: string
  bookId: string
  title: string
  slug: string
  goal: string | null
  teachingIntent: string | null
  approvedTextExcerpt: string | null
  barLinkIds: string[]
  styleRuleTitles: string[]
  canonRuleTitles: string[]
  truncated: boolean
}

/** Bounded JSON for agents / retrieval — prefers approved prose. */
export async function getSectionContextPack(sectionId: string): Promise<
  { success: true; pack: SectionContextPackV1 } | { error: string }
> {
  try {
    await requireAdminPlayerId()
    const section = await db.bookSection.findUnique({
      where: { id: sectionId },
      include: {
        barLinks: { select: { barId: true } },
        styleRules: { select: { title: true } },
        canonRules: { select: { title: true } },
      },
    })
    if (!section) return { error: 'Section not found' }

    const full = section.approvedText?.trim() || section.draftText?.trim() || null
    let truncated = false
    let excerpt: string | null = full
    if (full && full.length > CONTEXT_PACK_MAX_CHARS) {
      excerpt = full.slice(0, CONTEXT_PACK_MAX_CHARS)
      truncated = true
    }

    const pack: SectionContextPackV1 = {
      model: 'book_section_context_v1',
      sectionId: section.id,
      bookId: section.bookId,
      title: section.title,
      slug: section.slug,
      goal: section.goal,
      teachingIntent: section.teachingIntent,
      approvedTextExcerpt: excerpt,
      barLinkIds: section.barLinks.map((l) => l.barId),
      styleRuleTitles: section.styleRules.map((r) => r.title),
      canonRuleTitles: section.canonRules.map((r) => r.title),
      truncated,
    }
    return { success: true, pack }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to build context pack' }
  }
}

export async function getBookSectionForAdmin(sectionId: string) {
  try {
    await requireAdminPlayerId()
    const section = await db.bookSection.findUnique({
      where: { id: sectionId },
      include: {
        approvalEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
        runs: { orderBy: { createdAt: 'desc' }, take: 10 },
        barLinks: {
          orderBy: { createdAt: 'asc' },
          include: { bar: { select: { id: true, title: true, type: true } } },
        },
      },
    })
    if (!section) return { error: 'Section not found' as const }
    return { success: true as const, section }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load section'
    return { error: msg as const }
  }
}

export async function attachSectionBarLink(sectionId: string, barId: string, role: string) {
  try {
    await requireAdminPlayerId()
    const r = role.trim() || 'source'
    if (!SECTION_BAR_ROLES.has(r)) {
      return { error: `Invalid role. Use one of: ${[...SECTION_BAR_ROLES].join(', ')}` as const }
    }

    const section = await db.bookSection.findUnique({
      where: { id: sectionId },
      select: { id: true, bookId: true },
    })
    if (!section) return { error: 'Section not found' as const }

    const bar = await db.customBar.findUnique({ where: { id: barId.trim() }, select: { id: true } })
    if (!bar) return { error: 'CustomBar (BAR/quest) not found for this id' as const }

    await db.sectionBARLink.create({
      data: { sectionId: section.id, barId: bar.id, role: r },
    })

    revalidatePath(`/admin/books/${section.bookId}/sections`)
    revalidatePath(`/admin/books/${section.bookId}/sections/${sectionId}`)
    return { success: true as const }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to attach BAR link'
    if (/Unique constraint/i.test(msg)) {
      return { error: 'This section already has that bar in this role' as const }
    }
    return { error: msg as const }
  }
}

export async function detachSectionBarLink(linkId: string) {
  try {
    await requireAdminPlayerId()
    const link = await db.sectionBARLink.findUnique({
      where: { id: linkId },
      select: { id: true, sectionId: true, section: { select: { bookId: true } } },
    })
    if (!link) return { error: 'Link not found' as const }

    await db.sectionBARLink.delete({ where: { id: linkId } })
    revalidatePath(`/admin/books/${link.section.bookId}/sections`)
    revalidatePath(`/admin/books/${link.section.bookId}/sections/${link.sectionId}`)
    return { success: true as const }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to remove BAR link'
    return { error: msg as const }
  }
}
