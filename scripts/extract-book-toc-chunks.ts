/**
 * Deterministic TOC → chunk manifest for an uploaded Book (admin/books).
 *
 * Usage:
 *   npx tsx scripts/with-env.ts "npx tsx scripts/extract-book-toc-chunks.ts --bookId <cuid>"
 *   npx tsx scripts/extract-book-toc-chunks.ts --bookId <cuid> --titles "Chapter 1,Chapter 2"
 *
 * Requires DATABASE_URL and a Book row with extractedText populated.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { db } from '@/lib/db'
import { extractTocFromText } from '@/lib/book-toc'
import { sliceBookTextByTitles } from '@/lib/book-toc-slices'

function parseArgs() {
  const argv = process.argv.slice(2)
  let bookId: string | undefined
  let titlesArg: string | undefined
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bookId' && argv[i + 1]) {
      bookId = argv[++i]
    } else if (argv[i] === '--titles' && argv[i + 1]) {
      titlesArg = argv[++i]
    }
  }
  return { bookId, titlesArg }
}

async function main() {
  const { bookId, titlesArg } = parseArgs()
  if (!bookId) {
    console.error('Usage: npx tsx scripts/extract-book-toc-chunks.ts --bookId <cuid> [--titles "T1,T2,T3"]')
    process.exit(1)
  }

  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { id: true, slug: true, title: true, extractedText: true, status: true },
  })

  if (!book?.extractedText) {
    console.error(`Book ${bookId} not found or has no extractedText (status: ${book?.status ?? 'n/a'})`)
    process.exit(1)
  }

  const text = book.extractedText
  let titles: string[]
  if (titlesArg) {
    titles = titlesArg.split(',').map((t) => t.trim()).filter(Boolean)
  } else {
    const toc = extractTocFromText(text)
    titles = toc.entries.map((e) => e.title)
  }

  const sliced = sliceBookTextByTitles(text, titles, { idPrefix: book.slug || 'section' })

  const manifest = {
    bookId: book.id,
    bookTitle: book.title,
    extractedAt: new Date().toISOString(),
    titleCount: titles.length,
    entries: sliced.entries,
    warnings: sliced.warnings,
  }

  console.log(JSON.stringify(manifest, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
