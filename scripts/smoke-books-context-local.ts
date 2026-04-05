/**
 * Local smoke test for Books context API (same auth as Custom GPT).
 * Loads .env.local then .env (same order as Next.js).
 *
 * Usage:
 *   npm run dev   # terminal 1
 *   npm run smoke:books-api:local   # terminal 2
 *
 * Optional: BASE=https://other-host.vercel.app npm run smoke:books-api:local
 */

import { config } from 'dotenv'
import process from 'node:process'

config({ path: '.env.local' })
config({ path: '.env' })

const BASE = (process.env.BASE ?? 'http://localhost:3000').replace(/\/$/, '')
const key = process.env.BOOKS_CONTEXT_API_KEY?.trim()

async function get(path: string, label: string): Promise<{ status: number; body: string }> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const body = await res.text()
  const preview = body.slice(0, 500).replace(/\s+/g, ' ')
  console.log(`\n${label}`)
  console.log(`  ${res.status}  ${url}`)
  if (!res.ok) {
    console.error(`  body: ${body.slice(0, 800)}`)
  } else {
    console.log(`  preview: ${preview}${body.length > 500 ? '…' : ''}`)
  }
  return { status: res.status, body }
}

async function main() {
  if (!key) {
    console.error(
      'Missing BOOKS_CONTEXT_API_KEY in .env.local (or .env).\n' +
        'Add a long random secret, e.g.:\n' +
        '  openssl rand -hex 32\n' +
        'Then in .env.local:\n' +
        '  BOOKS_CONTEXT_API_KEY=<paste>\n' +
        'See docs/BOOKS_CONTEXT_API.md'
    )
    process.exit(1)
  }

  console.log(`Books context API smoke (BASE=${BASE})`)

  let list: { status: number; body: string }
  try {
    list = await get('/api/admin/books?compact=1', '1) listBooks')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(
      `\nRequest failed (${msg}). Is the dev server running?\n  npm run dev\n`
    )
    process.exit(1)
  }

  if (list.status !== 200) {
    process.exit(1)
  }

  let bookId: string | undefined
  try {
    const data = JSON.parse(list.body) as { books?: { id: string }[] }
    bookId = data.books?.[0]?.id
  } catch {
    console.error('Could not parse list response as JSON')
    process.exit(1)
  }

  if (bookId) {
    const meta = await get(`/api/admin/books/${bookId}`, '2) getBook (metadata)')
    if (meta.status !== 200) process.exit(1)

    const quests = await get(
      `/api/admin/books/${bookId}/quests?compact=1`,
      '3) list book quests'
    )
    if (quests.status !== 200) process.exit(1)

    const tags = await get(`/api/admin/books/${bookId}/chunk-tags`, '4) list chunk-tags (Sage slice)')
    if (tags.status !== 200) process.exit(1)
  } else {
    console.log('\n(No books in DB — skipped single-book + chunk-tags checks.)')
  }

  console.log('\nAll checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
