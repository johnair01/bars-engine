/**
 * Page Audit Script
 *
 * Audits all Next.js app routes for broken pages (404, 500, etc.).
 * Requires dev server running: npm run dev
 *
 * Usage:
 *   npx tsx scripts/audit-broken-pages.ts
 *   npx tsx scripts/audit-broken-pages.ts --base http://localhost:3000
 *   npx tsx scripts/audit-broken-pages.ts --output audit-report.json
 */

import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { readdirSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const APP_DIR = join(process.cwd(), 'src', 'app')
const VALID_RULES_SLUGS = [
  'game-loop', 'bar-private-public', 'bar-format', 'stewardship',
  'decks', 'quests-slots', 'compost', 'slot-offers', 'capacity',
  'design-principles', 'glossary',
]

type RouteEntry = { path: string; params: string[] }

function discoverRoutes(dir: string, prefix = '', params: string[] = []): RouteEntry[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const routes: RouteEntry[] = []

  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : `/${e.name}`
    const full = join(dir, e.name)

    if (e.isDirectory()) {
      if (e.name.startsWith('[') && e.name.endsWith(']')) {
        const param = e.name.slice(1, -1)
        routes.push(...discoverRoutes(full, rel, [...params, param]))
      } else {
        routes.push(...discoverRoutes(full, rel, params))
      }
    } else if (e.name === 'page.tsx') {
      const path = rel.replace(/\/page\.tsx$/, '').replace(/^\/?/, '/')
      routes.push({ path, params: [...params] })
    }
  }

  return routes
}

async function getSampleIds(db: PrismaClient): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  const queries: Array<[string, () => Promise<string | undefined>]> = [
    ['nation', () => db.nation.findFirst().then((r) => r?.id)],
    ['archetype', () => db.archetype.findFirst().then((r) => r?.id)],
    ['book', () => db.book.findFirst().then((r) => r?.id)],
    ['adventure', () => db.adventure.findFirst().then((r) => r?.id)],
    ['bar', () => db.customBar.findFirst().then((r) => r?.id)],
    ['questProposal', () => db.questProposal.findFirst().then((r) => r?.id)],
    ['twineStory', () => db.twineStory.findFirst().then((r) => r?.id)],
    ['questPack', () => db.questPack.findFirst().then((r) => r?.id)],
    ['passage', () => db.passage.findFirst().then((r) => r?.id)],
    ['docSlug', () => db.docNode.findFirst().then((r) => r?.slug)],
    ['daemonSeed', () => db.daemonSeed.findFirst().then((r) => r?.id)],
  ]
  for (const [key, fn] of queries) {
    try {
      const val = await fn()
      if (val) ids[key] = val
    } catch {
      // Skip if schema mismatch or table missing
    }
  }
  return ids
}

function idForParam(path: string, param: string): string {
  if (param === 'slug') return 'docSlug'
  if (param === 'barId') return 'bar'
  if (param === 'passageId') return 'passage'
  if (param === 'id') {
    if (path.includes('/books/')) return 'book'
    if (path.includes('/adventures/')) return 'adventure'
    if (path.includes('/quests/')) return 'bar'
    if (path.includes('/quest-proposals/')) return 'questProposal'
    if (path.includes('/archetype/')) return 'archetype'
    if (path.includes('/nation/')) return 'nation'
    if (path.includes('/twine/')) return 'twineStory'
    if (path.includes('/pack/')) return 'questPack'
    if (path.includes('/source-ingestion/')) return 'book'
    if (path.includes('/story/')) return 'passage'
    if (path.includes('/daemon-seeds/')) return 'daemonSeed'
    return 'adventure'
  }
  return param
}

function routeToUrls(route: RouteEntry, ids: Record<string, string>): string[] {
  const { path, params } = route

  if (params.length === 0) {
    return [path]
  }

  if (path.includes('/wiki/rules/') && params.includes('slug')) {
    return VALID_RULES_SLUGS.map((s) => path.replace('[slug]', s))
  }

  if (path.includes('/docs/') && params.includes('slug')) {
    return ids.docSlug ? [path.replace('[slug]', ids.docSlug)] : []
  }

  let resolved = path
  for (const p of params) {
    const key = idForParam(path, p)
    const id = ids[key]
    if (!id) return []
    resolved = resolved.replace(`[${p}]`, id)
  }
  return [resolved]
}

async function fetchStatus(baseUrl: string, path: string): Promise<{ status: number; ok: boolean; error?: string }> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(25000),
    })
    return { status: res.status, ok: res.ok }
  } catch (e) {
    return { status: 0, ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const baseIdx = args.indexOf('--base')
  const baseUrl = baseIdx >= 0 ? args[baseIdx + 1] ?? 'http://localhost:3000' : 'http://localhost:3000'
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : null

  console.log('=== Page Audit ===\n')
  console.log(`Base URL: ${baseUrl}`)
  console.log('Discovering routes...\n')

  const rawRoutes = discoverRoutes(APP_DIR)
  const db = new PrismaClient()

  let ids: Record<string, string> = {}
  try {
    ids = await getSampleIds(db)
    console.log(`Sample IDs from DB: ${Object.keys(ids).join(', ') || '(none)'}`)
  } catch (e) {
    console.warn('DB unavailable, dynamic routes may be skipped:', (e as Error).message)
  } finally {
    await db.$disconnect()
  }

  const urls: string[] = []
  for (const r of rawRoutes) {
    const expanded = routeToUrls(r, ids)
    urls.push(...expanded)
  }

  const unique = [...new Set(urls)].sort()
  console.log(`Checking ${unique.length} URLs...\n`)

  const results: { url: string; status: number; ok: boolean; error?: string }[] = []
  let checked = 0

  for (const path of unique) {
    const r = await fetchStatus(baseUrl, path)
    results.push({ url: path, ...r })
    checked++
    const icon = r.ok ? '✓' : r.status >= 400 ? '✗' : '?'
    const statusStr = r.error ? `ERR: ${r.error}` : String(r.status)
    process.stdout.write(`  [${checked}/${unique.length}] ${icon} ${path} → ${statusStr}\r`)
  }

  console.log('\n')

  const broken = results.filter((r) => !r.ok || r.status >= 400)
  const ok = results.filter((r) => r.ok && r.status < 400)
  const errors = results.filter((r) => r.status === 0)

  console.log('=== Summary ===')
  console.log(`  OK:     ${ok.length}`)
  console.log(`  Broken: ${broken.length} (4xx/5xx)`)
  console.log(`  Errors: ${errors.length} (fetch failed)`)

  if (broken.length > 0) {
    console.log('\n=== Broken Pages ===')
    for (const r of broken) {
      console.log(`  ${r.status} ${r.url}${r.error ? ` (${r.error})` : ''}`)
    }
  }

  if (errors.length > 0) {
    console.log('\n=== Fetch Errors ===')
    for (const r of errors) {
      console.log(`  ${r.url}: ${r.error}`)
    }
  }

  if (outputPath) {
    const fs = await import('fs')
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ baseUrl, total: unique.length, ok: ok.length, broken: broken.length, errors: errors.length, results }, null, 2)
    )
    console.log(`\nReport written to ${outputPath}`)
  }

  process.exit(broken.length + errors.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('Audit failed:', e)
  process.exit(1)
})
