#!/usr/bin/env npx tsx
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })
import * as fs from 'fs'
import * as path from 'path'
import { db } from '../src/lib/db'

const BACKLOG_PATH = path.join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')

/** Parse priority string to number for sorting (e.g. "0.5" -> 0.5, "**0 (Urgent)**" -> 0) */
function parsePriority(s: string): number {
  const m = s.replace(/\*\*/g, '').match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : 0
}

/** Parse status: [x] Done -> Done, [/] In-Progress -> In-Progress, [ ] Ready -> Ready, [Superseded by X] -> Superseded by X */
function parseStatus(s: string): string {
  const t = s.trim()
  if (t.startsWith('[x]')) return 'Done'
  if (t.startsWith('[/]')) return 'In-Progress'
  if (t.startsWith('[ ]')) return 'Ready'
  const m = t.match(/\[Superseded by ([^\]]+)\]/)
  if (m) return `Superseded by ${m[1]}`
  return 'Ready'
}

/** Extract link from feature cell: [text](path) -> path, else feature name as-is for display */
function extractLink(featureCell: string): string | null {
  const m = featureCell.match(/\]\(([^)]+)\)/)
  return m ? m[1] : null
}

/** Strip markdown from feature name */
function stripFeatureName(featureCell: string): string {
  return featureCell
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim()
}

async function main() {
  // Ensure table exists (idempotent; safe if schema uses db push with drift)
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS spec_kit_backlog_items (
        id TEXT PRIMARY KEY,
        priority DOUBLE PRECISION NOT NULL DEFAULT 0,
        "featureName" TEXT NOT NULL,
        link TEXT,
        category TEXT NOT NULL DEFAULT 'UI',
        status TEXT NOT NULL DEFAULT 'Ready',
        dependencies TEXT NOT NULL DEFAULT '',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {
    // Table may already exist or schema is managed by migrations
  }

  const content = fs.readFileSync(BACKLOG_PATH, 'utf-8')
  const tableStart = content.indexOf('## Objective Stack')
  const tableEnd = content.indexOf('## Bruised Banana Campaign')
  if (tableStart < 0 || tableEnd < 0) {
    console.error('Could not find Objective Stack table')
    process.exit(1)
  }
  const tableSection = content.slice(tableStart, tableEnd)
  const lines = tableSection.split('\n').filter((l) => l.startsWith('|') && !l.includes('Priority') && !l.includes(':---'))

  const rows: { id: string; priority: number; featureName: string; link: string | null; category: string; status: string; dependencies: string }[] = []

  for (const line of lines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length < 6) continue
    const [priorityRaw, idRaw, featureRaw, category, statusRaw, depsRaw] = cells
    const id = idRaw.replace(/\*\*/g, '').trim()
    if (!id || id.length > 10) continue
    const priority = parsePriority(priorityRaw)
    const featureName = stripFeatureName(featureRaw)
    const link = extractLink(featureRaw)
    const status = parseStatus(statusRaw)
    const deps = (depsRaw || '-').replace(/\*\*/g, '').trim()
    const dependencies = deps === '-' ? '' : deps
    rows.push({ id, priority, featureName, link, category, status, dependencies })
  }

  // Remove any bogus rows (e.g. parsed header separator)
  await db.specKitBacklogItem.deleteMany({ where: { id: { contains: ':' } } }).catch(() => {})

  console.log(`Seeding ${rows.length} Spec Kit backlog items...`)
  for (const r of rows) {
    await db.specKitBacklogItem.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        priority: r.priority,
        featureName: r.featureName,
        link: r.link,
        category: r.category,
        status: r.status,
        dependencies: r.dependencies,
      },
      update: {
        priority: r.priority,
        featureName: r.featureName,
        link: r.link,
        category: r.category,
        status: r.status,
        dependencies: r.dependencies,
      },
    })
  }
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
