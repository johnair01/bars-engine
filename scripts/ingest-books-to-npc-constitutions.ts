#!/usr/bin/env npx tsx
/**
 * Ingest book extracted text into NPC constitutions at matching altitudes.
 *
 * For each book with extractedText, finds NPCs at the matching altitude
 * and patches their identity/values/function/limits fields with AI-extracted
 * constitutional wisdom.
 *
 * Usage:
 *   npx tsx scripts/ingest-books-to-npc-constitutions.ts
 *   npx tsx scripts/ingest-books-to-npc-constitutions.ts --dry-run
 *
 * Env:
 *   DATABASE_URL   — Postgres connection
 *   OPENAI_API_KEY — Required for AI extraction
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConstitutionField = 'identity' | 'values' | 'function' | 'limits'

interface AltitudeMapping {
  altitude: string
  fields: ConstitutionField[]
}

interface NpcConstitutionRecord {
  id: string
  name: string
  identity: string
  values: string
  function: string
  limits: string
  npcProfile: {
    altitude: string
  } | null
}

interface PatchResult {
  [key: string]: string
}

// ---------------------------------------------------------------------------
// Book → altitude mapping
// ---------------------------------------------------------------------------

const BOOK_ALTITUDE_MAP: Record<string, AltitudeMapping> = {
  'Existential Kink':             { altitude: 'shaman',     fields: ['identity', 'values'] },
  'Integral Life Practice':       { altitude: 'shaman',     fields: ['identity', 'values'] },
  'The Skilled Helper':           { altitude: 'diplomat',   fields: ['function', 'limits'] },
  'Integral Communication':       { altitude: 'diplomat',   fields: ['function', 'identity'] },
  'Kids on Bikes':                { altitude: 'challenger', fields: ['function', 'values'] },
  'Holacracy Constitution':       { altitude: 'regent',     fields: ['function', 'limits'] },
  'Reinventing Organizations':    { altitude: 'regent',     fields: ['values', 'function'] },
  'Valve Employee Handbook':      { altitude: 'regent',     fields: ['limits', 'function'] },
  'Emergent Strategy':            { altitude: 'sage',       fields: ['identity', 'values'] },
  'Integral Theory':              { altitude: 'sage',       fields: ['identity', 'values'] },
  'Actionable Gamification':      { altitude: 'architect',  fields: ['function', 'identity'] },
  'MTGOA':                        { altitude: 'architect',  fields: ['values', 'function'] },
  '10000 Hours of Play':          { altitude: 'architect',  fields: ['values', 'identity'] },
  'Hearts Blazing':               { altitude: 'diplomat',   fields: ['identity', 'values'] },
  'Wikipedia The Missing Manual': { altitude: 'sage',       fields: ['function', 'limits'] },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findAltitudeMapping(title: string): AltitudeMapping | null {
  const lowerTitle = title.toLowerCase()
  for (const [key, mapping] of Object.entries(BOOK_ALTITUDE_MAP)) {
    if (lowerTitle.includes(key.toLowerCase())) {
      return mapping
    }
  }
  return null
}

function hasAlreadyIngested(npc: NpcConstitutionRecord, bookTitle: string): boolean {
  // Check if any JSON field already has a book_wisdom entry for this book
  const fields: ConstitutionField[] = ['identity', 'values', 'function', 'limits']
  for (const field of fields) {
    try {
      const parsed = JSON.parse(npc[field])
      if (Array.isArray(parsed.book_wisdom)) {
        const alreadyHas = parsed.book_wisdom.some(
          (entry: { source?: string }) => entry.source === bookTitle
        )
        if (alreadyHas) return true
      }
    } catch {
      // not valid JSON — skip check for this field
    }
  }
  return false
}

function parseFieldSafely(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  // Treat non-object values as a wrapped object
  return { _raw: raw }
}

// ---------------------------------------------------------------------------
// OpenAI extraction
// ---------------------------------------------------------------------------

async function extractConstitutionalInsights(
  openai: OpenAI,
  book: { title: string; extractedText: string },
  mapping: AltitudeMapping
): Promise<{ patch: PatchResult; tokensUsed: number }> {
  const chunk = book.extractedText.slice(0, 3000)
  const fieldKeys = mapping.fields.map((f) => `"${f}_patch"`)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You extract constitutional wisdom for an NPC character at the ${mapping.altitude} altitude in a gamified social system (BARs Engine, Integral Theory / Taoism aesthetic). Extract insights that would update the NPC's ${mapping.fields.join(' and ')} fields.`,
      },
      {
        role: 'user',
        content: `Book: "${book.title}"\n\nText excerpt:\n${chunk}\n\nReturn a JSON object with keys: ${fieldKeys.join(', ')}. Each value is a short string (max 2 sentences) of wisdom this book adds to that field. Be terse and game-ready.`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  let patch: PatchResult = {}
  try {
    patch = JSON.parse(raw) as PatchResult
  } catch {
    console.warn('    Warning: Could not parse OpenAI response JSON, using empty patch')
  }

  const tokensUsed = completion.usage?.total_tokens ?? 0
  return { patch, tokensUsed }
}

// ---------------------------------------------------------------------------
// Apply patch to a single NPC
// ---------------------------------------------------------------------------

async function applyPatchToNpc(
  db: ReturnType<typeof PrismaClient['prototype']['constructor']>,
  npc: NpcConstitutionRecord,
  mapping: AltitudeMapping,
  patch: PatchResult,
  bookTitle: string,
  dryRun: boolean
): Promise<void> {
  // Snapshot before patching
  if (!dryRun) {
    await db.npcConstitutionVersion.create({
      data: {
        npcId: npc.id,
        version: `book-ingest-${bookTitle.slice(0, 20).replace(/\s/g, '-')}-${Date.now()}`,
        snapshot: JSON.stringify({
          identity: npc.identity,
          values: npc.values,
          function: npc.function,
          limits: npc.limits,
        }),
        changedBy: 'book_ingest',
      },
    })
  }

  // Apply each field patch
  const updates: Partial<Record<ConstitutionField, string>> = {}

  for (const field of mapping.fields) {
    const patchKey = `${field}_patch`
    const patchText = patch[patchKey]
    if (!patchText) continue

    const current = parseFieldSafely(npc[field])
    const bookWisdom = Array.isArray(current.book_wisdom) ? current.book_wisdom : []
    ;(bookWisdom as Array<{ source: string; insight: string }>).push({
      source: bookTitle,
      insight: patchText,
    })
    current.book_wisdom = bookWisdom
    updates[field] = JSON.stringify(current)
  }

  if (Object.keys(updates).length === 0) {
    console.log(`    (no patch keys matched for ${npc.name})`)
    return
  }

  if (!dryRun) {
    await db.npcConstitution.update({
      where: { id: npc.id },
      data: updates,
    })
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) {
    console.log('[DRY RUN] No DB writes will occur.\n')
  }

  const db = new PrismaClient()
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let totalBooksProcessed = 0
  let totalNpcsUpdated = 0
  let totalTokensUsed = 0

  try {
    // 1. Load all books with extracted text
    const books = await db.book.findMany({
      where: { extractedText: { not: null } },
      select: { id: true, title: true, extractedText: true },
    }) as Array<{ id: string; title: string; extractedText: string }>

    console.log(`Found ${books.length} book(s) with extractedText.\n`)

    // 2. Process each book sequentially
    for (const book of books) {
      try {
        // Find altitude mapping
        const mapping = findAltitudeMapping(book.title)
        if (!mapping) {
          console.log(`Skipping "${book.title}" — no altitude mapping found`)
          continue
        }

        console.log(`Processing "${book.title}" -> ${mapping.altitude} altitude`)

        // Find NPCs at matching altitude
        const npcs = await db.npcConstitution.findMany({
          where: { npcProfile: { altitude: mapping.altitude } },
          include: { npcProfile: true },
          select: {
            id: true,
            name: true,
            identity: true,
            values: true,
            function: true,
            limits: true,
            npcProfile: { select: { altitude: true } },
          },
        }) as NpcConstitutionRecord[]

        if (npcs.length === 0) {
          console.log(`  No NPCs found at "${mapping.altitude}" altitude — skipping`)
          continue
        }

        console.log(`  Found ${npcs.length} NPC(s) at ${mapping.altitude} altitude`)

        // Check skip: if ALL NPCs already have this book ingested, skip the API call entirely
        const npcsToUpdate = npcs.filter((npc) => !hasAlreadyIngested(npc, book.title))
        if (npcsToUpdate.length === 0) {
          console.log(`  All NPCs already have "${book.title}" ingested — skipping`)
          continue
        }

        // Call OpenAI once per book (not per NPC)
        let patch: PatchResult = {}
        let tokensUsed = 0

        if (!dryRun) {
          const result = await extractConstitutionalInsights(openai, book, mapping)
          patch = result.patch
          tokensUsed = result.tokensUsed
          totalTokensUsed += tokensUsed
          console.log(`  Tokens used: ${tokensUsed}`)
        } else {
          console.log(`  [DRY RUN] Would call OpenAI for "${book.title}"`)
          // Simulate a patch for dry-run display
          for (const field of mapping.fields) {
            patch[`${field}_patch`] = `[dry-run] wisdom from "${book.title}"`
          }
        }

        // Apply patch to each NPC
        for (const npc of npcsToUpdate) {
          try {
            await applyPatchToNpc(db, npc, mapping, patch, book.title, dryRun)
            totalNpcsUpdated++
            const tag = dryRun ? '[DRY RUN] Would update' : 'Updated'
            console.log(`  ${tag}: ${npc.name} (id: ${npc.id})`)
          } catch (npcErr) {
            console.error(
              `  Error updating NPC "${npc.name}" (${npc.id}):`,
              npcErr instanceof Error ? npcErr.message : npcErr
            )
          }
        }

        totalBooksProcessed++
      } catch (bookErr) {
        console.error(
          `Error processing book "${book.title}":`,
          bookErr instanceof Error ? bookErr.message : bookErr
        )
      }
    }
  } finally {
    await db.$disconnect()
  }

  // Summary
  console.log('\n--- Summary ---')
  console.log(`Books processed:  ${totalBooksProcessed}`)
  console.log(`NPCs updated:     ${totalNpcsUpdated}`)
  console.log(`Total tokens:     ${totalTokensUsed}`)
  if (dryRun) {
    console.log('[DRY RUN] No changes were written to the database.')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
