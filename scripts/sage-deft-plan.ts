#!/usr/bin/env npx tsx
/**
 * Sage Deft Plan — Cast a hexagram, consult the Sage, and generate a deft implementation plan from the backlog.
 *
 * 1. Cast hexagram (traditional 6 lines)
 * 2. Fetch hexagram meaning from DB
 * 3. Parse open backlog items
 * 4. Get Sage coordination suggestions (face assignments, convergence)
 * 5. Call Sage backend if available, else synthesize locally from hexagram + backlog
 * 6. Write implementation plan to .specify/plans/
 *
 * Usage:
 *   npm run sage:deft-plan
 *   npm run sage:deft-plan -- --top 15
 *   npm run sage:deft-plan -- --backend http://localhost:8000
 *   npm run sage:deft-plan -- --hexagram 20  (use specific hexagram instead of casting)
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { getSageCoordinationSuggestions } from '../src/lib/sage-coordination'
import { getHexagramStructure } from '../src/lib/iching-struct'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

function flag(name: string): string | null {
  const eqForm = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (eqForm) return eqForm.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1]
  }
  return null
}

const BACKEND_URL = flag('backend') ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const TOP_N = parseInt(flag('top') ?? '20') || 20
const FIXED_HEXAGRAM = flag('hexagram') ? parseInt(flag('hexagram')!) : null

// ---------------------------------------------------------------------------
// Cast hexagram (traditional 6 lines)
// ---------------------------------------------------------------------------

function castHexagram(): number {
  if (FIXED_HEXAGRAM != null && FIXED_HEXAGRAM >= 1 && FIXED_HEXAGRAM <= 64) {
    return FIXED_HEXAGRAM
  }
  const lines = Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1))
  const hexagramId = 1 + lines.reduce((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
  return Math.max(1, Math.min(64, hexagramId))
}

// ---------------------------------------------------------------------------
// Parse backlog (from sage-brief logic)
// ---------------------------------------------------------------------------

interface OpenItem {
  id: string
  name: string
  category: string
  dependencies: string
}

function parseBacklogItems(topN: number): OpenItem[] {
  const jsonPath = join(process.cwd(), '.specify', 'backlog', 'items.json')
  if (existsSync(jsonPath)) {
    try {
      const { items } = JSON.parse(readFileSync(jsonPath, 'utf-8'))
      return (items as { id: string; featureName: string; category: string; dependencies: string; status: string }[])
        .filter((i) => i.status !== 'Done' && i.status !== 'In-Progress')
        .slice(0, topN)
        .map((i) => ({ id: i.id, name: i.featureName, category: i.category, dependencies: i.dependencies || '' }))
    } catch {
      // fall through
    }
  }

  const mdPath = join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')
  if (!existsSync(mdPath)) return []

  const lines = readFileSync(mdPath, 'utf-8').split('\n')
  const open: OpenItem[] = []

  for (const line of lines) {
    const match = line.match(/^\|\s*[\d.*(]+[^|]*\|\s*\*{0,2}([A-Z]{1,3}[0-9]*)\*{0,2}\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)/)
    if (!match) continue
    const [, id, nameRaw, categoryRaw, statusRaw, depsRaw] = match
    const status = statusRaw.trim()
    if (status.includes('[ ]') && open.length < topN) {
      const name = nameRaw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').trim()
      open.push({ id: id.trim(), name, category: categoryRaw.trim(), dependencies: depsRaw.trim() })
    }
  }
  return open
}

// ---------------------------------------------------------------------------
// Sage consult (optional)
// ---------------------------------------------------------------------------

interface SageOutput {
  synthesis: string
  discerned_move: string | null
  hexagram_alignment: { hexagram_number: number | null; alignment_score: number; interpretation: string } | null
}

async function callSage(question: string): Promise<{ synthesis: string; hexagram?: { number: number; interpretation: string } } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const out = data.output as SageOutput
    const hex = out?.hexagram_alignment
    return {
      synthesis: out?.synthesis ?? '',
      hexagram: hex?.hexagram_number
        ? { number: hex.hexagram_number, interpretation: hex.interpretation ?? '' }
        : undefined,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Local synthesis (when Sage backend unavailable)
// ---------------------------------------------------------------------------

function synthesizeLocalPlan(
  hexagramId: number,
  hexagram: { name: string; tone: string; text: string },
  openItems: OpenItem[],
  coordination: ReturnType<typeof getSageCoordinationSuggestions>
): string {
  const structure = getHexagramStructure(hexagramId)
  const lines: string[] = [
    `# Deft Implementation Plan — Hexagram ${hexagramId}: ${hexagram.name}`,
    '',
    `**Cast**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '## Hexagram Reading',
    '',
    `**${hexagram.name}** — ${hexagram.tone || 'No tone'}`,
    '',
    `**Structure**: ${structure.upper} over ${structure.lower}`,
    '',
    hexagram.text ? `**Meaning**: ${hexagram.text.slice(0, 500)}${hexagram.text.length > 500 ? '...' : ''}` : '',
    '',
    '## Sage Guidance',
    '',
    'The hexagram suggests: *ground your next moves in the quality of the moment*. ' +
      'Prioritize items that build on what is solid (lower trigram) and move toward what is emerging (upper trigram).',
    '',
    '## Implementation Order',
    '',
  ]

  // Group by suggested owner
  const byFace = new Map<string, OpenItem[]>()
  for (const a of coordination.assignments) {
    const item = openItems.find((i) => i.id === a.itemId)
    if (item) {
      const face = a.suggestedOwner
      if (!byFace.has(face)) byFace.set(face, [])
      byFace.get(face)!.push(item)
    }
  }

  const FACE_ORDER = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of FACE_ORDER) {
    const items = byFace.get(face)
    if (!items?.length) continue
    lines.push(`### ${face.charAt(0).toUpperCase() + face.slice(1)}`)
    lines.push('')
    for (const item of items) {
      const deps = item.dependencies && item.dependencies !== '-' ? ` (deps: ${item.dependencies})` : ''
      lines.push(`- [ ] **${item.id}** — ${item.name}${deps}`)
    }
    lines.push('')
  }

  // Convergence
  if (coordination.convergenceGroups.length > 0) {
    lines.push('## Convergence Groups')
    lines.push('')
    lines.push('These items share dependencies; consider sequencing or parallel work:')
    lines.push('')
    for (const g of coordination.convergenceGroups) {
      lines.push(`- ${g.itemIds.join(', ')}: ${g.reason}`)
    }
    lines.push('')
  }

  lines.push('## Do Next')
  lines.push('')
  lines.push('1. Pick the highest-priority item from the top of the list that has unblocked dependencies.')
  lines.push('2. Run `npm run build` and `npm run db:sync` before starting.')
  lines.push('3. Create a spec/plan from the backlog item if one does not exist.')
  lines.push('4. Implement API-first, then UI.')
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Casting hexagram...')
  const hexagramId = castHexagram()

  const hexagram = await db.bar.findUnique({ where: { id: hexagramId } })
  if (!hexagram) {
    console.error(`Hexagram ${hexagramId} not found in DB. Run seed.`)
    process.exit(1)
  }

  console.log(`\n☯ Hexagram ${hexagramId}: ${hexagram.name}`)
  console.log(`   ${hexagram.tone || '—'}`)
  if (hexagram.text) {
    const preview = hexagram.text.slice(0, 200) + (hexagram.text.length > 200 ? '...' : '')
    console.log(`   ${preview}`)
  }

  const openItems = parseBacklogItems(TOP_N)
  console.log(`\nOpen backlog items (top ${openItems.length}):`)
  for (const item of openItems.slice(0, 5)) {
    console.log(`   - [${item.id}] ${item.name}`)
  }
  if (openItems.length > 5) console.log(`   ... and ${openItems.length - 5} more`)

  const coordination = getSageCoordinationSuggestions(
    openItems.map((i) => ({ id: i.id, name: i.name, category: i.category, dependencies: i.dependencies }))
  )

  const question = `Given Hexagram ${hexagramId} (${hexagram.name}): ${hexagram.tone || ''}. ${hexagram.text?.slice(0, 300) || ''}

Open backlog (top ${openItems.length}):
${openItems.map((i) => `- [${i.id}] ${i.name} (${i.category})`).join('\n')}

Suggested face assignments:
${coordination.assignments.map((a) => `- [${a.itemId}] → ${a.suggestedOwner}: ${a.rationale}`).join('\n')}

Create a deft implementation plan: 1) highest-leverage next 3–5 items in order, 2) why this sequence given the hexagram, 3) convergence groups to batch, 4) one risk to watch. Format as markdown with ## Do Next, ## Why, ## Convergence, ## Watch Out.`

  let planContent: string
  const sageResp = await callSage(question)
  if (sageResp?.synthesis) {
    planContent = [
      `# Deft Implementation Plan — Hexagram ${hexagramId}: ${hexagram.name}`,
      '',
      `**Cast**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      '## Hexagram Reading',
      '',
      `**${hexagram.name}** — ${hexagram.tone || ''}`,
      sageResp.hexagram ? `\n**Sage interpretation**: ${sageResp.hexagram.interpretation}\n` : '',
      '## Sage Synthesis',
      '',
      sageResp.synthesis,
      '',
      '## Backlog Items (for reference)',
      '',
      ...openItems.map((i) => `- [${i.id}] ${i.name} (${i.category})`),
    ].join('\n')
    console.log('\n✓ Sage consulted')
  } else {
    planContent = synthesizeLocalPlan(hexagramId, hexagram, openItems, coordination)
    console.log('\n✓ Local synthesis (Sage backend not available)')
  }

  const plansDir = join(process.cwd(), '.specify', 'plans')
  if (!existsSync(plansDir)) mkdirSync(plansDir, { recursive: true })

  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `deft-implementation-plan-${dateStr}-hex${hexagramId}.md`
  const filepath = join(plansDir, filename)
  writeFileSync(filepath, planContent)

  console.log(`\n📄 Plan written to ${filepath}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
