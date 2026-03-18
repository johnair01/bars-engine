/**
 * Admin Agent Forge — types and enums.
 * @see .specify/specs/admin-agent-forge/spec.md
 */

export const FORGE_STAGES = [
  'THIRD_PERSON',
  'SECOND_PERSON',
  'FIRST_PERSON',
  'FRICTION_REASSESS',
  'ROUTING',
  'COMPLETE',
] as const

export type ForgeStage = (typeof FORGE_STAGES)[number]

export const SATISFACTION_APEX = [
  'BLISS',
  'TRIUMPH',
  'POIGNANCE',
  'PEACE',
  'EXCITEMENT',
] as const

export type SatisfactionApexEnum = (typeof SATISFACTION_APEX)[number]

export const DISSATISFACTION = [
  'MANIA',
  'SARCASM',
  'FRUSTRATION',
  'HATRED',
  'DEPRESSION',
  'DESPAIR',
  'APATHY',
  'BOREDOM',
  'ANXIETY',
  'HYPER_CRITICISM',
] as const

export type DissatisfactionEnum = (typeof DISSATISFACTION)[number]

export const SELF_SABOTAGE = [
  'NOT_GOOD_ENOUGH',
  'NOT_CAPABLE',
  'INSIGNIFICANT',
  'NOT_WORTHY',
  'DONT_BELONG',
  'NOT_READY',
] as const

export type SelfSabotageEnum = (typeof SELF_SABOTAGE)[number]

export const ROUTING_TARGETS = [
  'ARCHETYPE',
  'NATION',
  'CAMPAIGN',
  'META_AGENT',
  'GLOBAL_POLICY',
] as const

export type RoutingTargetEnum = (typeof ROUTING_TARGETS)[number]

export const DISTORTION_THRESHOLD = 5
export const FRICTION_DELTA_MINT_THRESHOLD = 2
export const DEFAULT_COOLDOWN_DAYS = 5

/** Cooldown by DeftnessScore: 0–3 → 7d, 4–6 → 5d, 7–10 → 3d. Fallback: 5 days. */
export function getCooldownDays(deftnessScore: number | null | undefined): number {
  if (deftnessScore == null || deftnessScore < 0) return DEFAULT_COOLDOWN_DAYS
  if (deftnessScore <= 3) return 7
  if (deftnessScore <= 6) return 5
  return 3
}
