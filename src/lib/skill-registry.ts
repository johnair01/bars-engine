/**
 * Canonical Skill Registry
 *
 * Skills are archetype-specific and unlock when:
 *   1. player's attributeKey score >= unlockCondition.attributeMinScore (horizontal)
 *   2. player's altitudeLevel >= tier (vertical / story-gated)
 *
 * Start: Bold Heart archetype as the proof-of-system.
 * Pattern: archetypeKey_attributeKey_t{tier}
 *
 * Tier → face alignment (soft):
 *   1 = shaman (Magenta)
 *   2 = challenger (Red)
 *   3 = regent (Amber)
 *   4 = architect (Orange)
 *   5 = diplomat (Green)
 *   6 = sage (Teal)
 */

export type AttributeKey = 'vitality' | 'edge' | 'presence' | 'flow' | 'harmony' | 'insight'
export type ArchetypeKey =
  | 'bold_heart'
  | 'danger_walker'
  | 'decisive_storm'
  | 'devoted_guardian'
  | 'joyful_connector'
  | 'still_point'
  | 'subtle_influence'
  | 'truth_seer'

export const FACE_ALTITUDE: Record<string, number> = {
  shaman: 1,
  challenger: 2,
  regent: 3,
  architect: 4,
  diplomat: 5,
  sage: 6,
}

export const ATTRIBUTE_FACE_AFFINITY: Record<AttributeKey, string> = {
  vitality: 'shaman',
  edge: 'challenger',
  presence: 'regent',
  flow: 'architect',
  harmony: 'diplomat',
  insight: 'sage',
}

export interface SkillDefinition {
  key: string
  archetypeKey: ArchetypeKey
  attributeKey: AttributeKey
  tier: number
  name: string
  description: string
  unlockCondition: {
    attributeMinScore: number
    moveType?: string
    alignedAction?: string
  }
  faceAffinity?: string
}

// ---------------------------------------------------------------------------
// Bold Heart — first archetype proof
// ---------------------------------------------------------------------------

const BOLD_HEART_SKILLS: SkillDefinition[] = [
  // Vitality line (Shaman affinity)
  {
    key: 'bold_heart_vitality_t1',
    archetypeKey: 'bold_heart',
    attributeKey: 'vitality',
    tier: 1,
    name: 'First Breath',
    description: 'The capacity to show up alive — somatic presence before strategy. You feel it in the chest: expansion where there was holding.',
    unlockCondition: { attributeMinScore: 1, moveType: 'wake_up' },
    faceAffinity: 'shaman',
  },
  {
    key: 'bold_heart_vitality_t3',
    archetypeKey: 'bold_heart',
    attributeKey: 'vitality',
    tier: 3,
    name: 'Sustaining Fire',
    description: 'The Bold Heart\'s lifeforce does not diminish in difficulty — it concentrates. You become the eye of your own storm.',
    unlockCondition: { attributeMinScore: 3, moveType: 'show_up' },
    faceAffinity: 'regent',
  },
  {
    key: 'bold_heart_vitality_t6',
    archetypeKey: 'bold_heart',
    attributeKey: 'vitality',
    tier: 6,
    name: 'Living Forge',
    description: 'Mastery: your vitality is no longer a resource to manage — it is a field others enter. Aliveness becomes contagious.',
    unlockCondition: { attributeMinScore: 5, alignedAction: 'forge' },
    faceAffinity: 'sage',
  },

  // Edge line (Challenger affinity)
  {
    key: 'bold_heart_edge_t2',
    archetypeKey: 'bold_heart',
    attributeKey: 'edge',
    tier: 2,
    name: 'Hold the Friction',
    description: 'Where others retreat from discomfort, you stay — not from recklessness, but from knowing that friction is the site of growth.',
    unlockCondition: { attributeMinScore: 1, moveType: 'grow_up' },
    faceAffinity: 'challenger',
  },
  {
    key: 'bold_heart_edge_t4',
    archetypeKey: 'bold_heart',
    attributeKey: 'edge',
    tier: 4,
    name: 'Precision Cut',
    description: 'The Bold Heart learns to apply pressure exactly where it matters. Edge without aim is aggression; edge with insight is surgery.',
    unlockCondition: { attributeMinScore: 3 },
    faceAffinity: 'architect',
  },

  // Presence line (Regent affinity)
  {
    key: 'bold_heart_presence_t3',
    archetypeKey: 'bold_heart',
    attributeKey: 'presence',
    tier: 3,
    name: 'Weight of Arrival',
    description: 'When you enter a room the temperature shifts. Not through effort — through integrated self. Others feel you before you speak.',
    unlockCondition: { attributeMinScore: 2, moveType: 'show_up' },
    faceAffinity: 'regent',
  },
  {
    key: 'bold_heart_presence_t5',
    archetypeKey: 'bold_heart',
    attributeKey: 'presence',
    tier: 5,
    name: 'Mutual Ground',
    description: 'Presence so grounded it creates permission for others to be present too. The Bold Heart stops centering themselves — and everyone rises.',
    unlockCondition: { attributeMinScore: 4, alignedAction: 'allyship' },
    faceAffinity: 'diplomat',
  },

  // Insight line (Sage affinity)
  {
    key: 'bold_heart_insight_t6',
    archetypeKey: 'bold_heart',
    attributeKey: 'insight',
    tier: 6,
    name: 'The Shadow Recognized',
    description: 'Mastery: you can name your own shadow mid-action and metabolize it without stopping. Baldric the Hollow\'s challenge becomes a resource, not a threat.',
    unlockCondition: { attributeMinScore: 5, alignedAction: '321_quest' },
    faceAffinity: 'sage',
  },
]

// ---------------------------------------------------------------------------
// Export: full registry (extend with other archetypes here)
// ---------------------------------------------------------------------------

export const SKILL_REGISTRY: SkillDefinition[] = [
  ...BOLD_HEART_SKILLS,
  // TODO: danger_walker, decisive_storm, devoted_guardian,
  //       joyful_connector, still_point, subtle_influence, truth_seer
]

export function getSkillsForArchetype(archetypeKey: ArchetypeKey): SkillDefinition[] {
  return SKILL_REGISTRY.filter(s => s.archetypeKey === archetypeKey)
}

export function getSkillByKey(key: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find(s => s.key === key)
}
