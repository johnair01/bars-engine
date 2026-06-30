/**
 * Card → Technique resolution — the deterministic linchpin.
 * Spec: .specify/specs/allyship-technique-vocabulary/spec.md § Resolution rule
 *
 * Pure function. No AI, no DB, no side effects. Identical inputs -> identical
 * outputs (dual-track: works with or without language models).
 */

import type { MoveCard, Subject } from '@/lib/allyship-deck/types'
import type { Technique, ResolvedTechnique, TechniqueTier } from './types'
import type { MoveAspect } from './vocabulary'
import { channelsForCapabilities, UNIVERSAL_SUPERPOWER, type Loadout } from './vocabulary'

/** The subset of a card the resolver needs. */
export type ResolvableCard = Pick<MoveCard, 'move' | 'operation' | 'domain' | 'capabilities'>

/** canonical first, then community, then personal. */
const TIER_ORDER: Record<TechniqueTier, number> = { canonical: 0, community: 1, personal: 2 }

/** Map the reading subject to the active inner/outer aspect. */
export function aspectForSubject(subject: Subject): MoveAspect {
  return subject === 'self' ? 'inner' : 'outer'
}

interface Match {
  resolved: ResolvedTechnique
}

function matchTechnique(
  card: ResolvableCard,
  technique: Technique,
  activeAspect: MoveAspect,
  activeSlotSuperpower: Loadout[keyof Loadout],
): Match | null {
  // 1. move
  if (technique.moves.length > 0 && !technique.moves.includes(card.move)) return null
  // 2. operation (altitude)
  if (technique.operations.length > 0 && !technique.operations.includes(card.operation)) return null
  // 3. domain
  if (technique.domains.length > 0 && !technique.domains.includes(card.domain)) return null
  // 4. channel (via the card's latent capabilities)
  const cardChannels = channelsForCapabilities(card.capabilities)
  if (technique.channels.length > 0 && !technique.channels.some((c) => cardChannels.includes(c))) {
    return null
  }
  // 5. aspect / subject
  if (technique.aspect !== 'both' && technique.aspect !== activeAspect) return null
  // 6. superpower / loadout — determine eligibility + which lens surfaced it
  let viaSlot: ResolvedTechnique['viaSlot']
  if (technique.superpowers.length === 0) {
    viaSlot = activeAspect // available to any loadout — counts as the active slot
  } else if (technique.superpowers.includes(activeSlotSuperpower)) {
    viaSlot = activeAspect
  } else if (technique.superpowers.includes(UNIVERSAL_SUPERPOWER)) {
    viaSlot = 'substrate' // matched only via the Alchemy floor
  } else {
    return null
  }

  // specificity: +1 for each axis the technique actually constrained (and matched)
  let score = 0
  if (technique.moves.length > 0) score++
  if (technique.operations.length > 0) score++
  if (technique.domains.length > 0) score++
  if (technique.channels.length > 0) score++
  if (technique.capabilities && technique.capabilities.length > 0) {
    if (technique.capabilities.some((c) => card.capabilities.includes(c))) score++
  }
  if (technique.superpowers.length > 0) score++
  if (technique.aspect !== 'both') score++

  return { resolved: { technique, score, viaSlot } }
}

/**
 * Given a drawn card, the player's loadout, and the subject it's read in,
 * return the techniques that apply — ranked by specificity, then tier.
 *
 * @param limit optional cap on returned techniques (after ranking).
 */
export function resolveTechniques(
  card: ResolvableCard,
  loadout: Loadout,
  subject: Subject,
  pool: readonly Technique[],
  limit?: number,
): ResolvedTechnique[] {
  const activeAspect = aspectForSubject(subject)
  const activeSlotSuperpower = loadout[activeAspect]

  const matches: ResolvedTechnique[] = []
  for (const technique of pool) {
    const m = matchTechnique(card, technique, activeAspect, activeSlotSuperpower)
    if (m) matches.push(m.resolved)
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return TIER_ORDER[a.technique.tier] - TIER_ORDER[b.technique.tier]
  })

  return typeof limit === 'number' ? matches.slice(0, limit) : matches
}
