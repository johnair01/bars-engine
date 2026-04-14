'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { tocMetadataToSectionScaffolds } from '@/lib/book-toc-to-sections'

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

async function allocateBookSlug(baseTitle: string): Promise<string> {
  const base = slugFromTitle(baseTitle.trim()) || 'book'
  const existing = await db.book.findUnique({ where: { slug: base } })
  if (!existing) return base
  return `${base}-${Date.now()}`
}

async function allocateSectionSlugTx(
  tx: Prisma.TransactionClient,
  bookId: string,
  title: string
): Promise<string> {
  const base = slugFromTitle(title.trim()) || 'section'
  for (let n = 0; n < 200; n++) {
    const slug = n === 0 ? base : `${base}-${n}`
    const clash = await tx.bookSection.findUnique({
      where: { bookId_slug: { bookId, slug } },
    })
    if (!clash) return slug
  }
  throw new Error('Could not allocate unique section slug')
}

export type ForkBookFromLibraryInput = {
  parentBookId: string
  newTitle: string
  options?: { includeTocSections?: boolean; stewardNote?: string }
}

/**
 * Creates a derivative book with optional TOC→BookSection scaffold.
 */
export async function forkBookFromLibrary(input: ForkBookFromLibraryInput) {
  try {
    await requireAdminPlayerId()
    const parent = await db.book.findUnique({
      where: { id: input.parentBookId },
      select: { id: true, title: true, metadataJson: true },
    })
    if (!parent) return { error: 'Parent book not found' as const }

    const newTitle = input.newTitle?.trim()
    if (!newTitle) return { error: 'newTitle is required' as const }

    const slug = await allocateBookSlug(newTitle)
    const includeSections = input.options?.includeTocSections !== false
    const scaffolds = includeSections ? tocMetadataToSectionScaffolds(parent.metadataJson) : []

    if (includeSections && scaffolds && 'error' in scaffolds) {
      return { error: scaffolds.error as string }
    }

    const forkMeta = {
      parentBookId: parent.id,
      parentTitle: parent.title,
      stewardNote: input.options?.stewardNote?.trim() || null,
      sectionCount: Array.isArray(scaffolds) ? scaffolds.length : 0,
    }

    const child = await db.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: newTitle,
          author: null,
          slug,
          status: 'draft',
          bookOrigin: 'forked_derivative',
          parentBookId: parent.id,
          forkedAt: new Date(),
          forkMetadataJson: JSON.stringify(forkMeta),
        },
      })

      if (Array.isArray(scaffolds) && scaffolds.length > 0) {
        let firstSectionId: string | null = null
        for (const row of scaffolds) {
          const sectionSlug = await allocateSectionSlugTx(tx, book.id, row.title)
          const section = await tx.bookSection.create({
            data: {
              bookId: book.id,
              title: row.title,
              slug: sectionSlug,
              orderIndex: row.orderIndex,
              sectionType: 'standard',
              status: 'draft',
            },
          })
          if (!firstSectionId) firstSectionId = section.id
        }
        if (firstSectionId) {
          await tx.sectionRun.create({
            data: {
              sectionId: firstSectionId,
              runType: 'import_draft',
              actorType: 'human',
              outputText: `Forked from book "${parent.title}" (${parent.id}). ${scaffolds.length} TOC sections scaffolded.`,
              metadataJson: JSON.stringify(forkMeta),
            },
          })
        }
      }

      return book
    })

    revalidatePath('/admin/books')
    revalidatePath(`/admin/books/${child.id}`)
    return { success: true as const, bookId: child.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Fork failed'
    return { error: msg }
  }
}

export async function getBookForkPreviewForAdmin(parentBookId: string) {
  try {
    await requireAdminPlayerId()
    const book = await db.book.findUnique({
      where: { id: parentBookId },
      select: {
        id: true,
        title: true,
        metadataJson: true,
        bookOrigin: true,
        thread: { select: { id: true } },
      },
    })
    if (!book) return { error: 'Book not found' as const }

    const scaffolds = tocMetadataToSectionScaffolds(book.metadataJson)
    const tocEntryCount = Array.isArray(scaffolds) ? scaffolds.length : 0

    return {
      success: true as const,
      parent: { id: book.id, title: book.title, bookOrigin: book.bookOrigin },
      tocEntryCount,
      hasThread: Boolean(book.thread),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Preview failed' }
  }
}

/**
 * Fills empty journey-oriented fields with conservative templates (steward may edit).
 */
export async function applyBookSectionJourneyScaffold(sectionId: string) {
  try {
    await requireAdminPlayerId()
    const section = await db.bookSection.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        bookId: true,
        title: true,
        goal: true,
        teachingIntent: true,
        emotionalTarget: true,
      },
    })
    if (!section) return { error: 'Section not found' as const }

    const title = section.title
    const data: Record<string, string> = {}
    if (!section.goal?.trim()) {
      data.goal = `Reader orients to "${title}" and can name one concrete takeaway.`
    }
    if (!section.teachingIntent?.trim()) {
      data.teachingIntent = `Teach the core move of "${title}" without rushing past prerequisite concepts.`
    }
    if (!section.emotionalTarget?.trim()) {
      data.emotionalTarget = `Grounded curiosity — enough safety to stay with difficulty.`
    }

    if (Object.keys(data).length === 0) {
      return { success: true as const, updated: false as const }
    }

    await db.bookSection.update({
      where: { id: sectionId },
      data,
    })

    await db.sectionRun.create({
      data: {
        sectionId,
        runType: 'intake',
        actorType: 'human',
        outputText: 'Applied journey field scaffold (templates).',
        metadataJson: JSON.stringify({ kind: 'journey_scaffold_v1' }),
      },
    })

    revalidatePath(`/admin/books/${section.bookId}/sections`)
    revalidatePath(`/admin/books/${section.bookId}/sections/${sectionId}`)
    return { success: true as const, updated: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Scaffold failed' }
  }
}
