/**
 * Superpower quality report — score a loadout's decks against the live campaign.
 * Spec: .specify/specs/superpower-deck-quality/spec.md § FR5
 *
 * Run: tsx scripts/superpower-quality-report.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { MoveCard, AllyshipCard } from '../src/lib/allyship-deck/types'
import { MOVE_VALUES, OPERATION_VALUES, type Loadout } from '../src/lib/technique-library/vocabulary'
import { CAMPAIGNS } from '../src/lib/technique-library/campaigns'
import {
  scoreLoadoutOverCampaign,
  type CellScore,
} from '../src/lib/technique-library/superpowers/quality-harness'

const baseCards = (
  JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json'), 'utf8'),
  ) as { cards: AllyshipCard[] }
).cards.filter((c): c is MoveCard => c.kind === 'move')

const loadout: Loadout = { inner: 'escape_artist', outer: 'connector' }

const score = scoreLoadoutOverCampaign(loadout, baseCards)

console.log(`\nLoadout: inner=${loadout.inner}  outer=${loadout.outer}`)
console.log('Cards are CAMPAIGN-AGNOSTIC — quality is intrinsic. Same scores apply to every campaign below.\n')
for (const campaign of CAMPAIGNS) {
  console.log(`Campaign lens: ${campaign.goal}`)
  for (const [domain, framing] of Object.entries(campaign.domainFraming)) {
    console.log(`    ${domain.padEnd(20)} ${framing}`)
  }
}

console.log(`\nSurfaced cards: ${score.distinct.length} distinct (across ${score.baseCells} base cells)`)
console.log('Level distribution:')
for (const lvl of [4, 3, 2, 1, 0]) console.log(`  L${lvl}: ${score.byLevel[lvl] ?? 0}`)
console.log(`Below L3 (not usable): ${score.belowL3}/${score.distinct.length}`)
console.log(`Campaign-ready base cells (both slots ≥ L3): ${score.campaignReadyCells}/${score.baseCells}`)

function grid(aspect: 'inner' | 'outer'): void {
  const sp = aspect === 'inner' ? loadout.inner : loadout.outer
  const byCoord = new Map(score.distinct.filter((c) => c.aspect === aspect).map((c) => [`${c.move}|${c.operation}`, c]))
  console.log(`\n${aspect.toUpperCase()} slot — ${sp} (level by face × move):`)
  const header = ['face \\ move', ...MOVE_VALUES].map((s) => s.padEnd(10)).join('')
  console.log('  ' + header)
  for (const op of OPERATION_VALUES) {
    const row = MOVE_VALUES.map((m) => {
      const cell: CellScore | undefined = byCoord.get(`${m}|${op}`)
      return `L${cell?.level ?? '-'}`.padEnd(10)
    })
    console.log('  ' + op.padEnd(11) + row.join(''))
  }
}
grid('inner')
grid('outer')

const punch = score.distinct.filter((c) => c.level < 3).map((c) => c.cardId)
console.log(`\nPunch-list (< L3): ${punch.length} cards. First 10:`)
for (const id of punch.slice(0, 10)) console.log(`  ${id}`)
console.log('')
