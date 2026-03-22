/**
 * Playbook (second axis) for the scene grid — **playbook = Prisma `Archetype` row** in player-facing copy.
 *
 * **Not** Prisma `Polarity` (`NationMove.polarityId` / move-taxonomy rows). Grid “poles” are `GridAxisPair` in
 * `polarities.ts` to avoid that collision.
 *
 * Resolution: map the `Archetype` row → `ArchetypeInfluenceProfile` (`ARCHETYPE_PROFILES`) → trigram →
 * `TRIGRAM_RELATIONAL_PAIR2`. That keeps the deck aligned with the archetype overlay, not a parallel naming scheme.
 *
 * Pair1 stays nation element (`ELEMENT_AXIS` in polarities.ts).
 */

import { getArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay'
import { ARCHETYPE_PROFILES } from '@/lib/archetype-influence-overlay/profiles'
import type { ArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay/types'

/** Second axis: tensions aligned with each profile’s agency_pattern (short UI labels). */
/** Scene Atlas pair2 — short labels intended as interdependent goods (polarity-map friendly). */
export const TRIGRAM_RELATIONAL_PAIR2 = {
  Heaven: { a: 'Spark', b: 'Restraint' },
  Earth: { a: 'Nurture', b: 'Self-nurture' },
  Thunder: { a: 'Breakthrough', b: 'Timing' },
  Wind: { a: 'Subtle', b: 'Direct' },
  Water: { a: 'Venture', b: 'Anchor' },
  Fire: { a: 'Clarify', b: 'Tact' },
  Mountain: { a: 'Pause', b: 'Proceed' },
  Lake: { a: 'Widen', b: 'Deepen' },
} as const

export type TrigramKey = keyof typeof TRIGRAM_RELATIONAL_PAIR2

const TRIGRAM_FROM_CODE: Record<string, TrigramKey> = {
  qian: 'Heaven',
  kun: 'Earth',
  zhen: 'Thunder',
  xun: 'Wind',
  kan: 'Water',
  li: 'Fire',
  gen: 'Mountain',
  dui: 'Lake',
}

/** Low-level parse only — prefer `resolvePlaybookProfileFromArchetypeRow` for production paths. */
export function parseTrigramKeyFromArchetypeName(name: string): TrigramKey | null {
  const trimmed = name.trim()
  const paren = trimmed.match(/\(([^)]+)\)\s*$/)
  if (paren) {
    const code = paren[1].trim().toLowerCase()
    const fromCode = TRIGRAM_FROM_CODE[code]
    if (fromCode) return fromCode
  }

  const firstWord = trimmed.split(/[\s(]/)[0] as TrigramKey
  if (firstWord && firstWord in TRIGRAM_RELATIONAL_PAIR2) {
    return firstWord
  }

  return null
}

export function getPair2FromTrigram(trigram: TrigramKey): { a: string; b: string } {
  return TRIGRAM_RELATIONAL_PAIR2[trigram]
}

/**
 * Single source: DB archetype row → influence profile (Bold Heart, Danger Walker, …).
 */
export function resolvePlaybookProfileFromArchetypeRow(archetype: {
  name: string
  description: string | null
}): ArchetypeInfluenceProfile | undefined {
  const fromTrigram = parseTrigramKeyFromArchetypeName(archetype.name)
  if (fromTrigram) {
    const p = ARCHETYPE_PROFILES.find(
      (x) => x.trigram.toLowerCase() === String(fromTrigram).toLowerCase()
    )
    if (p) return p
  }

  const desc = archetype.description?.trim() ?? ''
  if (desc) {
    const head = desc.split('.')[0]?.trim() ?? ''
    if (head) {
      const byHead = getArchetypeInfluenceProfile(head)
      if (byHead) return byHead
    }
    const byDesc = getArchetypeInfluenceProfile(desc)
    if (byDesc) return byDesc
  }

  return undefined
}

/** Pair2 labels from canonical profile (trigram must exist in TRIGRAM_RELATIONAL_PAIR2). */
export function getGridPair2FromPlaybookProfile(profile: ArchetypeInfluenceProfile): {
  a: string
  b: string
} {
  const key = profile.trigram as TrigramKey
  if (key in TRIGRAM_RELATIONAL_PAIR2) {
    return getPair2FromTrigram(key)
  }
  return { a: 'Seeing', b: 'Choosing' }
}
