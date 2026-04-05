'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { extractTocFromText } from '@/lib/book-toc'
import { mapSectionsToDimensions } from '@/lib/book-section-mapper'
import { buildBookCampaignSkeleton, generateBookCampaignNarratives } from '@/lib/book-campaign-cyoa'
import { CANONICAL_ARCHETYPE_NAMES } from '@/lib/canonical-archetypes'
import { createThreadFromBook } from './book-to-thread'
import { extractBookToc } from './books'
import { generateBookSummaryAndLeverage } from './book-summary'

const MOVE_ORDER = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const

async function requireAdmin(): Promise<string> {
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

/**
 * Create a Campaign (QuestThread + Adventure) from a book.
 * Orchestrates: TOC, summary, thread, skeleton, narratives, Adventure, Passages.
 * Spec: .specify/specs/pdf-to-campaign-autogeneration/spec.md
 */
export async function createBookCampaign(bookId: string, campaignRef: string) {
  try {
    if (process.env.BOOK_ANALYSIS_AI_ENABLED === 'false') {
      return { error: 'Book campaign AI is disabled. Set BOOK_ANALYSIS_AI_ENABLED=true to enable.' }
    }

    await requireAdmin()

    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, author: true, slug: true, extractedText: true, metadataJson: true, status: true },
    })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text. Run Extract Text first.' }

    // Ensure TOC
    let toc = book.metadataJson ? (JSON.parse(book.metadataJson) as { toc?: { entries?: unknown[]; sectionHints?: unknown[] } }).toc : null
    if (!toc?.entries?.length) {
      const tocResult = await extractBookToc(bookId)
      if ('error' in tocResult) return { error: tocResult.error }
      const refetched = await db.book.findUnique({ where: { id: bookId }, select: { metadataJson: true } })
      toc = refetched?.metadataJson ? (JSON.parse(refetched.metadataJson) as { toc?: { entries?: unknown[]; sectionHints?: unknown[] } }).toc : null
    }

    // Ensure summary + leverage for campaignRef
    const existingMeta = book.metadataJson ? (JSON.parse(book.metadataJson) as Record<string, unknown>) : {}
    const summaryLeverage = (existingMeta.summaryLeverage as Record<string, { summary: string; leverageInCampaign: string; leverageInOtherDomains?: string[] }>)?.[campaignRef]
    if (!summaryLeverage) {
      const summaryResult = await generateBookSummaryAndLeverage(bookId, campaignRef)
      if ('error' in summaryResult) return { error: summaryResult.error }
    }

    // Ensure thread (publish if analyzed)
    let thread = await db.questThread.findUnique({ where: { bookId } })
    if (!thread && book.status === 'analyzed') {
      const publishResult = await createThreadFromBook(bookId)
      if ('error' in publishResult) return { error: `Publish required: ${publishResult.error}` }
      thread = await db.questThread.findUnique({ where: { bookId } })
    }
    if (!thread) return { error: 'No quest thread. Run Extract → Analyze → Approve quests → Publish first.' }

    // Get summary (from cache or just generated)
    const meta = (await db.book.findUnique({ where: { id: bookId }, select: { metadataJson: true } }))?.metadataJson
    const parsedMeta = meta ? (JSON.parse(meta) as Record<string, unknown>) : {}
    const sl = (parsedMeta.summaryLeverage as Record<string, { summary: string; leverageInCampaign: string; leverageInOtherDomains?: string[] }>)?.[campaignRef]
    if (!sl) return { error: 'Summary not found. Run Generate Summary first.' }

    // Get archetypes
    const archetypes = await db.archetype.findMany({
      where: { name: { in: [...CANONICAL_ARCHETYPE_NAMES] } },
      select: { id: true, name: true, description: true },
    })
    if (archetypes.length === 0) return { error: 'No canonical archetypes found. Run seed.' }

    // Get quests by move
    const quests = await db.customBar.findMany({
      where: { completionEffects: { contains: `"bookId":"${bookId}"` } },
      select: { id: true, title: true, moveType: true },
    })
    const questsByMove = {
      wakeUp: quests.filter((q) => q.moveType === 'wakeUp'),
      cleanUp: quests.filter((q) => q.moveType === 'cleanUp'),
      growUp: quests.filter((q) => q.moveType === 'growUp'),
      showUp: quests.filter((q) => q.moveType === 'showUp'),
    }

    const instance = await db.instance.findFirst({
      where: { campaignRef },
      select: { name: true, targetDescription: true },
    })
    const campaignContext = instance ? `${instance.name}${instance.targetDescription ? ` — ${instance.targetDescription}` : ''}` : campaignRef

    // Build skeleton
    const skeleton = buildBookCampaignSkeleton({
      bookTitle: book.title,
      bookAuthor: book.author,
      toc,
      sectionHints: toc?.sectionHints as Array<{ moveType?: string }> | undefined,
      archetypes: archetypes.map((a) => ({ id: a.id, name: a.name })),
      questsByMove: {
        wakeUp: questsByMove.wakeUp.map((q) => ({ id: q.id, title: q.title })),
        cleanUp: questsByMove.cleanUp.map((q) => ({ id: q.id, title: q.title })),
        growUp: questsByMove.growUp.map((q) => ({ id: q.id, title: q.title })),
        showUp: questsByMove.showUp.map((q) => ({ id: q.id, title: q.title })),
      },
    })

    // Generate narratives
    const filledNodes = await generateBookCampaignNarratives({
      skeleton,
      bookTitle: book.title,
      bookAuthor: book.author,
      campaignRef,
      campaignContext,
      summaryLeverage: sl,
      archetypes,
      questTitlesByMove: {
        wakeUp: questsByMove.wakeUp.map((q) => q.title),
        cleanUp: questsByMove.cleanUp.map((q) => q.title),
        growUp: questsByMove.growUp.map((q) => q.title),
        showUp: questsByMove.showUp.map((q) => q.title),
      },
    })

    // Create or update Adventure
    const adventureSlug = `book-${book.slug}`
    let adventure = await db.adventure.findFirst({
      where: { slug: adventureSlug },
    })

    if (adventure) {
      await db.passage.deleteMany({ where: { adventureId: adventure.id } })
    } else {
      adventure = await db.adventure.create({
        data: {
          slug: adventureSlug,
          title: book.title,
          description: book.author ? `From ${book.author}` : 'Book Campaign',
          status: 'ACTIVE',
          visibility: 'PUBLIC_ONBOARDING',
          startNodeId: 'BOOK_Intro',
          campaignRef: adventureSlug,
        },
      })
    }

    for (const node of filledNodes) {
      await db.passage.create({
        data: {
          adventureId: adventure!.id,
          nodeId: node.nodeId,
          text: node.text,
          choices: JSON.stringify(node.choices),
          linkedQuestId: node.linkedQuestId ?? null,
        },
      })
    }

    await db.questThread.update({
      where: { id: thread.id },
      data: { adventureId: adventure!.id },
    })

    const updatedMeta = (await db.book.findUnique({ where: { id: bookId }, select: { metadataJson: true } }))?.metadataJson
    const metaObj = updatedMeta ? (JSON.parse(updatedMeta) as Record<string, unknown>) : {}
    await db.book.update({
      where: { id: bookId },
      data: {
        metadataJson: JSON.stringify({ ...metaObj, campaignAdventureId: adventure!.id }),
      },
    })

    revalidatePath('/admin/books')
    revalidatePath(`/admin/books/${bookId}`)
    return {
      success: true,
      adventureId: adventure!.id,
      threadId: thread.id,
      slug: adventureSlug,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Campaign creation failed'
    console.error('[BOOKS] Campaign error:', msg)
    return { error: msg }
  }
}
