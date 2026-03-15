/**
 * Emotional Alchemy Move Engine
 *
 * 15 canonical moves: 5 Transcend, 5 Generative translate, 5 Control translate.
 * Energy economy: Transcend +2, Generative +1, Control -1.
 * Control moves are high-cost precision moves, NOT negative.
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
  energyDelta: number
  narrative: string
}

/** 5 Transcend moves (vertical completion) — Energy +2 */
export const TRANSCEND_MOVES: CanonicalMove[] = [
  { id: 'metal_transcend', name: 'Step Through (Excitement)', category: 'Transcend', element: 'metal', primaryWaveStage: 'showUp', energyDelta: 2, narrative: 'Fear → opportunity' },
  { id: 'water_transcend', name: 'Reclaim Meaning', category: 'Transcend', element: 'water', primaryWaveStage: 'cleanUp', energyDelta: 2, narrative: 'Sadness → value restored' },
  { id: 'wood_transcend', name: 'Commit to Growth', category: 'Transcend', element: 'wood', primaryWaveStage: 'growUp', energyDelta: 2, narrative: 'Joy → sustained vitality' },
  { id: 'fire_transcend', name: 'Achieve Breakthrough (Triumph)', category: 'Transcend', element: 'fire', primaryWaveStage: 'showUp', energyDelta: 2, narrative: 'Anger → boundary honored' },
  { id: 'earth_transcend', name: 'Stabilize Coherence', category: 'Transcend', element: 'earth', primaryWaveStage: 'cleanUp', energyDelta: 2, narrative: 'Neutrality → system clarity' },
]

/** 5 Generative translate moves (flow cycle) — Energy +1 */
export const GENERATIVE_MOVES: CanonicalMove[] = [
  { id: 'wood_fire', name: 'Declare Intention', category: 'Generative', fromElement: 'wood', toElement: 'fire', primaryWaveStage: 'showUp', energyDelta: 1, narrative: 'Momentum into action' },
  { id: 'fire_earth', name: 'Integrate Gains', category: 'Generative', fromElement: 'fire', toElement: 'earth', primaryWaveStage: 'growUp', energyDelta: 1, narrative: 'Action into structure' },
  { id: 'earth_metal', name: 'Reveal Stakes', category: 'Generative', fromElement: 'earth', toElement: 'metal', primaryWaveStage: 'wakeUp', energyDelta: 1, narrative: 'Structure into clarity' },
  { id: 'metal_water', name: 'Deepen Value', category: 'Generative', fromElement: 'metal', toElement: 'water', primaryWaveStage: 'growUp', energyDelta: 1, narrative: 'Clarity into meaning' },
  { id: 'water_wood', name: 'Renew Vitality', category: 'Generative', fromElement: 'water', toElement: 'wood', primaryWaveStage: 'wakeUp', energyDelta: 1, narrative: 'Meaning into vitality' },
]

/** 5 Control translate moves (high-cost precision) — Energy -1 */
export const CONTROL_MOVES: CanonicalMove[] = [
  { id: 'wood_earth', name: 'Consolidate Energy', category: 'Control', fromElement: 'wood', toElement: 'earth', primaryWaveStage: 'cleanUp', energyDelta: -1, narrative: 'Ground enthusiasm; prevent overextension' },
  { id: 'fire_metal', name: 'Temper Action', category: 'Control', fromElement: 'fire', toElement: 'metal', primaryWaveStage: 'cleanUp', energyDelta: -1, narrative: 'Reassess risk after bold action' },
  { id: 'earth_water', name: 'Reopen Sensitivity', category: 'Control', fromElement: 'earth', toElement: 'water', primaryWaveStage: 'cleanUp', energyDelta: -1, narrative: 'Soften rigid structure; reconnect meaning' },
  { id: 'metal_wood', name: 'Activate Hope', category: 'Control', fromElement: 'metal', toElement: 'wood', primaryWaveStage: 'wakeUp', energyDelta: -1, narrative: 'Convert fear into forward momentum' },
  { id: 'water_fire', name: 'Mobilize Grief', category: 'Control', fromElement: 'water', toElement: 'fire', primaryWaveStage: 'cleanUp', energyDelta: -1, narrative: 'Turn sadness into boundary-setting' },
]

export const ALL_CANONICAL_MOVES: CanonicalMove[] = [
  ...TRANSCEND_MOVES,
  ...GENERATIVE_MOVES,
  ...CONTROL_MOVES,
]

export function getMoveById(id: string): CanonicalMove | undefined {
  return ALL_CANONICAL_MOVES.find((m) => m.id === id)
}

export function getEnergyDelta(category: 'Transcend' | 'Generative' | 'Control'): number {
  switch (category) {
    case 'Transcend': return 2
    case 'Generative': return 1
    case 'Control': return -1
  }
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
