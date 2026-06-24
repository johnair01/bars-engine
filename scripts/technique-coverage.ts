/**
 * Technique coverage report.
 * Spec: .specify/specs/allyship-technique-vocabulary/spec.md § FR6
 *
 * For each of the 120 deck cards, count how many canonical techniques resolve
 * onto it (union of the self/other readings). Surfaces the gaps — cells with no
 * named book practice yet — to guide future authoring.
 *
 * Run: tsx scripts/technique-coverage.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { resolveTechniques, type ResolvableCard } from '../src/lib/technique-library/resolve'
import { CANONICAL_TECHNIQUES } from '../src/lib/technique-library/canonical'
import type { Loadout } from '../src/lib/technique-library/vocabulary'
import type { MoveCard, AllyshipCard } from '../src/lib/allyship-deck/types'

const DECK_PATH = join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json')

// Canonical techniques are all the Alchemy substrate, so loadout is immaterial here.
const LOADOUT: Loadout = { inner: 'alchemist', outer: 'alchemist' }

function loadMoveCards(): MoveCard[] {
  const raw = JSON.parse(readFileSync(DECK_PATH, 'utf8')) as { cards: AllyshipCard[] }
  return raw.cards.filter((c): c is MoveCard => c.kind === 'move')
}

function coverageFor(card: ResolvableCard): number {
  const ids = new Set<string>()
  for (const subject of ['self', 'other'] as const) {
    for (const r of resolveTechniques(card, LOADOUT, subject, CANONICAL_TECHNIQUES)) {
      ids.add(r.technique.id)
    }
  }
  return ids.size
}

function main(): void {
  const cards = loadMoveCards()
  const rows = cards.map((c) => ({ id: c.id, move: c.move, count: coverageFor(c) }))

  const withCoverage = rows.filter((r) => r.count > 0)
  const zero = rows.filter((r) => r.count === 0)

  const byMove = new Map<string, { total: number; covered: number }>()
  for (const r of rows) {
    const m = byMove.get(r.move) ?? { total: 0, covered: 0 }
    m.total++
    if (r.count > 0) m.covered++
    byMove.set(r.move, m)
  }

  console.log(`\nTechnique coverage over ${cards.length} move cards`)
  console.log(`  canonical techniques in pool: ${CANONICAL_TECHNIQUES.length}`)
  console.log(`  cards with >=1 technique: ${withCoverage.length}/${cards.length}\n`)

  console.log('By move:')
  for (const [move, { total, covered }] of byMove) {
    const pct = Math.round((covered / total) * 100)
    console.log(`  ${move.padEnd(10)} ${covered}/${total} (${pct}%)`)
  }

  if (zero.length > 0) {
    console.log(`\nZero-coverage cards (${zero.length}) — gaps to author next:`)
    for (const r of zero) console.log(`  ${r.id}`)
  } else {
    console.log('\nNo zero-coverage cards.')
  }
  console.log('')
}

main()
