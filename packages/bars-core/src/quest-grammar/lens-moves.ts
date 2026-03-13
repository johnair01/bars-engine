/**
 * Developmental Lens → Canonical Moves Mapping
 *
 * Each of the 6 Faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage) has
 * moves available that align with that lens's flavor. Used for choice privileging
 * when developmentalLens is set.
 *
 * See: .agent/context/emotional-alchemy-interfaces.md
 */

import type { CanonicalMove } from './move-engine'
import { ALL_CANONICAL_MOVES } from './move-engine'

export type LensKey = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'

/** Move IDs emphasized per lens (from emotional-alchemy-interfaces) */
const LENS_TO_MOVE_IDS: Record<LensKey, string[]> = {
  shaman: [
    'water_wood',   // Renew Vitality — attuning to the field
    'metal_wood',   // Activate Hope — convert fear into momentum
    'earth_water',  // Reopen Sensitivity — reconnect meaning
  ],
  challenger: [
    'fire_transcend',  // Achieve Breakthrough — power, obstacles
    'wood_fire',       // Declare Intention — momentum into action
    'water_fire',      // Mobilize Grief — turn sadness into boundary-setting
  ],
  regent: [
    'earth_transcend',  // Stabilize Coherence — structure, order
    'fire_earth',      // Integrate Gains — action into structure
    'wood_earth',      // Consolidate Energy — ground enthusiasm
  ],
  architect: [
    'earth_metal',   // Reveal Stakes — structure into clarity
    'metal_water',   // Deepen Value — clarity into meaning
    'fire_earth',    // Integrate Gains — systematic
  ],
  diplomat: [
    'water_transcend',  // Reclaim Meaning — care, value
    'metal_water',      // Deepen Value — meaning, relational
    'earth_water',      // Reopen Sensitivity — perspectives, care
  ],
  sage: [
    'earth_transcend',  // Stabilize Coherence — whole-system
    'wood_transcend',   // Commit to Growth — integration (id from move-engine)
    'water_wood',      // Renew Vitality — sustainable systems
  ],
}

/**
 * Get canonical moves for a developmental lens.
 * Returns the subset of 15 canonical moves emphasized by that lens.
 */
export function getMovesForLens(lens: string): CanonicalMove[] {
  const key = lens.toLowerCase() as LensKey
  const ids = LENS_TO_MOVE_IDS[key]
  if (!ids) return []
  return ids
    .map((id) => ALL_CANONICAL_MOVES.find((m) => m.id === id))
    .filter((m): m is CanonicalMove => m != null)
}
