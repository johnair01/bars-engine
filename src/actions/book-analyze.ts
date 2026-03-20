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
import { isBackendAvailable, analyzeChunkViaAgent } from '@/lib/agent-client'
import { ensureMetalNationMoves } from '@/actions/nation-moves'

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

const moveExtractionSchema = z.object({
  moves: z.array(
    z.object({
      name: z.string().describe('Short, memorable move name (e.g. "Cut the Noise", "Call the Standard")'),
      description: z.string().describe('What this move does and when to use it'),
      moveType: z.enum(MOVE_TYPES).describe('Which of the 4 moves: wakeUp, cleanUp, growUp, showUp'),
      // No .optional() — OpenAI structured outputs require every `properties` key in `required`; use null instead.
      barKind: z.enum(['clarity', 'prestige', 'framework']).nullable().describe('What kind of BAR this produces. clarity=reduce ambiguity; prestige=spotlight craft; framework=reusable template. Null if unclear.'),
      requirementsHint: z.string().nullable().describe('What inputs the move might need (e.g. "objective rewrite, collaborator"). Null if none.'),
      nation: z.enum(NATIONS).nullable().describe('Thematic nation alignment. Null if unclear.'),
    })
  ),
})

type MoveExtractionResult = z.infer<typeof moveExtractionSchema>['moves'][number]

const MOVE_EXTRACTION_PROMPT = `You are analyzing a Personal Development book for the Integral Emergence game (bars-engine).
Extract **transformation moves** — named patterns or practices a player could apply repeatedly. These are NOT one-off quests but reusable "how to" patterns.

Examples of moves: "Call the Standard" (define clarity), "Cut the Noise" (remove distraction), "Forge a Template" (turn craft into reusable form).

For each move extract:
- name: Short, memorable (2-4 words)
- description: What it does and when to use it
- moveType: wakeUp (see more), cleanUp (emotional energy), growUp (skill capacity), showUp (do the work)
- barKind: clarity | prestige | framework — what kind of BAR it produces. Null if unclear.
- requirementsHint: Optional inputs (e.g. "objective rewrite"). Null if none.
- nation: Argyra | Pyrakanth | Lamenth | Meridia | Virelune — thematic fit. Null if unclear.

Return 0-3 moves per chunk. Skip chunks with no move-like patterns.`

const analysisSchema = z.object({
  quests: z.array(
    z.object({
      title: z.string().describe('Short, actionable quest title'),
      description: z.string().describe('Quest instructions or narrative'),
      moveType: z.enum(MOVE_TYPES).describe('Which of the 4 moves: Wake Up, Clean Up, Grow Up, Show Up'),
      allyshipDomain: z.enum(ALLYSHIP_DOMAINS).nullable().describe('Essential domain (WHERE). When multiple apply, choose the primary one. Null if purely individual with no clear collective context.'),
      nation: z.enum(NATIONS).nullable().describe('Thematic nation alignment (Argyra=clarity, Pyrakanth=passion, Lamenth=emotion, Meridia=balance, Virelune=growth). Null if unclear.'),
      archetype: z.string().nullable().describe('Thematic archetype (Bold Heart, Danger Walker, Truth Seer, etc.). Null if unclear.'),
      kotterStage: z.number().min(1).max(8).nullable().describe('Kotter change stage 1-8. Null if unclear (downstream defaults to 1).'),
      lockType: z.enum(LOCK_TYPES).nullable().describe('Transformation lock: identity_lock, emotional_lock, action, possibility. Null if unclear.'),
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
  kotterStage?: number | null
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
      batch.map(async (chunk) => {
        const { domain: domainHint, confidence } = suggestDomain(chunk.text)
        if (domainHint && confidence >= CONFIDENCE_THRESHOLD) heuristicHits++

        // Tier 1: Try Agent (Architect analyze-chunk)
        if (process.env.AGENT_ROUTING_ENABLED !== 'false') {
          try {
            const backendUp = await isBackendAvailable()
            if (backendUp) {
              const agentResult = await analyzeChunkViaAgent({
                chunkText: chunk.text,
                domainHint: domainHint && confidence >= CONFIDENCE_THRESHOLD ? domainHint : undefined,
              })
              const output = agentResult.output as { quests?: z.infer<typeof analysisSchema>['quests'] }
              if (output?.quests) {
                return { object: { quests: output.quests }, fromCache: false }
              }
            }
          } catch {
            // Fall through to direct AI
          }
        }

        // Tier 2: Direct OpenAI
        const hintLine =
          domainHint && confidence >= CONFIDENCE_THRESHOLD
            ? `Domain hint (high confidence): ${domainHint}. Prioritize this domain when clear.\n\n`
            : ''
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
        kotterStage: q.kotterStage != null ? q.kotterStage : 1,
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

// ---------------------------------------------------------------------------
// Move extraction (Emergent Move Ecology)
// ---------------------------------------------------------------------------

function slugifyForKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}

function buildMoveKey(bookId: string, chunkIndex: number, moveIndex: number, name: string): string {
  const slug = slugifyForKey(name) || 'move'
  return `book_${bookId}_c${chunkIndex}_${moveIndex}_${slug}`
}

async function findSimilarMoveByName(name: string, bookId?: string): Promise<{ id: string; key: string } | null> {
  const normalized = name.toLowerCase().trim()
  if (!normalized) return null
  const slug = slugifyForKey(name)
  const moves = await db.nationMove.findMany({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, key: true, sourceMetadata: true },
  })
  if (moves.length === 0 && slug) {
    const byKey = await db.nationMove.findMany({
      where: { key: { contains: slug, mode: 'insensitive' } },
      select: { id: true, key: true },
    })
    if (byKey.length > 0) return byKey[0]
  }
  for (const m of moves) {
    const meta = m.sourceMetadata ? (JSON.parse(m.sourceMetadata) as { sourceBookId?: string }) : {}
    if (bookId && meta.sourceBookId === bookId) return m
  }
  return moves[0] ?? null
}

async function runChunkMoveExtraction(
  bookId: string,
  chunksToProcess: TextChunk[]
): Promise<{ moves: MoveExtractionResult[]; chunkIndex: number }[]> {
  const modelId = getBookAnalysisModel()
  const results: { moves: MoveExtractionResult[]; chunkIndex: number }[] = []

  for (let i = 0; i < chunksToProcess.length; i += PARALLEL_BATCH) {
    const batch = chunksToProcess.slice(i, i + PARALLEL_BATCH)
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        const inputKey = `${bookId}:move:${chunk.index}:${chunk.text.slice(0, 500)}:${chunk.text.length}`
        const res = await generateObjectWithCache<z.infer<typeof moveExtractionSchema>>({
          feature: 'book_move_extraction',
          inputKey,
          model: modelId,
          schema: moveExtractionSchema,
          system: MOVE_EXTRACTION_PROMPT,
          prompt: `Extract transformation moves from this book chunk:\n\n---\n${chunk.text}\n---`,
          getModel: () => getOpenAI()(modelId),
        })
        return { moves: res.object.moves, chunkIndex: chunk.index }
      })
    )
    results.push(...batchResults)
    if (i + PARALLEL_BATCH < chunksToProcess.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }
  return results
}

async function createMovesFromExtraction(
  bookId: string,
  extractions: { moves: MoveExtractionResult[]; chunkIndex: number }[]
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const metalNation = await ensureMetalNationMoves()
  const clarity = await db.polarity.findUnique({ where: { key: 'clarity' } })
  const prestige = await db.polarity.findUnique({ where: { key: 'prestige' } })
  const framework = await db.polarity.findUnique({ where: { key: 'framework' } })
  const polarityByBarKind: Record<string, string> = {
    clarity: clarity?.id ?? '',
    prestige: prestige?.id ?? '',
    framework: framework?.id ?? '',
  }

  const emptyReq = JSON.stringify({ version: 1, fields: [] })
  let created = 0
  const errors: string[] = []

  for (const { moves, chunkIndex } of extractions) {
    for (let idx = 0; idx < moves.length; idx++) {
      const m = moves[idx]
      try {
        const similar = await findSimilarMoveByName(m.name, bookId)
        if (similar) {
          continue
        }

        const key = buildMoveKey(bookId, chunkIndex, idx, m.name)
        const barKind = m.barKind ?? 'clarity'
        const polarityId = polarityByBarKind[barKind] ?? clarity?.id ?? null

        await db.nationMove.upsert({
          where: { key },
          create: {
            key,
            nationId: metalNation.id,
            polarityId,
            name: m.name,
            description: m.description,
            isStartingUnlocked: false,
            appliesToStatus: JSON.stringify(['active']),
            requirementsSchema: m.requirementsHint
              ? JSON.stringify({
                  version: 1,
                  fields: [{ key: 'hint', label: 'Requirements', type: 'string', required: false }],
                })
              : emptyReq,
            effectsSchema: JSON.stringify({
              version: 1,
              barKind: barKind as 'clarity' | 'prestige' | 'framework',
            }),
            sortOrder: 1000 + chunkIndex * 10 + idx,
            tier: 'CUSTOM',
            origin: 'BOOK_EXTRACTED',
            sourceMetadata: JSON.stringify({
              sourceBookId: bookId,
              sourceChunkIndex: chunkIndex,
              moveType: m.moveType,
            }),
          },
          update: {
            name: m.name,
            description: m.description,
            polarityId,
            requirementsSchema: m.requirementsHint
              ? JSON.stringify({
                  version: 1,
                  fields: [{ key: 'hint', label: 'Requirements', type: 'string', required: false }],
                })
              : emptyReq,
            effectsSchema: JSON.stringify({
              version: 1,
              barKind: barKind as 'clarity' | 'prestige' | 'framework',
            }),
            sourceMetadata: JSON.stringify({
              sourceBookId: bookId,
              sourceChunkIndex: chunkIndex,
              moveType: m.moveType,
            }),
          },
        })
        created++
      } catch (e) {
        errors.push(`Chunk ${chunkIndex} move "${m.name}": ${(e as Error).message}`)
      }
    }
  }

  const totalMoves = extractions.reduce((s, e) => s + e.moves.length, 0)
  const skipped = totalMoves - created - errors.length
  return { created, skipped: Math.max(0, skipped), errors }
}

/**
 * Core move extraction logic (no auth). Used by analyzeBookForMoves and scripts.
 */
export async function runMoveExtraction(bookId: string): Promise<
  | { success: true; created: number; skipped: number; errors?: string[] }
  | { error: string }
> {
  try {
    if (process.env.BOOK_ANALYSIS_AI_ENABLED === 'false') {
      return { error: 'Book analysis AI is disabled. Set BOOK_ANALYSIS_AI_ENABLED=true to enable.' }
    }

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text. Run Extract Text first.' }
    if (book.status !== 'extracted' && book.status !== 'analyzed' && book.status !== 'published') {
      return { error: 'Book must be extracted, analyzed, or published to run move extraction.' }
    }

    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
    const toc = existingMeta.toc ?? null
    const chunks = toc?.entries?.length
      ? chunkBookTextWithToc(book.extractedText, toc)
      : chunkBookText(book.extractedText)
    if (chunks.length === 0) return { error: 'No text to analyze' }

    const actionableChunks = chunks.filter(chunkIsActionable)
    const chunksToProcess = sampleEvenly(actionableChunks, MAX_CHUNKS)

    const extractions = await runChunkMoveExtraction(bookId, chunksToProcess)
    const { created, skipped, errors } = await createMovesFromExtraction(bookId, extractions)

    const moveMeta = existingMeta.moveExtraction ?? {}
    const updatedMeta = {
      ...existingMeta,
      moveExtraction: {
        ...moveMeta,
        lastRunAt: new Date().toISOString(),
        movesCreated: (moveMeta.movesCreated ?? 0) + created,
        movesSkipped: (moveMeta.movesSkipped ?? 0) + skipped,
        chunkCount: chunksToProcess.length,
      },
    }
    await db.book.update({
      where: { id: bookId },
      data: { metadataJson: JSON.stringify(updatedMeta) },
    })

    revalidatePath('/admin/books')
    revalidatePath(`/admin/books/${bookId}/moves`)
    return {
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Move extraction failed'
    console.error('[BOOKS] runMoveExtraction error:', msg)
    return { error: msg }
  }
}

/**
 * Analyze a book for transformation moves (Emergent Move Ecology).
 * Extracts moves from chunks, creates NationMove with tier CUSTOM, origin BOOK_EXTRACTED.
 */
export async function analyzeBookForMoves(bookId: string) {
  await requireAdmin()
  return runMoveExtraction(bookId)
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
