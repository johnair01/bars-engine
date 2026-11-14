/**
 * The six self-sabotaging beliefs — the closed set a player picks from when they record being
 * stuck on a quest. Recorded as PlayerQuest.frictionType.
 *
 * These are self-attributions, not emotional positions. They do not map onto the five channels
 * or onto the shadows of the guide opposition matrix. The belief is never categorically wrong;
 * it is imprecise and badly scoped, which is what the intake works on.
 *
 * The moves that disprove each belief are not defined here. Only two are named so far
 * (not ready → "what ARE we ready to do?"; not capable → "what IS capable?"). Do not fill the
 * rest by symmetry.
 */
export const SHADOW_BELIEFS = [
  'not_ready',
  'not_capable',
  'not_worthy',
  'dont_belong',
  'insignificant',
  'not_good_enough',
] as const

export type ShadowBelief = (typeof SHADOW_BELIEFS)[number]

export const SHADOW_BELIEF_LABELS: Record<ShadowBelief, string> = {
  not_ready: "I'm not ready",
  not_capable: "I'm not capable",
  not_worthy: "I'm not worthy",
  dont_belong: "I don't belong",
  insignificant: "I'm insignificant",
  not_good_enough: "I'm not good enough",
}

/** Kept under the existing name so the quest-friction call sites do not churn. */
export const FRICTION_TYPES = SHADOW_BELIEFS

export type FrictionType = ShadowBelief

/**
 * The vocabulary written before 2026-11-13. It described symptoms, not beliefs, and the five values
 * have no one-to-one map into the six beliefs. Mapping them would invent an attribution the player
 * never made, so they stay readable as themselves: writes are beliefs only, reads accept both.
 */
export const LEGACY_SYMPTOMS = ['confusion', 'fear', 'overwhelm', 'avoidance', 'other'] as const

export type LegacySymptom = (typeof LEGACY_SYMPTOMS)[number]

export const LEGACY_SYMPTOM_LABELS: Record<LegacySymptom, string> = {
  confusion: 'Confusion',
  fear: 'Fear',
  overwhelm: 'Overwhelm',
  avoidance: 'Avoidance',
  other: 'Other',
}

export function isShadowBelief(value: string): value is ShadowBelief {
  return (SHADOW_BELIEFS as readonly string[]).includes(value)
}

export function isLegacySymptom(value: string): value is LegacySymptom {
  return (LEGACY_SYMPTOMS as readonly string[]).includes(value)
}

/** Any stored value, either vocabulary, as display text. Unknown values fall back to the raw string. */
export function frictionLabel(value: string | null | undefined): string {
  if (!value) return ''
  if (isShadowBelief(value)) return SHADOW_BELIEF_LABELS[value]
  if (isLegacySymptom(value)) return LEGACY_SYMPTOM_LABELS[value]
  return value
}
