/**
 * Superpower coverage report.
 * Spec: .specify/specs/superpower-move-decks/spec.md § FR8 / Phase 3
 *
 * For each superpower, with that superpower in both loadout slots and its pack
 * owned, count how many of the 120 base cards resolve a class move. Expect
 * 120/120. Also demonstrates the unowned citation path.
 *
 * Run: tsx scripts/superpower-coverage.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SUPERPOWERS, type Loadout } from '../src/lib/technique-library/vocabulary'
import { CANONICAL_TECHNIQUES } from '../src/lib/technique-library/canonical'
import { resolveTechniques } from '../src/lib/technique-library/resolve'
import { poolWithSuperpowers, citeSuperpowerMove } from '../src/lib/technique-library/superpowers'
import type { MoveCard, AllyshipCard } from '../src/lib/allyship-deck/types'

const cards = (
  JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json'), 'utf8'),
  ) as { cards: AllyshipCard[] }
).cards.filter((c): c is MoveCard => c.kind === 'move')

console.log(`\nSuperpower coverage over ${cards.length} base cards (pack owned, includeDrafts):\n`)

for (const sp of SUPERPOWERS) {
  const loadout: Loadout = { inner: sp, outer: sp }
  const pool = poolWithSuperpowers(CANONICAL_TECHNIQUES, [sp], { includeDrafts: true })
  let covered = 0
  for (const c of cards) {
    const hit = (['self', 'other'] as const).some((subj) =>
      resolveTechniques(c, loadout, subj, pool).some((r) => r.technique.superpowers.includes(sp)),
    )
    if (hit) covered++
  }
  console.log(`  ${sp.padEnd(14)} ${covered}/${cards.length}`)
}

const sample = cards[0]
if (sample) {
  console.log(
    '\nUnowned citation example:',
    citeSuperpowerMove(sample, { inner: 'connector', outer: 'connector' }, 'other', []),
  )
}
console.log('')
