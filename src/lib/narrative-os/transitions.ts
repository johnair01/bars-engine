/**
 * Deterministic narrative spine: Library → Dojo → Forest → Forge → Library.
 * Phase 3: single source for recommendations + POST /api/world/map/transition mock.
 */

import { NARRATIVE_SPACE_SECTIONS } from './baseline-map'
import type { MapTransitionResponse, SpaceId, WorldMapTransition } from './types'

function spaceTitle(id: SpaceId): string {
  const s = NARRATIVE_SPACE_SECTIONS.find((x) => x.id === id)
  return s?.title ?? id
}

/** Four forward edges of the baseline playable loop. */
const LOOP_FORWARD: WorldMapTransition[] = [
  {
    from: 'library',
    to: 'dojo',
    reason: 'Convert insight into practice.',
    narrativeHint: 'You’ve read enough to try a move.',
  },
  {
    from: 'dojo',
    to: 'forest',
    reason: 'Deploy skill in live play.',
    narrativeHint: 'Step into an adventure or the campaign field.',
  },
  {
    from: 'forest',
    to: 'forge',
    reason: 'Process consequence and charge.',
    narrativeHint: 'Name what landed; metabolize in Forge.',
  },
  {
    from: 'forge',
    to: 'library',
    reason: 'Crystallize meaning into records.',
    narrativeHint: 'Write the BAR; feed the Library.',
  },
]

/** One-line hints for GET /api/world/map (global list). */
export const BASELINE_LOOP_HINTS: string[] = [
  'Library → Dojo: turn insight into practice.',
  'Dojo → Forest: take a practiced move into live play.',
  'Forest → Forge: metabolize outcomes and charge.',
  'Forge → Library: crystallize what you learned into lore or BARs.',
]

export function getDefaultRecommendedTransitions(): WorldMapTransition[] {
  return LOOP_FORWARD.map((t) => ({ ...t }))
}

type LoopEdge = {
  from: SpaceId
  to: SpaceId
  mechanicalReason: string
  narrativeCopy: string
}

const LOOP_EDGES: LoopEdge[] = [
  {
    from: 'library',
    to: 'dojo',
    mechanicalReason: LOOP_FORWARD[0].reason,
    narrativeCopy:
      'The Library thins; the Dojo thickens. Carry one insight as a move you can rehearse.',
  },
  {
    from: 'dojo',
    to: 'forest',
    mechanicalReason: LOOP_FORWARD[1].reason,
    narrativeCopy:
      'Practice ends at the treeline. The Forest asks for stakes — an adventure, a board, a room.',
  },
  {
    from: 'forest',
    to: 'forge',
    mechanicalReason: LOOP_FORWARD[2].reason,
    narrativeCopy:
      'What happened in the Forest leaves a charge. The Forge names it and metabolizes it.',
  },
  {
    from: 'forge',
    to: 'library',
    mechanicalReason: LOOP_FORWARD[3].reason,
    narrativeCopy:
      'Integration wants witnesses. Return to the Library to inscribe what formed.',
  },
]

function targetHref(to: SpaceId): string {
  return `/narrative/${to}`
}

function gameMapHash(to: SpaceId): `space-${SpaceId}` {
  return `space-${to}`
}

/**
 * Mock resolver for POST /api/world/map/transition — no persistence.
 * - Same space: stay
 * - Forward edge in loop: canonical narrative
 * - Reverse edge: return variant
 * - Otherwise: not part of v0 spine
 */
export function resolveMapTransition(from: SpaceId, to: SpaceId): MapTransitionResponse {
  const token = `mock-${from}-${to}`

  if (from === to) {
    return {
      ok: true,
      fromSpace: from,
      toSpace: to,
      targetHref: targetHref(to),
      gameMapHash: gameMapHash(to),
      narrativeCopy: `You stay in the ${spaceTitle(to)} — depth before distance.`,
      mechanicalReason: 'Same-space transition (linger / integrate in place).',
      transitionToken: token,
      variant: 'stay',
    }
  }

  const forward = LOOP_EDGES.find((e) => e.from === from && e.to === to)
  if (forward) {
    return {
      ok: true,
      fromSpace: from,
      toSpace: to,
      targetHref: targetHref(to),
      gameMapHash: gameMapHash(to),
      narrativeCopy: forward.narrativeCopy,
      mechanicalReason: forward.mechanicalReason,
      transitionToken: token,
      variant: 'forward',
    }
  }

  const back = LOOP_EDGES.find((e) => e.from === to && e.to === from)
  if (back) {
    return {
      ok: true,
      fromSpace: from,
      toSpace: to,
      targetHref: targetHref(to),
      gameMapHash: gameMapHash(to),
      narrativeCopy: `You step back toward the ${spaceTitle(to)} — retracing the spine is allowed.`,
      mechanicalReason: `Return leg (inverse of ${back.from} → ${back.to}).`,
      transitionToken: token,
      variant: 'return',
    }
  }

  return {
    ok: false,
    error:
      'No direct edge on the v0 narrative spine between these spaces. Follow Library → Dojo → Forest → Forge → Library, or use space homes from the game map.',
    fromSpace: from,
    toSpace: to,
    targetHref: targetHref(to),
    gameMapHash: gameMapHash(to),
    narrativeCopy: '',
    mechanicalReason: '',
    transitionToken: token,
    variant: 'invalid',
  }
}
