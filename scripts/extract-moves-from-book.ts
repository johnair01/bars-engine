#!/usr/bin/env node
/**
 * Extract transformation moves from a book (Emergent Move Ecology).
 *
 * Usage:
 *   npm run extract-moves -- <bookId>
 *   tsx scripts/extract-moves-from-book.ts <bookId>
 *
 * Env:
 *   DATABASE_URL  — Postgres connection
 *   OPENAI_API_KEY — Required for AI extraction
 *   BOOK_ANALYSIS_AI_ENABLED — Set to "true" (default) to enable
 */

import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { runMoveExtraction } from '../src/actions/book-analyze'

async function main() {
  const bookId = process.argv[2]
  if (!bookId) {
    console.error('Usage: npm run extract-moves -- <bookId>')
    process.exit(1)
  }

  console.log(`Extracting moves from book ${bookId}...`)
  const result = await runMoveExtraction(bookId)

  if (result.error) {
    console.error('Error:', result.error)
    process.exit(1)
  }

  console.log(`Created: ${result.created}, Skipped: ${result.skipped}`)
  if (result.errors?.length) {
    result.errors.forEach((e) => console.warn('  -', e))
  }
}

main()
