'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { extractTocFromText } from '@/lib/book-toc'
import { mapSectionsToDimensions } from '@/lib/book-section-mapper'
import { chunkBookTextWithToc } from '@/lib/book-chunker'
import { suggestMove } from '@/lib/book-section-mapper'
import { generateObjectWithCache } from '@/lib/ai-with-cache'
import { getOpenAI } from '@/lib/openai'
import { getCampaignPrimaryDomain, ALLYSHIP_DOMAIN_LABELS } from '@/lib/campaign-domain-mapping'
import {
  ALLYSHIP_DOMAINS_PARSER_CONTEXT,
  DOMAIN_FIT_ANALYSIS_CONTEXT,
} from '@/lib/allyship-domains-parser-context'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const SAMPLE_CHUNKS_PER_MOVE = 2
const MAX_CHARS_PER_CHUNK_SAMPLE = 800

function getBookSummaryModel(): string {
  return process.env.BOOK_ANALYSIS_MODEL || 'gpt-4o-mini'
}

const summaryLeverageSchema = z.object({
  summary: z.string().describe('2–4 paragraph condensation of the book'),
  leverageInCampaign: z.string().describe('How this book can be leveraged in the target campaign context'),
  domainFitAnalysis: z
    .string()
    .describe(
      '2–4 sentence analysis: which allyship domain(s) the book fits, whether it supports the campaign primary domain, and which domains it does not fit. Use domain names: Skillful Organizing, Gathering Resources, Direct Action, Raising Awareness.'
    ),
})

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

/** Sample up to n chunks that best match the given move type. */
function sampleChunksForMove(
  chunks: { text: string; sectionIndex?: number }[],
  moveType: string,
  sectionHints?: Array<{ moveType?: string }>,
  maxN: number = SAMPLE_CHUNKS_PER_MOVE
): string[] {
  const scored = chunks.map((chunk) => {
    let score = 0
    const { value, confidence } = suggestMove(chunk.text)
    if (value === moveType && confidence >= 0.3) score += 2
    if (chunk.sectionIndex != null && sectionHints?.[chunk.sectionIndex]?.moveType === moveType) score += 1
    return { chunk, score }
  })
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)
  const selected = matched.length > 0 ? matched : scored.slice(0, maxN)
  return selected.slice(0, maxN).map((s) => s.chunk.text.slice(0, MAX_CHARS_PER_CHUNK_SAMPLE))
}

/**
 * Generate book summary and campaign leverage.
 * Spec: .specify/specs/pdf-to-campaign-autogeneration/spec.md
 */
export async function generateBookSummaryAndLeverage(bookId: string, campaignRef: string) {
  try {
    if (process.env.BOOK_ANALYSIS_AI_ENABLED === 'false') {
      return { error: 'Book analysis AI is disabled. Set BOOK_ANALYSIS_AI_ENABLED=true to enable.' }
    }

    await requireAdmin()

    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, author: true, extractedText: true, metadataJson: true },
    })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text. Run Extract Text first.' }

    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
    let toc = existingMeta.toc ?? null
    let sectionHints = toc?.sectionHints ?? undefined

    if (!toc?.entries?.length) {
      const rawToc = extractTocFromText(book.extractedText)
      sectionHints = mapSectionsToDimensions(rawToc, book.extractedText)
      toc = { ...rawToc, sectionHints }
    }

    const chunks = chunkBookTextWithToc(book.extractedText, toc)
    const moveSamples: Record<string, string> = {}
    for (const move of MOVE_TYPES) {
      const samples = sampleChunksForMove(chunks, move, sectionHints)
      moveSamples[move] = samples.length ? samples.join('\n\n---\n\n') : '(no matching chunks)'
    }

    const tocSummary = toc?.entries?.slice(0, 15).map((e: { title: string; level: string }) => `${e.level}: ${e.title}`).join('\n') ?? 'No TOC'

    const instance = await db.instance.findFirst({
      where: { campaignRef },
      select: { name: true, targetDescription: true },
    })
    const campaignContext = instance
      ? `${instance.name}${instance.targetDescription ? ` — ${instance.targetDescription}` : ''}`
      : campaignRef

    const primaryDomain = getCampaignPrimaryDomain(campaignRef)
    const primaryDomainLabel = primaryDomain
      ? ALLYSHIP_DOMAIN_LABELS[primaryDomain as keyof typeof ALLYSHIP_DOMAIN_LABELS]
      : null

    const systemPrompt = `You are analyzing a Personal Development book for the Integral Emergence game. Produce a concise summary and explain how the book can be leveraged in a target campaign.

4 moves: Wake Up (new ideas, awareness), Clean Up (psych barriers, emotional blocks), Grow Up (skill capacity), Show Up (apply to campaign, experiments).

${ALLYSHIP_DOMAINS_PARSER_CONTEXT}

${DOMAIN_FIT_ANALYSIS_CONTEXT}`

    const domainContextLine =
      primaryDomainLabel != null
        ? `\nCampaign primary domain: ${primaryDomainLabel} — analyze how the book fits (or does not fit) this domain and the other three.\n`
        : ''

    const userPrompt = `Book: ${book.title}${book.author ? ` by ${book.author}` : ''}

Target campaign: ${campaignContext}
${domainContextLine}
TOC (first 15 entries):
${tocSummary}

Sample content by move type:

**Wake Up** (new ideas, awareness):
${moveSamples.wakeUp}

**Clean Up** (psych barriers):
${moveSamples.cleanUp}

**Grow Up** (skills):
${moveSamples.growUp}

**Show Up** (apply to campaign):
${moveSamples.showUp}

---

Return:
- summary: 2–4 paragraph condensation of the book
- leverageInCampaign: how this book can be leveraged in campaign "${campaignContext}"
- domainFitAnalysis: 2–4 sentence analysis of how the book fits across the four allyship domains (Skillful Organizing, Gathering Resources, Direct Action, Raising Awareness). State which domain(s) it fits, whether it supports the campaign's primary domain (${primaryDomainLabel ?? 'if known'}), and which domains it does not fit.`

    const inputKey = `book_summary:${bookId}:${campaignRef}:${toc?.entries?.length ?? 0}`
    const modelId = getBookSummaryModel()

    const { object } = await generateObjectWithCache<z.infer<typeof summaryLeverageSchema>>({
      feature: 'book_summary',
      inputKey,
      model: modelId,
      schema: summaryLeverageSchema,
      system: systemPrompt,
      prompt: userPrompt,
      getModel: () => getOpenAI()(modelId),
    })

    const summaryLeverage = existingMeta.summaryLeverage ?? {}
    summaryLeverage[campaignRef] = {
      ...object,
      generatedAt: new Date().toISOString(),
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        metadataJson: JSON.stringify({ ...existingMeta, summaryLeverage }),
      },
    })

    revalidatePath('/admin/books')
    revalidatePath(`/admin/books/${bookId}`)
    return {
      success: true,
      summary: object.summary,
      leverageInCampaign: object.leverageInCampaign,
      domainFitAnalysis: object.domainFitAnalysis,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Summary generation failed'
    console.error('[BOOKS] Summary error:', msg)
    return { error: msg }
  }
}
