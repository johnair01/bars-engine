/**
 * Expand the authored party seeds into the runtime interpretation layer.
 *
 *   npx tsx scripts/generate-goodbye-party-interpretations.ts
 *
 * Reads:  public/oracle/deck.json            (canonical card identity)
 *         src/lib/goodbye-party/data/card-seeds.ts   (authored prompts + motifs)
 * Writes: src/lib/goodbye-party/data/interpretations.json
 *
 * Emotional-alchemy and achievement metadata are derived here from
 * suit × lens × depth so the authored file stays prose. The output JSON is
 * committed and may be hand-edited; the live Game Master patch layer
 * (PartyOracleCardOverride) still wins over both at runtime.
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { CARD_SEEDS, type LensSeed } from '../src/lib/goodbye-party/data/card-seeds'
import { DEPTHS, LENSES, type AchievementFamily, type Depth, type Lens } from '../src/lib/goodbye-party/config'

const ROOT = process.cwd()

/**
 * Which authority a completion earns, by suit × lens × depth. All six legal
 * families are in use; nothing here grants power over another person.
 */
const FAMILY_MATRIX: Record<string, Record<Lens, [AchievementFamily, AchievementFamily, AchievementFamily]>> = {
  WU: {
    goodbye: ['invocation', 'interface', 'legacy'],
    spicy: ['invocation', 'challenge', 'challenge'],
  },
  CU: {
    goodbye: ['interface', 'stewardship', 'legacy'],
    spicy: ['interface', 'interface', 'stewardship'],
  },
  GU: {
    goodbye: ['challenge', 'challenge', 'legacy'],
    spicy: ['challenge', 'invocation', 'stewardship'],
  },
  SU: {
    goodbye: ['coordination', 'stewardship', 'legacy'],
    spicy: ['coordination', 'coordination', 'stewardship'],
  },
}

const TITLE_PATTERN: Record<AchievementFamily, (motif: string) => string> = {
  invocation: (m) => `Caller of ${m}`,
  challenge: (m) => `Challenger of ${m}`,
  stewardship: (m) => `Steward of ${m}`,
  coordination: (m) => `Architect of ${m}`,
  interface: (m) => `Envoy of ${m}`,
  legacy: (m) => `Keeper of ${m}`,
}

const DESCRIPTION_PATTERN: Record<AchievementFamily, (motif: string) => string> = {
  invocation: (m) => `You marked ${m} out loud, in front of people, and made it a moment instead of a mood.`,
  challenge: (m) => `You raised the stakes on ${m} yourself, without asking anyone else to carry the risk.`,
  stewardship: (m) => `You took care of ${m} so other people could enjoy it without managing it.`,
  coordination: (m) => `You turned ${m} from an intention into something with a time, a place, and people in it.`,
  interface: (m) => `You made ${m} legible between people who were both being careful about it.`,
  legacy: (m) => `You made ${m} into something that outlasts tonight.`,
}

/**
 * Party-scoped affordances. Each grants permission, credibility, access,
 * resources, or facilitation rights for *initiating* play. None of them
 * manufactures another person's yes, and all of them expire with the party.
 */
const AFFORDANCE_PATTERN: Record<AchievementFamily, string> = {
  invocation:
    'You may call the party to attention once — a toast, a countdown, a minute of quiet — and the room owes you the pause. Anyone may stay out of it.',
  challenge:
    'You may issue one optional challenge to anyone here, on the record. Declining costs nothing and needs no reason.',
  stewardship:
    'You may claim a corner, a stretch of time, or a shared resource of this party to host, and ask others to help you provision it.',
  coordination:
    'You may convene a plan, an expedition, or a side quest tonight and ask people to commit to an actual time.',
  interface:
    'You may broker one ask, boundary, or redirect between two people who both want it made clearer — with both of them in the room.',
  legacy:
    'You may declare one thing from tonight worth keeping and ask the party to help you preserve it.',
}

const ALCHEMY: Record<Lens, Record<Depth, { move: string; targetSatisfaction: string }>> = {
  goodbye: {
    easy: { move: 'state_shift', targetSatisfaction: 'wonder' },
    medium: { move: 'channel_shift', targetSatisfaction: 'poignance' },
    hard: { move: 'upshift', targetSatisfaction: 'triumph' },
  },
  spicy: {
    easy: { move: 'state_shift', targetSatisfaction: 'bliss' },
    medium: { move: 'neutralize_charge', targetSatisfaction: 'bliss' },
    hard: { move: 'upshift', targetSatisfaction: 'triumph' },
  },
}

type DeckCard = { id: string; suit: { code: string } }

function buildReading(cardId: string, suitCode: string, lens: Lens, depth: Depth, seed: LensSeed) {
  const depthIndex = DEPTHS.indexOf(depth)
  const family = FAMILY_MATRIX[suitCode][lens][depthIndex]
  const motif = seed.motif
  return {
    prompt: seed[depth],
    emotionalAlchemy: ALCHEMY[lens][depth],
    achievement: {
      id: `gybr.${cardId.toLowerCase()}.${lens}.${depth}`,
      family,
      title: TITLE_PATTERN[family](motif),
      description: DESCRIPTION_PATTERN[family](motif),
      affordance: AFFORDANCE_PATTERN[family],
    },
    ...(depth === 'hard' ? { hard: { requiresBar: true } } : {}),
  }
}

function main() {
  const deck = JSON.parse(readFileSync(path.join(ROOT, 'public', 'oracle', 'deck.json'), 'utf8'))
  const cards: DeckCard[] = deck.cards
  const out: Record<string, unknown> = {}
  const missing: string[] = []

  for (const card of cards) {
    const seed = CARD_SEEDS[card.id]
    if (!seed) {
      missing.push(card.id)
      continue
    }
    if (!FAMILY_MATRIX[card.suit.code]) {
      throw new Error(`No achievement-family mapping for suit ${card.suit.code} (card ${card.id})`)
    }
    const entry: Record<string, unknown> = {}
    for (const lens of LENSES) {
      const byDepth: Record<string, unknown> = {}
      for (const depth of DEPTHS) {
        byDepth[depth] = buildReading(card.id, card.suit.code, lens, depth, seed[lens])
      }
      entry[lens] = byDepth
    }
    out[card.id] = entry
  }

  if (missing.length) {
    throw new Error(`Missing party seeds for ${missing.length} cards: ${missing.join(', ')}`)
  }

  const target = path.join(ROOT, 'src', 'lib', 'goodbye-party', 'data', 'interpretations.json')
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${Object.keys(out).length} card interpretations to ${path.relative(ROOT, target)}`)
}

main()
