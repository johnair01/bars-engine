'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getOpenAI } from '@/lib/openai'
import { z } from 'zod'
import { chunkBookText, chunkBookTextWithToc, type TextChunk } from '@/lib/book-chunker'
import { chunkIsActionable } from '@/lib/chunk-filter'
import { suggestDomain, CONFIDENCE_THRESHOLD } from '@/lib/quest-classifier'
import { suggestMove, suggestNation, suggestKotterStage, suggestArchetype } from '@/lib/book-section-mapper'
import { ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT } from '@/lib/allyship-domains-parser-context'
import { generateObjectWithCache } from '@/lib/ai-with-cache'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const ALLYSHIP_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const
const NATIONS = ['Argyra', 'Pyrakanth', 'Lamenth', 'Meridia', 'Virelune'] as const
const LOCK_TYPES = ['identity_lock', 'emotional_lock', 'action', 'possibility'] as const

export type AnalysisFilters = {
  moveType?: (typeof MOVE_TYPES)[number][]
  nation?: string[]
  archetype?: string[]
  kotterStage?: number[]
}

const FILTER_CONFIDENCE_THRESHOLD = 0.5

const MAX_CHUNKS = 15
const PARALLEL_BATCH = 2
const BATCH_DELAY_MS = 6000
const RESUME_LIMIT_PER_DAY = 3

function getBookAnalysisModel(): string {
  return process.env.BOOK_ANALYSIS_MODEL || 'gpt-4o-mini'
}

/** Sample evenly from array when length exceeds maxN. Covers start, middle, end. */
function sampleEvenly<T>(arr: T[], maxN: number): T[] {
  if (arr.length <= maxN) return arr
  const step = (arr.length - 1) / Math.max(1, maxN - 1)
  return Array.from({ length: maxN }, (_, i) => arr[Math.round(i * step)])
}

const analysisSchema = z.object({
  quests: z.array(
    z.object({
      title: z.string().describe('Short, actionable quest title'),
      description: z.string().describe('Quest instructions or narrative'),
      moveType: z.enum(MOVE_TYPES).describe('Which of the 4 moves: Wake Up, Clean Up, Grow Up, Show Up'),
      allyshipDomain: z.enum(ALLYSHIP_DOMAINS).nullable().describe('Essential domain (WHERE). When multiple apply, choose the primary one. Null if purely individual with no clear collective context.'),
      nation: z.enum(NATIONS).nullable().optional().describe('Thematic nation alignment (Argyra=clarity, Pyrakanth=passion, Lamenth=emotion, Meridia=balance, Virelune=growth). Null if unclear.'),
      archetype: z.string().nullable().optional().describe('Thematic archetype (Bold Heart, Danger Walker, Truth Seer, etc.). Null if unclear.'),
      kotterStage: z.number().min(1).max(8).optional().describe('Kotter change stage 1-8. Default 1 if unclear.'),
      lockType: z.enum(LOCK_TYPES).nullable().optional().describe('Transformation lock: identity_lock, emotional_lock, action, possibility. Null if unclear.'),
    })
  ),
})

type QuestResult = {
  title: string
  description: string
  moveType: string
  allyshipDomain?: string | null
  nation?: string | null
  archetype?: string | null
  kotterStage?: number
  lockType?: string | null
}

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

async function getSystemCreatorId(): Promise<string> {
  const systemPlayer = await db.player.findFirst({
    where: { invite: { token: { not: undefined } } },
    select: { id: true },
  })
  if (systemPlayer) return systemPlayer.id
  const admin = await db.playerRole.findFirst({
    where: { role: { key: 'admin' } },
    select: { playerId: true },
  })
  if (admin) return admin.playerId
  throw new Error('No system player or admin found for creatorId')
}

const SYSTEM_PROMPT = `You are analyzing a Personal Development book for the Integral Emergence game (bars-engine).
Extract potential quests (actionable tasks) from this text chunk. Each quest should:
- Have a short, actionable title
- Have clear instructions (description)
- Be classified into one of the 4 moves: wakeUp (see more), cleanUp (emotional energy), growUp (skill capacity), showUp (do the work)
- Assign an allyship domain when the context is clear (see definitions below)

${ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT}

Optional metadata (use when context supports it):
- nation: Argyra (clarity/precision), Pyrakanth (passion/intensity), Lamenth (emotion/flow), Meridia (balance), Virelune (growth/connection)
- archetype: Bold Heart, Danger Walker, Truth Seer, Still Point, Subtle Influence, Devoted Guardian, Decisive Storm, Joyful Connector
- kotterStage: 1-8 (urgency→coalition→vision→communicate→obstacles→wins→scale→anchor)
- lockType: identity_lock, emotional_lock, action, possibility

Focus on quests that help players Grow Up (skill-building) when the content supports it.
Return 1-5 quests per chunk. Skip chunks with no actionable content.`

function buildTargetPromptLine(filters: AnalysisFilters): string {
  const parts: string[] = []
  if (filters.moveType?.length) parts.push(`move: ${filters.moveType.join(', ')}`)
  if (filters.nation?.length) parts.push(`nation: ${filters.nation.join(', ')}`)
  if (filters.archetype?.length) parts.push(`archetype: ${filters.archetype.join(', ')}`)
  if (filters.kotterStage?.length) parts.push(`Kotter stage: ${filters.kotterStage.join(', ')}`)
  if (parts.length === 0) return ''
  return `Extract ONLY quests that fit: ${parts.join('; ')}.\n\n`
}

/** Section contradicts filters when it has a hint that explicitly doesn't match. Skip such chunks without running heuristics. */
function sectionContradictsFilters(
  hint: { moveType?: string; nation?: string; archetype?: string; kotterStage?: number } | null,
  filters: AnalysisFilters
): boolean {
  if (!hint) return false
  if (filters.moveType?.length && hint.moveType && !filters.moveType.includes(hint.moveType as (typeof MOVE_TYPES)[number])) return true
  if (filters.nation?.length && hint.nation && !filters.nation.includes(hint.nation)) return true
  if (filters.archetype?.length && hint.archetype && !filters.archetype.includes(hint.archetype)) return true
  if (filters.kotterStage?.length && hint.kotterStage != null && !filters.kotterStage.includes(hint.kotterStage)) return true
  return false
}

function chunkMatchesFilters(
  chunk: TextChunk,
  filters: AnalysisFilters,
  sectionHints?: Array<{ moveType?: string; nation?: string; archetype?: string; kotterStage?: number }>
): boolean {
  const hint = chunk.sectionIndex != null && sectionHints?.[chunk.sectionIndex] ? sectionHints[chunk.sectionIndex] : null

  if (sectionContradictsFilters(hint, filters)) return false

  if (filters.moveType?.length) {
    const m = suggestMove(chunk.text)
    const sectionMatch = hint?.moveType && filters.moveType.includes(hint.moveType as (typeof MOVE_TYPES)[number])
    const chunkMatch = m.value && m.confidence >= FILTER_CONFIDENCE_THRESHOLD && filters.moveType.includes(m.value as (typeof MOVE_TYPES)[number])
    if (!sectionMatch && !chunkMatch) return false
  }
  if (filters.nation?.length) {
    const n = suggestNation(chunk.text)
    const sectionMatch = hint?.nation && filters.nation.includes(hint.nation)
    const chunkMatch = n.value && n.confidence >= FILTER_CONFIDENCE_THRESHOLD && filters.nation.includes(n.value)
    if (!sectionMatch && !chunkMatch) return false
  }
  if (filters.archetype?.length) {
    const a = suggestArchetype(chunk.text)
    const sectionMatch = hint?.archetype && filters.archetype.includes(hint.archetype)
    const chunkMatch = a.value && a.confidence >= FILTER_CONFIDENCE_THRESHOLD && filters.archetype.includes(a.value)
    if (!sectionMatch && !chunkMatch) return false
  }
  if (filters.kotterStage?.length) {
    const k = suggestKotterStage(chunk.text)
    const sectionMatch = hint?.kotterStage != null && filters.kotterStage.includes(hint.kotterStage)
    const chunkMatch = k.value != null && k.confidence >= FILTER_CONFIDENCE_THRESHOLD && filters.kotterStage.includes(k.value)
    if (!sectionMatch && !chunkMatch) return false
  }
  return true
}

/** Run AI analysis on chunks and return quests + cache stats. */
async function runChunkAnalysis(
  bookId: string,
  chunksToProcess: TextChunk[],
  targetPromptLine = ''
): Promise<{ quests: QuestResult[]; cacheHits: number; cacheMisses: number; heuristicHits: number }> {
  const allQuests: QuestResult[] = []
  let cacheHits = 0
  let cacheMisses = 0
  let heuristicHits = 0
  const modelId = getBookAnalysisModel()

  for (let i = 0; i < chunksToProcess.length; i += PARALLEL_BATCH) {
    const batch = chunksToProcess.slice(i, i + PARALLEL_BATCH)
    const results = await Promise.all(
      batch.map((chunk) => {
        const { domain: domainHint, confidence } = suggestDomain(chunk.text)
        const hintLine =
          domainHint && confidence >= CONFIDENCE_THRESHOLD
            ? `Domain hint (high confidence): ${domainHint}. Prioritize this domain when clear.\n\n`
            : ''
        if (domainHint && confidence >= CONFIDENCE_THRESHOLD) heuristicHits++
        const inputKey = `${bookId}:${chunk.index}:${chunk.text.slice(0, 500)}:${chunk.text.length}:hint:${domainHint ?? 'none'}:target:${targetPromptLine.slice(0, 100)}`
        return generateObjectWithCache<z.infer<typeof analysisSchema>>({
          feature: 'book_analysis',
          inputKey,
          model: modelId,
          schema: analysisSchema,
          system: SYSTEM_PROMPT,
          prompt: `Analyze this book chunk and extract quests:\n\n${targetPromptLine}${hintLine}---\n${chunk.text}\n---`,
          getModel: () => getOpenAI()(modelId),
        })
      })

    )
    results.forEach((r) => {
      if (r.fromCache) cacheHits++
      else cacheMisses++
      allQuests.push(...r.object.quests)
    })

    if (i + PARALLEL_BATCH < chunksToProcess.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  const seen = new Set<string>()
  const uniqueQuests = allQuests.filter((q) => {
    const key = q.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { quests: uniqueQuests, cacheHits, cacheMisses, heuristicHits }
}

/** Create CustomBar records from quests and return created IDs. */
async function createQuestsFromAnalysis(
  bookId: string,
  quests: QuestResult[],
  creatorId: string,
): Promise<string[]> {
  const createdIds: string[] = []
  for (const q of quests) {
    const bar = await db.customBar.create({
      data: {
        creatorId,
        title: q.title,
        description: q.description,
        type: 'vibe',
        reward: 1,
        status: 'draft',
        visibility: 'public',
        isSystem: true,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain ?? null,
        nation: q.nation ?? null,
        archetype: q.archetype ?? null,
        kotterStage: q.kotterStage ?? 1,
        lockType: q.lockType ?? null,
        completionEffects: JSON.stringify({ source: 'library', bookId }),
        inputs: JSON.stringify([
          { key: 'reflection', label: 'Response', type: 'textarea', placeholder: 'Share what you did or learned' },
        ]),
      },
    })
    await db.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })
    createdIds.push(bar.id)
  }
  return createdIds
}

/**
 * Analyze a book's extracted text and create CustomBar (quest) records.
 * Chunks the text, filters non-actionable chunks, calls AI per chunk (with cache), creates quests.
 * When options.filters is provided, pre-filters chunks by dimension hints and adds target to AI prompt.
 */
export async function analyzeBook(bookId: string, options?: { filters?: AnalysisFilters }) {
  try {
    if (process.env.BOOK_ANALYSIS_AI_ENABLED === 'false') {
      return { error: 'Book analysis AI is disabled. Set BOOK_ANALYSIS_AI_ENABLED=true to enable.' }
    }

    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text. Run Extract Text first.' }
    if (book.status !== 'extracted') {
      return { error: 'Book must be in extracted status to analyze' }
    }

    const filters = options?.filters
    const hasFilters = Boolean(
      filters &&
        (filters.moveType?.length ||
          filters.nation?.length ||
          filters.archetype?.length ||
          filters.kotterStage?.length)
    )

    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
    const toc = existingMeta.toc ?? null
    const sectionHints = toc?.sectionHints ?? undefined

    const chunks = toc?.entries?.length
      ? chunkBookTextWithToc(book.extractedText, toc)
      : chunkBookText(book.extractedText)
    if (chunks.length === 0) return { error: 'No text to analyze' }

    let actionableChunks = chunks.filter(chunkIsActionable)
    let chunksFilteredByTarget = 0
    if (hasFilters && filters) {
      const beforeFilter = actionableChunks.length
      actionableChunks = actionableChunks.filter((c) => chunkMatchesFilters(c, filters, sectionHints))
      chunksFilteredByTarget = beforeFilter - actionableChunks.length
      if (actionableChunks.length === 0) {
        return {
          error:
            'No chunks match the selected filters. Try extracting TOC first (Extract TOC button) or relaxing filters.',
        }
      }
    }

    const chunksSkipped = chunks.length - actionableChunks.length
    const chunksToProcess = sampleEvenly(actionableChunks, MAX_CHUNKS)
    const chunksTotal = chunks.length

    const targetPromptLine = hasFilters && filters ? buildTargetPromptLine(filters) : ''

    const creatorId = await getSystemCreatorId()
    const { quests, cacheHits, cacheMisses, heuristicHits } = await runChunkAnalysis(
      bookId,
      chunksToProcess,
      targetPromptLine
    )
    const createdIds = await createQuestsFromAnalysis(bookId, quests, creatorId)

    const analysisMeta = {
      chunksAnalyzed: chunksToProcess.length,
      chunksTotal,
      chunksSkipped,
      ...(hasFilters && chunksFilteredByTarget > 0 && { chunksFilteredByTarget }),
      cacheHits,
      cacheMisses,
      heuristicHits,
      questsExtracted: quests.length,
      questsCreated: createdIds.length,
      analyzedChunkIndices: chunksToProcess.map((c) => c.index),
      analyzedAt: new Date().toISOString(),
    }
    await db.book.update({
      where: { id: bookId },
      data: {
        status: 'analyzed',
        metadataJson: JSON.stringify({ ...existingMeta, analysis: analysisMeta }),
      },
    })

    revalidatePath('/admin/books')
    return {
      success: true,
      questsCreated: createdIds.length,
      chunkCount: chunksToProcess.length,
      chunksTotal,
      ...(chunksFilteredByTarget > 0 && { chunksFilteredByTarget }),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analysis failed'
    console.error('[BOOKS] Analyze error:', msg)
    return { error: msg }
  }
}

/**
 * Analyze more chunks from an already-analyzed book. Limited to 3 runs per admin per day.
 */
export async function analyzeBookMore(bookId: string) {
  try {
    if (process.env.BOOK_ANALYSIS_AI_ENABLED === 'false') {
      return { error: 'Book analysis AI is disabled. Set BOOK_ANALYSIS_AI_ENABLED=true to enable.' }
    }

    const adminId = await requireAdmin()

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    let resumeCountToday = 0
    try {
      resumeCountToday = await db.bookAnalysisResumeLog.count({
        where: {
          adminId,
          createdAt: { gte: todayStart },
        },
      })
    } catch (e) {
      console.warn('[BOOKS] BookAnalysisResumeLog count failed (schema may need sync), assuming 0:', (e as Error)?.message)
    }
    if (resumeCountToday >= RESUME_LIMIT_PER_DAY) {
      return { error: 'Resume limit reached (3 per day). Try again tomorrow.' }
    }

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text.' }
    if (book.status !== 'analyzed' && book.status !== 'published') {
      return { error: 'Book must be analyzed or published to run Analyze More.' }
    }

    const chunks = chunkBookText(book.extractedText)
    if (chunks.length === 0) return { error: 'No text to analyze' }

    const actionableChunks = chunks.filter(chunkIsActionable)
    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
    const analysis = existingMeta.analysis ?? {}

    let analyzedChunkIndices: number[] = analysis.analyzedChunkIndices ?? []
    if (analyzedChunkIndices.length === 0 && analysis.chunksAnalyzed != null) {
      const inferred = sampleEvenly(actionableChunks, Math.min(MAX_CHUNKS, analysis.chunksAnalyzed))
      analyzedChunkIndices = inferred.map((c) => c.index)
    }

    const remainingChunks = actionableChunks.filter((c) => !analyzedChunkIndices.includes(c.index))
    if (remainingChunks.length === 0) {
      return { error: 'All chunks already analyzed.' }
    }

    const chunksToProcess = sampleEvenly(remainingChunks, MAX_CHUNKS)
    const chunksTotal = chunks.length

    const creatorId = await getSystemCreatorId()
    const { quests, cacheHits, cacheMisses, heuristicHits } = await runChunkAnalysis(bookId, chunksToProcess)
    const createdIds = await createQuestsFromAnalysis(bookId, quests, creatorId)

    const newIndices = chunksToProcess.map((c) => c.index)
    const updatedMeta = {
      ...analysis,
      chunksAnalyzed: (analysis.chunksAnalyzed ?? 0) + chunksToProcess.length,
      chunksTotal,
      cacheHits: (analysis.cacheHits ?? 0) + cacheHits,
      cacheMisses: (analysis.cacheMisses ?? 0) + cacheMisses,
      heuristicHits: (analysis.heuristicHits ?? 0) + heuristicHits,
      questsExtracted: (analysis.questsExtracted ?? 0) + quests.length,
      questsCreated: (analysis.questsCreated ?? 0) + createdIds.length,
      analyzedChunkIndices: [...analyzedChunkIndices, ...newIndices],
      analyzedAt: new Date().toISOString(),
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        metadataJson: JSON.stringify({ ...existingMeta, analysis: updatedMeta }),
      },
    })

    try {
      await db.bookAnalysisResumeLog.create({
        data: { adminId, bookId },
      })
    } catch (e) {
      console.warn('[BOOKS] BookAnalysisResumeLog create failed (rate limit may not be tracked):', (e as Error)?.message)
    }

    revalidatePath('/admin/books')
    return {
      success: true,
      questsCreated: createdIds.length,
      chunkCount: chunksToProcess.length,
      chunksTotal,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analysis failed'
    console.error('[BOOKS] AnalyzeMore error:', msg)
    return { error: msg }
  }
}
