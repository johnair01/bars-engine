'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getOpenAI } from '@/lib/openai'
import { z } from 'zod'
import { chunkBookText, type TextChunk } from '@/lib/book-chunker'
import { chunkIsActionable } from '@/lib/chunk-filter'
import { suggestDomain, CONFIDENCE_THRESHOLD } from '@/lib/quest-classifier'
import { ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT } from '@/lib/allyship-domains-parser-context'
import { generateObjectWithCache } from '@/lib/ai-with-cache'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const ALLYSHIP_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const

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
    })
  ),
})

type QuestResult = {
  title: string
  description: string
  moveType: string
  allyshipDomain?: string | null
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

Focus on quests that help players Grow Up (skill-building) when the content supports it.
Return 1-5 quests per chunk. Skip chunks with no actionable content.`

/** Run AI analysis on chunks and return quests + cache stats. */
async function runChunkAnalysis(
  bookId: string,
  chunksToProcess: TextChunk[],
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
        const inputKey = `${bookId}:${chunk.index}:${chunk.text.slice(0, 500)}:${chunk.text.length}:hint:${domainHint ?? 'none'}`
        return generateObjectWithCache<z.infer<typeof analysisSchema>>({
          feature: 'book_analysis',
          inputKey,
          model: modelId,
          schema: analysisSchema,
          system: SYSTEM_PROMPT,
          prompt: `Analyze this book chunk and extract quests:\n\n${hintLine}---\n${chunk.text}\n---`,
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
 */
export async function analyzeBook(bookId: string) {
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

    const chunks = chunkBookText(book.extractedText)
    if (chunks.length === 0) return { error: 'No text to analyze' }

    const actionableChunks = chunks.filter(chunkIsActionable)
    const chunksSkipped = chunks.length - actionableChunks.length
    const chunksToProcess = sampleEvenly(actionableChunks, MAX_CHUNKS)
    const chunksTotal = chunks.length

    const creatorId = await getSystemCreatorId()
    const { quests, cacheHits, cacheMisses, heuristicHits } = await runChunkAnalysis(bookId, chunksToProcess)
    const createdIds = await createQuestsFromAnalysis(bookId, quests, creatorId)

    const analysisMeta = {
      chunksAnalyzed: chunksToProcess.length,
      chunksTotal,
      chunksSkipped,
      cacheHits,
      cacheMisses,
      heuristicHits,
      questsExtracted: quests.length,
      questsCreated: createdIds.length,
      analyzedChunkIndices: chunksToProcess.map((c) => c.index),
      analyzedAt: new Date().toISOString(),
    }

    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
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
