#!/usr/bin/env npx tsx
/**
 * SNL Phase 3 — Analyze shadow name feedback.
 *
 * Reads shadow_name_feedback table, parses each suggested name into
 * (descriptor, role), and prints accept rates per (face, descriptor, role).
 * Use this to identify which names get edited — low-acceptance words are
 * candidates for vocab pruning or replacement.
 *
 * Usage:
 *   npm run snl:report
 *   npm run snl:report -- --min-count 3   (only show rows with ≥ N feedback events)
 *
 * Output: console table + .specify/specs/shadow-name-library/FEEDBACK_REPORT.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { SHADOW_NAME_VOCAB } from '../src/lib/shadow-name-grammar'
import { writeFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Parse a suggested name back to { descriptor, role, face, pattern }
// ---------------------------------------------------------------------------

type ParsedName = {
  descriptor: string
  role: string
  face: string
  pattern: string
}

function parseSuggestedName(name: string): ParsedName | null {
  const patterns = SHADOW_NAME_VOCAB.patterns as readonly string[]
  const faces = SHADOW_NAME_VOCAB.faces as readonly (typeof SHADOW_NAME_VOCAB.faces[number])[]

  // Build lookup sets for fast matching
  const roleToFace = new Map<string, string>()
  const descriptorSet = new Set<string>()
  for (const face of faces) {
    for (const r of face.roles) roleToFace.set(r, face.id)
    for (const d of face.descriptors) descriptorSet.add(d)
  }

  // Try each pattern
  for (const pattern of patterns) {
    if (pattern === 'The {D} {R}') {
      if (!name.startsWith('The ')) continue
      const rest = name.slice(4)
      const spaceIdx = rest.indexOf(' ')
      if (spaceIdx < 0) continue
      const d = rest.slice(0, spaceIdx)
      const r = rest.slice(spaceIdx + 1)
      if (descriptorSet.has(d) && roleToFace.has(r)) {
        return { descriptor: d, role: r, face: roleToFace.get(r)!, pattern }
      }
    } else if (pattern === '{D} {R}') {
      const spaceIdx = name.indexOf(' ')
      if (spaceIdx < 0) continue
      const d = name.slice(0, spaceIdx)
      const r = name.slice(spaceIdx + 1)
      if (descriptorSet.has(d) && roleToFace.has(r)) {
        return { descriptor: d, role: r, face: roleToFace.get(r)!, pattern }
      }
    } else if (pattern === 'The {R} of {D}') {
      if (!name.startsWith('The ')) continue
      const rest = name.slice(4)
      const ofIdx = rest.indexOf(' of ')
      if (ofIdx < 0) continue
      const r = rest.slice(0, ofIdx)
      const d = rest.slice(ofIdx + 4)
      if (descriptorSet.has(d) && roleToFace.has(r)) {
        return { descriptor: d, role: r, face: roleToFace.get(r)!, pattern }
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const minCountArg = process.argv.indexOf('--min-count')
const minCount = minCountArg >= 0 ? parseInt(process.argv[minCountArg + 1] ?? '1', 10) : 1

async function main() {
  const rows = await db.shadowNameFeedback.findMany({
    orderBy: { createdAt: 'asc' },
  })

  if (rows.length === 0) {
    console.log('No feedback rows yet. Use the "Suggest name" button in 321 Shadow Work to generate data.')
    return
  }

  console.log(`\nTotal feedback rows: ${rows.length}`)
  console.log(`Accepted: ${rows.filter(r => r.accepted).length}`)
  console.log(`Edited:   ${rows.filter(r => !r.accepted).length}`)
  console.log(`Overall accept rate: ${((rows.filter(r => r.accepted).length / rows.length) * 100).toFixed(1)}%\n`)

  // Group by (descriptor, role)
  type Stats = { total: number; accepted: number }
  const byPair = new Map<string, Stats & { face: string; descriptor: string; role: string; pattern: string }>()
  let unparsed = 0

  for (const row of rows) {
    const parsed = parseSuggestedName(row.suggestedName)
    if (!parsed) { unparsed++; continue }
    const key = `${parsed.descriptor}|${parsed.role}`
    const existing = byPair.get(key)
    if (existing) {
      existing.total++
      if (row.accepted) existing.accepted++
    } else {
      byPair.set(key, { ...parsed, total: 1, accepted: row.accepted ? 1 : 0 })
    }
  }

  // Sort by accept rate ascending (worst first — candidates for pruning)
  const sorted = [...byPair.values()]
    .filter(s => s.total >= minCount)
    .sort((a, b) => (a.accepted / a.total) - (b.accepted / b.total))

  // Console table
  const tableRows = sorted.map(s => ({
    face: s.face,
    descriptor: s.descriptor,
    role: s.role,
    pattern: s.pattern,
    total: s.total,
    accepted: s.accepted,
    'accept%': `${((s.accepted / s.total) * 100).toFixed(0)}%`,
  }))
  if (tableRows.length > 0) console.table(tableRows)

  // Pattern breakdown
  const byPattern = new Map<string, Stats>()
  for (const row of rows) {
    const parsed = parseSuggestedName(row.suggestedName)
    if (!parsed) continue
    const existing = byPattern.get(parsed.pattern)
    if (existing) {
      existing.total++
      if (row.accepted) existing.accepted++
    } else {
      byPattern.set(parsed.pattern, { total: 1, accepted: row.accepted ? 1 : 0 })
    }
  }

  // Markdown report
  const now = new Date().toISOString().slice(0, 10)
  const mdRows = tableRows
    .map(r => `| ${r.face} | ${r.descriptor} | ${r.role} | ${r['accept%']} | ${r.total} |`)
    .join('\n')
  const patternRows = [...byPattern.entries()]
    .map(([p, s]) => `| \`${p}\` | ${s.total} | ${((s.accepted / s.total) * 100).toFixed(0)}% |`)
    .join('\n')

  const md = `# Shadow Name Feedback Report

**Generated**: ${now}
**Total rows**: ${rows.length} | **Accepted**: ${rows.filter(r => r.accepted).length} | **Edited**: ${rows.filter(r => !r.accepted).length}
**Overall accept rate**: ${((rows.filter(r => r.accepted).length / rows.length) * 100).toFixed(1)}%
${unparsed > 0 ? `\n> ⚠️ ${unparsed} row(s) could not be parsed (fallback names or schema drift).\n` : ''}
## Accept Rate by (Descriptor, Role) — worst first

| Face | Descriptor | Role | Accept% | Count |
|------|------------|------|---------|-------|
${mdRows || '| — | — | — | — | — |'}

> Rows with accept% < 50% are candidates for vocab pruning.

## Accept Rate by Pattern

| Pattern | Count | Accept% |
|---------|-------|---------|
${patternRows || '| — | — | — |'}

## Suggested Actions

${sorted.filter(s => s.accepted / s.total < 0.5 && s.total >= 3).length > 0
  ? sorted
      .filter(s => s.accepted / s.total < 0.5 && s.total >= 3)
      .map(s => `- **${s.descriptor} ${s.role}** (${s.face}): ${((s.accepted / s.total) * 100).toFixed(0)}% accept rate — consider replacing in vocab`)
      .join('\n')
  : '_No low-acceptance pairs with ≥ 3 samples yet._'
}
`

  const outPath = join(process.cwd(), '.specify', 'specs', 'shadow-name-library', 'FEEDBACK_REPORT.md')
  writeFileSync(outPath, md, 'utf-8')
  console.log(`\n✅ Report written to ${outPath}`)
  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
