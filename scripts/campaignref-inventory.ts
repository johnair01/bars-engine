/**
 * Regenerates the auto-index section of docs/CAMPAIGNREF_INVENTORY.md
 * (issue #40, spec: .specify/specs/campaignref-inventory-audit/).
 *
 * Usage:
 *   npx tsx scripts/campaignref-inventory.ts
 *   npx tsx scripts/campaignref-inventory.ts --stdout   # print table only
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(__dirname, '..')
const DOC = join(ROOT, 'docs', 'CAMPAIGNREF_INVENTORY.md')

const MARKER_START = '<!-- campaignref-inventory:auto:start -->'
const MARKER_END = '<!-- campaignref-inventory:auto:end -->'

const EXT = /\.(ts|tsx|prisma|mjs|ya?ml)$/i

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'coverage'])

function walk(dir: string, out: string[]): void {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    let st: ReturnType<typeof statSync>
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      walk(p, out)
      continue
    }
    if (!EXT.test(name)) continue
    out.push(p)
  }
}

function countMatches(text: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  let i = 0
  while (i < text.length) {
    const j = text.indexOf(needle, i)
    if (j === -1) break
    n++
    i = j + needle.length
  }
  return n
}

function bucketFor(relPath: string): string {
  if (relPath.startsWith('prisma/')) return 'prisma'
  if (relPath.startsWith('scripts/')) return 'scripts'
  if (relPath.startsWith('src/actions/')) return 'src/actions'
  if (relPath.startsWith('src/app/')) return 'src/app'
  if (relPath.startsWith('src/lib/')) return 'src/lib'
  if (relPath.startsWith('src/components/')) return 'src/components'
  if (relPath.startsWith('src/')) return 'src/other'
  if (relPath.startsWith('openapi/')) return 'openapi'
  return 'other'
}

function main(): void {
  const roots = [join(ROOT, 'src'), join(ROOT, 'prisma'), join(ROOT, 'scripts'), join(ROOT, 'openapi')]

  const files: string[] = []
  for (const r of roots) {
    try {
      if (statSync(r).isDirectory()) walk(r, files)
    } catch {
      /* skip missing */
    }
  }

  const needle = 'campaignRef'
  const rows: { rel: string; count: number; bucket: string }[] = []
  for (const abs of files) {
    let text: string
    try {
      text = readFileSync(abs, 'utf8')
    } catch {
      continue
    }
    const c = countMatches(text, needle)
    if (c === 0) continue
    const rel = relative(ROOT, abs).split(join('\\')).join('/')
    rows.push({ rel, count: c, bucket: bucketFor(rel) })
  }

  rows.sort((a, b) => b.count - a.count || a.rel.localeCompare(b.rel))

  const byBucket = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byBucket.get(row.bucket) ?? []
    list.push(row)
    byBucket.set(row.bucket, list)
  }

  const bucketOrder = [
    'prisma',
    'src/actions',
    'src/app',
    'src/lib',
    'src/components',
    'src/other',
    'scripts',
    'openapi',
    'other',
  ]

  let md = 'Auto-generated (**do not edit by hand** — run `npm run campaignref:inventory`).\n\n'
  md += `Total files with at least one \`campaignRef\`: **${rows.length}** (code roots: src, prisma, scripts, openapi).\n\n`
  md += '> Spec references under `.specify/` are excluded from this scan; many specs mention `campaignRef` narratively.\n\n'

  for (const b of bucketOrder) {
    const list = byBucket.get(b)
    if (!list?.length) continue
    md += `### ${b} (${list.length} files)\n\n`
    md += '| File | Matches |\n|------|--------:|\n'
    for (const { rel, count } of list) {
      md += `| \`${rel}\` | ${count} |\n`
    }
    md += '\n'
  }

  const stdoutOnly = process.argv.includes('--stdout')
  if (stdoutOnly) {
    process.stdout.write(md)
    return
  }

  let doc: string
  try {
    doc = readFileSync(DOC, 'utf8')
  } catch {
    console.error('Missing', DOC, '— create it first.')
    process.exit(1)
  }
  const si = doc.indexOf(MARKER_START)
  const ei = doc.indexOf(MARKER_END)
  if (si === -1 || ei === -1 || ei <= si) {
    console.error('Markers not found in', DOC)
    process.exit(1)
  }
  const next =
    doc.slice(0, si + MARKER_START.length) +
    '\n\n' +
    md.trim() +
    '\n\n' +
    doc.slice(ei)
  writeFileSync(DOC, next, 'utf8')
  console.log(`Updated ${relative(ROOT, DOC)} (${rows.length} files).`)
}

main()
