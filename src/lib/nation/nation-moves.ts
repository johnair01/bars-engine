/**
 * Canonical Nation Moves — 20 indigenous moves (4 per nation × 5 nations).
 *
 * Each nation has exactly one move per WAVE stage:
 *   Wake Up → Clean Up → Grow Up → Show Up
 *
 * These are the "indigenous" ways each nation metabolizes emotional charge.
 * They correspond to the nation's wakeUp/cleanUp/growUp/showUp fields on the Nation model,
 * but as first-class NationMove rows they can be equipped, tracked, and used in quest mechanics.
 *
 * Source of truth for canonical nation move identity. Used by:
 * - scripts/seed-canonical-nation-moves.ts (standalone idempotent seed)
 * - launchNurseryRitual() (ritual CYOA routing)
 * - Nation move panels in campaign UI
 */

import type { WuxingElement } from './nations'

export type WaveStage = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

export const WAVE_STAGES: readonly WaveStage[] = [
  'wakeUp',
  'cleanUp',
  'growUp',
  'showUp',
] as const

export interface CanonicalNationMoveDefinition {
  /** Immutable key: nation-element_wave-stage (e.g., "metal_wake-up") */
  readonly key: string
  /** Nation name (for lookup) */
  readonly nationName: string
  /** Wuxing element channel */
  readonly channel: WuxingElement
  /** WAVE stage */
  readonly waveStage: WaveStage
  /** Display name (e.g., "Mirror Meditation") */
  readonly name: string
  /** Full description */
  readonly description: string
  /** Sort order within nation (0-3) */
  readonly sortOrder: number
}

/**
 * 20 Canonical Nation Moves.
 * Ordered: nations in Wuxing shēng cycle, moves in WAVE order within each.
 */
export const CANONICAL_NATION_MOVES: readonly CanonicalNationMoveDefinition[] = [
  // ── Argyra (Metal / Fear) ──────────────────────────────────────────────
  {
    key: 'metal_wake-up',
    nationName: 'Argyra',
    channel: 'metal',
    waveStage: 'wakeUp',
    name: 'Mirror Meditation',
    description: 'See yourself clearly by examining your reflections in others. Fear becomes a lens for insight.',
    sortOrder: 0,
  },
  {
    key: 'metal_clean-up',
    nationName: 'Argyra',
    channel: 'metal',
    waveStage: 'cleanUp',
    name: 'Silver Purge',
    description: 'Dissolve illusions and false beliefs through logical analysis. Strip away what distorts your vision.',
    sortOrder: 1,
  },
  {
    key: 'metal_grow-up',
    nationName: 'Argyra',
    channel: 'metal',
    waveStage: 'growUp',
    name: 'Crystal Lattice',
    description: 'Build systematic frameworks for understanding complexity. Turn scattered insights into structure.',
    sortOrder: 2,
  },
  {
    key: 'metal_show-up',
    nationName: 'Argyra',
    channel: 'metal',
    waveStage: 'showUp',
    name: 'Calculated Action',
    description: 'Execute with precision based on thorough analysis. Every move is measured and deliberate.',
    sortOrder: 3,
  },

  // ── Lamenth (Water / Sadness) ──────────────────────────────────────────
  {
    key: 'water_wake-up',
    nationName: 'Lamenth',
    channel: 'water',
    waveStage: 'wakeUp',
    name: 'Ancestral Sight',
    description: 'Remember the wisdom embedded in your lineage. Let the past speak to the present.',
    sortOrder: 0,
  },
  {
    key: 'water_clean-up',
    nationName: 'Lamenth',
    channel: 'water',
    waveStage: 'cleanUp',
    name: 'Stone Grief',
    description: 'Honor old pain by allowing it to fully pass through. Grief held is grief hardened; grief released is grief transformed.',
    sortOrder: 1,
  },
  {
    key: 'water_grow-up',
    nationName: 'Lamenth',
    channel: 'water',
    waveStage: 'growUp',
    name: 'Foundation Building',
    description: 'Grow by deeply understanding where you came from. Roots before branches.',
    sortOrder: 2,
  },
  {
    key: 'water_show-up',
    nationName: 'Lamenth',
    channel: 'water',
    waveStage: 'showUp',
    name: 'Enduring Presence',
    description: 'Act with the weight of history behind you. Show up as someone who carries their story forward.',
    sortOrder: 3,
  },

  // ── Virelune (Wood / Joy) ──────────────────────────────────────────────
  {
    key: 'wood_wake-up',
    nationName: 'Virelune',
    channel: 'wood',
    waveStage: 'wakeUp',
    name: 'Vitality Sense',
    description: 'Notice where life force is rising and what wants to grow. Tune into the green signal.',
    sortOrder: 0,
  },
  {
    key: 'wood_clean-up',
    nationName: 'Virelune',
    channel: 'wood',
    waveStage: 'cleanUp',
    name: 'Growth Around',
    description: 'Let obstacles become compost; expand around what blocks you. Nothing stops growth — it just redirects.',
    sortOrder: 1,
  },
  {
    key: 'wood_grow-up',
    nationName: 'Virelune',
    channel: 'wood',
    waveStage: 'growUp',
    name: 'Sustained Bloom',
    description: 'Build capacity for joy that outlasts the moment. Root deep so the bloom endures.',
    sortOrder: 2,
  },
  {
    key: 'wood_show-up',
    nationName: 'Virelune',
    channel: 'wood',
    waveStage: 'showUp',
    name: 'Life Force Forward',
    description: 'Act with the energy of something coming alive. Move with the momentum of growth itself.',
    sortOrder: 3,
  },

  // ── Pyrakanth (Fire / Anger) ───────────────────────────────────────────
  {
    key: 'fire_wake-up',
    nationName: 'Pyrakanth',
    channel: 'fire',
    waveStage: 'wakeUp',
    name: 'Ember Vision',
    description: 'Let passion illuminate what truly matters to you. See by the light of your own fire.',
    sortOrder: 0,
  },
  {
    key: 'fire_clean-up',
    nationName: 'Pyrakanth',
    channel: 'fire',
    waveStage: 'cleanUp',
    name: 'Burn Offering',
    description: 'Transform old wounds into fuel for new growth. What burns away was never yours to keep.',
    sortOrder: 1,
  },
  {
    key: 'fire_grow-up',
    nationName: 'Pyrakanth',
    channel: 'fire',
    waveStage: 'growUp',
    name: 'Wild Cultivation',
    description: 'Nurture your desires into full bloom through devoted care. Tend the fire so it feeds, not consumes.',
    sortOrder: 2,
  },
  {
    key: 'fire_show-up',
    nationName: 'Pyrakanth',
    channel: 'fire',
    waveStage: 'showUp',
    name: 'Blaze Forward',
    description: 'Act with full intensity and commitment. Move through the world like something on fire with purpose.',
    sortOrder: 3,
  },

  // ── Meridia (Earth / Neutrality) ───────────────────────────────────────
  {
    key: 'earth_wake-up',
    nationName: 'Meridia',
    channel: 'earth',
    waveStage: 'wakeUp',
    name: 'Noon Clarity',
    description: 'Stand in the full light and see all things as they are. No shadow, no distortion.',
    sortOrder: 0,
  },
  {
    key: 'earth_clean-up',
    nationName: 'Meridia',
    channel: 'earth',
    waveStage: 'cleanUp',
    name: 'Fair Exchange',
    description: 'Release attachments by trading old for new. Every loss can become a fair deal.',
    sortOrder: 1,
  },
  {
    key: 'earth_grow-up',
    nationName: 'Meridia',
    channel: 'earth',
    waveStage: 'growUp',
    name: 'Market Mastery',
    description: 'Learn the art of value creation and exchange. Growth is knowing what something is worth.',
    sortOrder: 2,
  },
  {
    key: 'earth_show-up',
    nationName: 'Meridia',
    channel: 'earth',
    waveStage: 'showUp',
    name: 'Golden Deal',
    description: 'Take action through negotiation and mutual benefit. The best moves serve everyone at the table.',
    sortOrder: 3,
  },
] as const

/** Lookup a canonical move by key. */
export function getCanonicalNationMove(key: string): CanonicalNationMoveDefinition | undefined {
  return CANONICAL_NATION_MOVES.find((m) => m.key === key)
}

/** Get all 4 canonical moves for a nation (by name). */
export function getCanonicalMovesForNation(nationName: string): CanonicalNationMoveDefinition[] {
  return CANONICAL_NATION_MOVES.filter(
    (m) => m.nationName.toLowerCase() === nationName.toLowerCase()
  )
}

/** Get the canonical move for a specific nation × wave stage. */
export function getCanonicalMoveForWave(
  nationName: string,
  waveStage: WaveStage
): CanonicalNationMoveDefinition | undefined {
  return CANONICAL_NATION_MOVES.find(
    (m) => m.nationName.toLowerCase() === nationName.toLowerCase() && m.waveStage === waveStage
  )
}
