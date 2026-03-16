#!/usr/bin/env node
/**
 * Analyze extracted books via the local backend Architect agent.
 *
 * Bypasses the Next.js server action wrapper (no cookies/revalidatePath needed).
 * Calls the backend directly at POST /api/agents/architect/analyze-chunk.
 *
 * Usage:
 *   DATABASE_URL="postgresql://bars:bars@localhost:5433/bars_engine" \
 *   node scripts/analyze-books-local.ts [bookId|all]
 *
 * Can be run with tsx or node --experimental-strip-types.
 *
 * Env:
 *   DATABASE_URL  — local postgres
 *   BACKEND_URL   — default http://localhost:8000
 *   OPENAI_API_KEY — needed if backend falls through to Tier-2 (not used directly here)
 *
 * Flags:
 *   --no-auto-start — fail if backend not running; do not auto-start
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { ensureBackendReady } from '../src/lib/backend-health'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Chunk splitter (mirrors src/lib/book-chunker.ts)
// ---------------------------------------------------------------------------

type TextChunk = { index: number; text: string }
const CHARS_PER_CHUNK = 4000
const OVERLAP_CHARS = 200

function chunkText(text: string): TextChunk[] {
  if (!text || text.trim().length === 0) return []
  const chunks: TextChunk[] = []
  let start = 0
  let index = 0
  while (start < text.length) {
    let end = Math.min(start + CHARS_PER_CHUNK, text.length)
    if (end < text.length) {
      const paraBreak = text.lastIndexOf('\n\n', end)
      if (paraBreak > start + CHARS_PER_CHUNK * 0.5) end = paraBreak
    }
    chunks.push({ index, text: text.slice(start, end) })
    // Only apply overlap if there's enough remaining text; otherwise stop
    if (end >= text.length) break
    start = end - OVERLAP_CHARS
    index++
  }
  return chunks
}

// ---------------------------------------------------------------------------
// Broadened actionable filter (the original skipped all of The Skilled Helper)
// ---------------------------------------------------------------------------

const ACTION_VERBS =
  /\b(do|try|practice|reflect|delegate|complete|write|list|identify|notice|observe|create|build|develop|explore|challenge|engage|apply|assess|evaluate|discuss|examine|consider|analyze|plan|design|implement|facilitate|empathize|understand|discover|connect|transform|support|guide|help|coach|counsel|mentor|teach|train|collaborate|communicate|articulate|describe|explain|summarize)\b/gi
const EXERCISE_MARKERS =
  /\b(exercise|practice|try this|activity|reflection|journal|worksheet|step|technique|strategy|model|framework|approach|method|skill|process|tool|principle|concept|theory|example|case study|scenario|dialogue|conversation)\b/gi
const SKIP_PATTERNS = [
  /\b(copyright|all rights reserved|isbn|published by)\b/i,
  /^[\d\s.\-]+$/,
]

function chunkIsActionable(chunk: TextChunk): boolean {
  const text = chunk.text
  if (text.length < 200) return false
  if (SKIP_PATTERNS.some((p) => p.test(text))) return false
  const actionMatches = text.match(ACTION_VERBS)?.length ?? 0
  const exerciseMatches = text.match(EXERCISE_MARKERS)?.length ?? 0
  const score = actionMatches + exerciseMatches * 2
  return score >= 2
}

// ---------------------------------------------------------------------------
// Sample evenly across array
// ---------------------------------------------------------------------------

function sampleEvenly<T>(arr: T[], maxN: number): T[] {
  if (arr.length <= maxN) return arr
  const step = (arr.length - 1) / Math.max(1, maxN - 1)
  return Array.from({ length: maxN }, (_, i) => arr[Math.round(i * step)])
}

// ---------------------------------------------------------------------------
// Call backend agent
// ---------------------------------------------------------------------------

interface QuestResult {
  title: string
  description: string
  moveType: string
  allyshipDomain?: string | null
  nation?: string | null
  archetype?: string | null
  kotterStage?: number
  lockType?: string | null
}

async function analyzeChunk(chunkText: string, domainHint?: string): Promise<QuestResult[]> {
  const url = `${BACKEND_URL}/api/agents/architect/analyze-chunk`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunk_text: chunkText,
        domain_hint: domainHint ?? null,
        iching_context: null,
        player_id: null,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.log(`    Agent returned ${res.status}: ${errText.slice(0, 200)}`)
      return []
    }
    const data = await res.json()
    const output = data.output
    if (output?.quests && Array.isArray(output.quests)) {
      return output.quests
    }
    // The architect may return a single quest draft
    if (output?.title && output?.description) {
      return [{
        title: output.title,
        description: output.description,
        moveType: output.move_type || 'growUp',
        allyshipDomain: output.allyship_domain || null,
        nation: output.nation || null,
        archetype: output.archetype || null,
        kotterStage: output.kotter_stage || 1,
        lockType: output.lock_type || null,
      }]
    }
    console.log('    Agent returned unexpected shape:', JSON.stringify(output).slice(0, 200))
    return []
  } catch (err) {
    console.log(`    Agent call failed: ${err instanceof Error ? err.message : err}`)
    return []
  }
}

// ---------------------------------------------------------------------------
// Create quests in DB
// ---------------------------------------------------------------------------

async function createQuests(bookId: string, quests: QuestResult[], creatorId: string): Promise<string[]> {
  const ids: string[] = []
  for (const q of quests) {
    const bar = await prisma.customBar.create({
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
    await prisma.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })
    ids.push(bar.id)
  }
  return ids
}

// ---------------------------------------------------------------------------
// Find a system creator
// ---------------------------------------------------------------------------

async function getCreatorId(): Promise<string> {
  const admin = await prisma.playerRole.findFirst({
    where: { role: { key: 'admin' } },
    select: { playerId: true },
  })
  if (admin) return admin.playerId
  const first = await prisma.player.findFirst({ select: { id: true } })
  if (first) return first.id
  throw new Error('No players in DB to use as creator')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MAX_CHUNKS = 15
const PARALLEL_BATCH = 2
const BATCH_DELAY_MS = 6000

async function analyzeBook(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book) { console.error(`Book ${bookId} not found`); return }
  if (!book.extractedText) { console.error(`Book "${book.title}" has no extracted text`); return }

  console.log(`\n📖 Analyzing: ${book.title} (${book.status})`)
  console.log(`   ${(book.extractedText.length / 1000).toFixed(0)}K chars`)

  const chunks = chunkText(book.extractedText)
  console.log(`   ${chunks.length} chunks total`)

  const actionable = chunks.filter(chunkIsActionable)
  console.log(`   ${actionable.length} actionable (${chunks.length - actionable.length} skipped by filter)`)

  if (actionable.length === 0) {
    console.log('   ⚠️ No actionable chunks — nothing to analyze')
    return
  }

  const sampled = sampleEvenly(actionable, MAX_CHUNKS)
  console.log(`   ${sampled.length} chunks sampled for analysis`)

  const creatorId = await getCreatorId()
  const allQuests: QuestResult[] = []

  for (let i = 0; i < sampled.length; i += PARALLEL_BATCH) {
    const batch = sampled.slice(i, i + PARALLEL_BATCH)
    const batchNum = Math.floor(i / PARALLEL_BATCH) + 1
    const totalBatches = Math.ceil(sampled.length / PARALLEL_BATCH)
    console.log(`   Batch ${batchNum}/${totalBatches} (chunks ${i + 1}-${Math.min(i + PARALLEL_BATCH, sampled.length)})...`)

    const results = await Promise.all(batch.map(c => analyzeChunk(c.text)))
    for (const quests of results) {
      allQuests.push(...quests)
    }

    if (i + PARALLEL_BATCH < sampled.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = allQuests.filter(q => {
    const key = q.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`   ${allQuests.length} quests extracted (${unique.length} unique)`)

  if (unique.length > 0) {
    const ids = await createQuests(bookId, unique, creatorId)
    console.log(`   ✅ ${ids.length} quests created in DB`)
  }

  // Update book metadata
  const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
  const analysisMeta = {
    chunksAnalyzed: sampled.length,
    chunksTotal: chunks.length,
    chunksSkipped: chunks.length - actionable.length,
    questsExtracted: allQuests.length,
    questsCreated: unique.length,
    analyzedChunkIndices: sampled.map(c => c.index),
    analyzedAt: new Date().toISOString(),
    method: 'analyze-books-local',
  }
  await prisma.book.update({
    where: { id: bookId },
    data: {
      status: 'analyzed',
      metadataJson: JSON.stringify({ ...existingMeta, analysis: analysisMeta }),
    },
  })
  console.log(`   Status updated to "analyzed"`)
}

async function main() {
  const NO_AUTO_START = process.argv.includes('--no-auto-start')
  try {
    await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }

  const target = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!target) {
    console.log('Usage: npx tsx scripts/analyze-books-local.ts [bookId|all|extracted]')
    console.log('  all       — analyze all extracted books')
    console.log('  extracted — analyze only books with status=extracted')
    console.log('  <id>      — analyze a specific book by ID')
    process.exit(0)
  }

  if (target === 'all' || target === 'extracted') {
    const where = target === 'extracted'
      ? { status: 'extracted', extractedText: { not: null } }
      : { extractedText: { not: null }, status: { in: ['extracted', 'analyzed'] } }
    const books = await prisma.book.findMany({
      where: where as never,
      select: { id: true, title: true, status: true },
      orderBy: { title: 'asc' },
    })
    console.log(`Found ${books.length} books to analyze:`)
    for (const b of books) {
      console.log(`  [${b.status}] ${b.title}`)
    }
    for (const b of books) {
      await analyzeBook(b.id)
    }
  } else {
    await analyzeBook(target)
  }

  await prisma.$disconnect()
  console.log('\n🏁 Done')
}

main().catch(e => {
  console.error('❌', e)
  process.exit(1)
})
