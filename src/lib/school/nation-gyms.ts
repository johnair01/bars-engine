/**
 * The 30 Nation Gyms — one per (nation × GameMasterFace) pair.
 *
 * Each nation gets 6 gyms, one for each face. The gym inflects the face's
 * universal mission through the nation's elemental lens:
 *
 *   Argyra (Metal)    — reflection, logic, precision
 *   Lamenth (Water)    — memory, history, endurance
 *   Virelune (Wood)    — vitality, growth, delight
 *   Pyrakanth (Fire)   — passion, intensity, transformation
 *   Meridia (Earth)    — clarity, exchange, balance
 *
 * Nations have NO prescribed face affinity — affinity is emergent through play.
 * All 6 gyms per nation start equally available; player choice determines
 * which gym accrues affinity over time.
 *
 * Source of truth for nation gym identity. Used by:
 * - scripts/seed-nation-gyms.ts (standalone idempotent seed)
 * - CYOA Composer build contract (school selection step)
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'
import { NATIONS, type NationDefinition } from '@/lib/nation/nations'

export interface NationGymDefinition {
  /** Which nation this gym belongs to */
  readonly nationName: string
  /** Which Wuxing element the parent nation carries */
  readonly element: string
  /** Which GameMasterFace this gym embodies */
  readonly portraysFace: GameMasterFace
  /** Display name: "{Nation} {Face} Gym" */
  readonly name: string
  /** Description: face mission inflected through nation element */
  readonly description: string
  /** Sort order within the nation (0-5, matching face developmental order) */
  readonly sortOrder: number
}

/**
 * Gym description matrix: each [nation][face] gets a unique description
 * that inflects the face's universal mission through the nation's element.
 */
const GYM_DESCRIPTIONS: Record<string, Record<GameMasterFace, string>> = {
  Argyra: {
    shaman:
      'Silver Threshold — ritual through reflection. ' +
      'The Argyra Shaman Gym teaches students to cross liminal boundaries by examining ' +
      'their own reflections, using logic as a mirror for the mythic.',
    challenger:
      'Mirror Forge — courage through precision. ' +
      'The Argyra Challenger Gym hones edge and action through analytical rigor, ' +
      'teaching students that the sharpest blade is a clear mind.',
    regent:
      'Crystal Court — order through structure. ' +
      'The Argyra Regent Gym builds hierarchy from first principles, ' +
      'training students to serve the collective through systematic frameworks.',
    architect:
      'Silver Blueprint — strategy through analysis. ' +
      'The Argyra Architect Gym crafts blueprints with metallic precision, ' +
      'stewarding projects through logical decomposition and calculated advantage.',
    diplomat:
      'Mirror Weave — connection through reflection. ' +
      'The Argyra Diplomat Gym teaches relational care by showing students ' +
      'how to see themselves in others and others in themselves.',
    sage:
      'Crystal Synthesis — integration through logic. ' +
      'The Argyra Sage Gym seeks the whole through rigorous analysis, ' +
      'using mirrors to reveal the meta-pattern behind all perspectives.',
  },
  Lamenth: {
    shaman:
      'Ancestral Gate — ritual through memory. ' +
      'The Lamenth Shaman Gym opens thresholds to the past, ' +
      'teaching students that belonging is rooted in remembering where they came from.',
    challenger:
      'Stone Edge — courage through endurance. ' +
      'The Lamenth Challenger Gym forges resilience from grief, ' +
      'teaching that true power comes from the weight of what you have survived.',
    regent:
      'Foundation Hall — order through tradition. ' +
      'The Lamenth Regent Gym preserves the old forms and duties, ' +
      'training students to uphold the structures that have endured.',
    architect:
      'Deep Archive — strategy through history. ' +
      'The Lamenth Architect Gym builds on what came before, ' +
      'stewarding the collective backlog by understanding its full lineage.',
    diplomat:
      'Grief Circle — connection through witness. ' +
      'The Lamenth Diplomat Gym teaches relational depth through shared mourning, ' +
      'weaving bonds that hold when everything else has washed away.',
    sage:
      'Living Memory — integration through time. ' +
      'The Lamenth Sage Gym sees the whole by holding all of history at once, ' +
      'finding the pattern that connects past, present, and future.',
  },
  Virelune: {
    shaman:
      'Green Threshold — ritual through vitality. ' +
      'The Virelune Shaman Gym awakens the mythic through raw life force, ' +
      'teaching students that the liminal edge is wherever something is about to bloom.',
    challenger:
      'Wild Proving — courage through growth. ' +
      'The Virelune Challenger Gym channels the unstoppable energy of wood, ' +
      'teaching that obstacles are compost for the next burst of power.',
    regent:
      'Garden Court — order through cultivation. ' +
      'The Virelune Regent Gym brings structure to wild growth, ' +
      'training students to tend the collective garden with patient discipline.',
    architect:
      'Growth Blueprint — strategy through vitality. ' +
      'The Virelune Architect Gym designs systems that grow organically, ' +
      'stewarding projects with the adaptive intelligence of a living forest.',
    diplomat:
      'Bloom Circle — connection through joy. ' +
      'The Virelune Diplomat Gym cultivates the relational field with delight, ' +
      'teaching that joy shared is the strongest bond between people.',
    sage:
      'Canopy View — integration through life. ' +
      'The Virelune Sage Gym sees the whole ecosystem from the highest branches, ' +
      'finding emergence in the unstoppable vitality of interconnected growth.',
  },
  Pyrakanth: {
    shaman:
      'Ember Gate — ritual through passion. ' +
      'The Pyrakanth Shaman Gym kindles the mythic fire within, ' +
      'teaching students that the threshold between worlds burns bright.',
    challenger:
      'Flame Trial — courage through intensity. ' +
      'The Pyrakanth Challenger Gym is pure proving ground, ' +
      'forging students in the heat of full-intensity commitment.',
    regent:
      'Burning Court — order through devotion. ' +
      'The Pyrakanth Regent Gym channels passion into structure, ' +
      'training students that devoted service burns brighter than selfish flame.',
    architect:
      'Fire Blueprint — strategy through transformation. ' +
      'The Pyrakanth Architect Gym designs through creative destruction, ' +
      'building new systems from the ashes of what no longer serves.',
    diplomat:
      'Hearth Circle — connection through warmth. ' +
      'The Pyrakanth Diplomat Gym tends the relational fire, ' +
      'teaching that care expressed with intensity creates unbreakable bonds.',
    sage:
      'Phoenix View — integration through transformation. ' +
      'The Pyrakanth Sage Gym holds the whole cycle of burning and rebirth, ' +
      'seeing how destruction and creation are the same movement.',
  },
  Meridia: {
    shaman:
      'Golden Gate — ritual through clarity. ' +
      'The Meridia Shaman Gym reveals the mythic in the everyday, ' +
      'teaching students that the threshold is crossed by seeing clearly.',
    challenger:
      'Noon Trial — courage through transparency. ' +
      'The Meridia Challenger Gym tests students in full light, ' +
      'where nothing is hidden and every move is accountable.',
    regent:
      'Market Court — order through fair exchange. ' +
      'The Meridia Regent Gym structures the collective through balanced trade, ' +
      'training students that healthy hierarchy is mutual benefit.',
    architect:
      'Trade Blueprint — strategy through value. ' +
      'The Meridia Architect Gym designs systems of exchange and mutual advantage, ' +
      'stewarding projects through negotiation and honest accounting.',
    diplomat:
      'Golden Circle — connection through reciprocity. ' +
      'The Meridia Diplomat Gym weaves relationships through fair dealing, ' +
      'teaching that the strongest bonds are built on equitable exchange.',
    sage:
      'Meridian View — integration through balance. ' +
      'The Meridia Sage Gym stands at the center and sees all five directions, ' +
      'finding the whole in the balance point where all elements meet.',
  },
}

/**
 * Generate the name for a nation gym.
 * Pattern: "{Nation} {Face} Gym"
 */
function gymName(nationName: string, face: GameMasterFace): string {
  const faceLabel = face.charAt(0).toUpperCase() + face.slice(1)
  return `${nationName} ${faceLabel} Gym`
}

/**
 * Build all 30 nation gym definitions from the nation × face matrix.
 * Deterministic: same order every time (nations in Wuxing cycle, faces in developmental order).
 */
function buildNationGyms(): readonly NationGymDefinition[] {
  const gyms: NationGymDefinition[] = []

  for (const nation of NATIONS) {
    for (let faceIdx = 0; faceIdx < GAME_MASTER_FACES.length; faceIdx++) {
      const face = GAME_MASTER_FACES[faceIdx]
      gyms.push({
        nationName: nation.name,
        element: nation.element,
        portraysFace: face,
        name: gymName(nation.name, face),
        description: GYM_DESCRIPTIONS[nation.name][face],
        sortOrder: faceIdx,
      })
    }
  }

  return gyms
}

/**
 * Immutable seed definitions for the 30 nation gyms.
 * 5 nations × 6 faces, ordered by (Wuxing cycle × developmental sequence).
 */
export const NATION_GYMS: readonly NationGymDefinition[] = buildNationGyms()

/** Get all 6 gyms for a given nation name. */
export function getGymsForNation(nationName: string): readonly NationGymDefinition[] {
  return NATION_GYMS.filter((g) => g.nationName === nationName)
}

/** Get all 5 gyms across nations for a given face. */
export function getGymsForFace(face: GameMasterFace): readonly NationGymDefinition[] {
  return NATION_GYMS.filter((g) => g.portraysFace === face)
}

/** Lookup a specific nation gym by nation name and face. */
export function getNationGym(
  nationName: string,
  face: GameMasterFace,
): NationGymDefinition | undefined {
  return NATION_GYMS.find((g) => g.nationName === nationName && g.portraysFace === face)
}
