/**
 * Assemble each superpower expansion deck to its own static artifact.
 * Spec: .specify/specs/superpower-move-decks/spec.md § FR7
 *
 * Mirrors scripts/assemble-allyship-deck.ts. Writes public/superpower-decks/<sp>.json
 * — one independently shippable/printable 60-card pack per superpower.
 *
 * Run: tsx scripts/assemble-superpower-decks.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { SUPERPOWERS } from '../src/lib/technique-library/vocabulary'
import { superpowerDeck, SUPERPOWER_PROFILES } from '../src/lib/technique-library/superpowers'

const OUT = join(process.cwd(), 'public', 'superpower-decks')
mkdirSync(OUT, { recursive: true })

for (const sp of SUPERPOWERS) {
  const cards = superpowerDeck(sp)
  const profile = SUPERPOWER_PROFILES[sp]
  const pack = {
    deck_slug: `superpower-${sp}`,
    superpower: sp,
    label: profile.label,
    gift: profile.gift,
    version: '0.1.0-draft',
    generatedAt: new Date().toISOString(),
    count: cards.length,
    cards,
  }
  writeFileSync(join(OUT, `${sp}.json`), `${JSON.stringify(pack, null, 2)}\n`)
  console.log(`wrote ${sp}.json (${cards.length} cards)`)
}
