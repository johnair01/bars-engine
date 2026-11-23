/**
 * Emotional Alchemy Move Engine
 *
 * 15 canonical moves: 5 Transcend, 5 Generative translate, 5 Control translate.
 *
 * NO ENERGY COSTS. Wendell, 2026-11-20: "we need to deprecate these energy costs. They aren't
 * grounded in anything and are confusing. The path is the player's choice as made manifest by
 * what energy is coming up for them."
 *
 * The +2 / +1 / −1 figures that used to sit on every move were removed rather than kept "in case
 * something reads them": nothing in the compiler ever did, and a number that looks load-bearing
 * but is not is how a design quietly becomes a rule. What distinguishes the paths is the SHAPE
 * and LENGTH of the route, not a price:
 *
 *   Transcend  — ONE move. It only ever lifts you one satisfaction stage, inside the channel you
 *                are already in. It can never cross to another channel.
 *   Generative — AS MANY steps along the shēng cycle as the distance requires. The count is not
 *                fixed: it is however many generating steps separate where you are from the
 *                target's satisfied state.
 *   Control    — ONE step along the kè cycle. It lands you in another channel (not that channel's
 *                satisfied state), which is why a control can be followed by a transcend.
 *   Master     — two generative steps and a control, forming a triangle (new, 2026-11-20). The
 *                "two" there is the shape of the triangle, not a general rule for generating.
 *
 * Wendell's worked example (2026-11-20). From dissatisfied Neutrality to satisfied Anger, by the
 * shēng cycle, is FOUR generating steps:
 *
 *     neutrality → fear (metal) → sadness (water) → joy (wood) → anger (fire)
 *
 * Or, the shorter road: one control move (kè sends neutrality to sadness) and then one transcend,
 * two moves. The two routes do not end in the same room, and that is the point — the path is the
 * choice, made manifest by what energy is actually up.
 *
 * The game teaches the player to read their own energy and then offers grammatical ways to
 * express it toward the world's goal or their own. Nothing here scores the expression.
 *
 * See: .agent/context/emotional-alchemy-ontology.md
 */

import type { ElementKey } from './elements'
import type { MoveFamily, PersonalMoveType } from './types'

export interface CanonicalMove {
  id: string
  name: string
  category: 'Transcend' | 'Generative' | 'Control'
  element?: ElementKey
  fromElement?: ElementKey
  toElement?: ElementKey
  primaryWaveStage?: PersonalMoveType
  narrative: string
}

/** 5 Transcend moves (vertical completion, inside one element). */
export const TRANSCEND_MOVES: CanonicalMove[] = [
  { id: 'metal_transcend', name: 'Step Through (Wonder-Excitement)', category: 'Transcend', element: 'metal', primaryWaveStage: 'showUp', narrative: 'Fear → opportunity' },
  { id: 'water_transcend', name: 'Reclaim Meaning', category: 'Transcend', element: 'water', primaryWaveStage: 'cleanUp', narrative: 'Sadness → value restored' },
  { id: 'wood_transcend', name: 'Commit to Growth', category: 'Transcend', element: 'wood', primaryWaveStage: 'growUp', narrative: 'Joy → sustained vitality' },
  { id: 'fire_transcend', name: 'Achieve Breakthrough (Triumph)', category: 'Transcend', element: 'fire', primaryWaveStage: 'showUp', narrative: 'Anger → boundary honored' },
  { id: 'earth_transcend', name: 'Stabilize Coherence', category: 'Transcend', element: 'earth', primaryWaveStage: 'cleanUp', narrative: 'Neutrality → system clarity' },
]

/** 5 Generative translate moves (one step of the shēng cycle). */
export const GENERATIVE_MOVES: CanonicalMove[] = [
  { id: 'wood_fire', name: 'Declare Intention', category: 'Generative', fromElement: 'wood', toElement: 'fire', primaryWaveStage: 'showUp', narrative: 'Momentum into action' },
  { id: 'fire_earth', name: 'Integrate Gains', category: 'Generative', fromElement: 'fire', toElement: 'earth', primaryWaveStage: 'growUp', narrative: 'Action into structure' },
  { id: 'earth_metal', name: 'Reveal Stakes', category: 'Generative', fromElement: 'earth', toElement: 'metal', primaryWaveStage: 'wakeUp', narrative: 'Structure into clarity' },
  { id: 'metal_water', name: 'Deepen Value', category: 'Generative', fromElement: 'metal', toElement: 'water', primaryWaveStage: 'growUp', narrative: 'Clarity into meaning' },
  { id: 'water_wood', name: 'Renew Vitality', category: 'Generative', fromElement: 'water', toElement: 'wood', primaryWaveStage: 'wakeUp', narrative: 'Meaning into vitality' },
]

/** 5 Control translate moves (one step of the kè cycle, precision). */
export const CONTROL_MOVES: CanonicalMove[] = [
  { id: 'wood_earth', name: 'Consolidate Energy', category: 'Control', fromElement: 'wood', toElement: 'earth', primaryWaveStage: 'cleanUp', narrative: 'Ground enthusiasm; prevent overextension' },
  { id: 'fire_metal', name: 'Temper Action', category: 'Control', fromElement: 'fire', toElement: 'metal', primaryWaveStage: 'cleanUp', narrative: 'Reassess risk after bold action' },
  { id: 'earth_water', name: 'Reopen Sensitivity', category: 'Control', fromElement: 'earth', toElement: 'water', primaryWaveStage: 'cleanUp', narrative: 'Soften rigid structure; reconnect meaning' },
  { id: 'metal_wood', name: 'Activate Hope', category: 'Control', fromElement: 'metal', toElement: 'wood', primaryWaveStage: 'wakeUp', narrative: 'Convert fear into forward momentum' },
  { id: 'water_fire', name: 'Mobilize Grief', category: 'Control', fromElement: 'water', toElement: 'fire', primaryWaveStage: 'cleanUp', narrative: 'Turn sadness into boundary-setting' },
]

export const ALL_CANONICAL_MOVES: CanonicalMove[] = [
  ...TRANSCEND_MOVES,
  ...GENERATIVE_MOVES,
  ...CONTROL_MOVES,
]

export function getMoveById(id: string): CanonicalMove | undefined {
  return ALL_CANONICAL_MOVES.find((m) => m.id === id)
}

/**
 * @deprecated Wendell, 2026-11-20 — the energy costs are deprecated: "They aren't grounded in
 * anything and are confusing." The path is the player's choice, made manifest by what energy is
 * coming up for them. Nothing in this engine scores a move. Kept only because it is exported from
 * the package index; it returns nothing and nothing calls it. Delete it with the next breaking
 * change to this module rather than reviving the numbers.
 */
export function getEnergyDelta(_category: 'Transcend' | 'Generative' | 'Control'): undefined {
  return undefined
}

/** Return Transcend if same-element (altitude within channel); Translate if fromElement→toElement (channel-to-channel). */
export function getMoveFamily(move: CanonicalMove): MoveFamily {
  if (move.element != null && move.fromElement == null && move.toElement == null) {
    return 'Transcend'
  }
  if (move.fromElement != null && move.toElement != null) {
    return 'Translate'
  }
  return 'Transcend'
}
