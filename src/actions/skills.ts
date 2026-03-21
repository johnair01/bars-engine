'use server'

/**
 * Player skill / attribute actions — **stubbed** until Prisma models
 * (`PlayerAttribute`, `PlayerFaceAltitude`, `Skill`, `PlayerSkill`) exist in schema.
 *
 * The previous implementation targeted tables that are not in `prisma/schema.prisma`;
 * this file keeps the public API so callers compile, while returning safe defaults.
 *
 * @see src/lib/skill-registry.ts — registry still documents intended behavior.
 */

import type { AttributeKey } from '@/lib/skill-registry'

const DEFAULT_ATTRIBUTES: Record<AttributeKey, number> = {
  vitality: 0,
  edge: 0,
  presence: 0,
  flow: 0,
  harmony: 0,
  insight: 0,
}

export async function getPlayerAttributes(playerId: string) {
  void playerId
  return { ...DEFAULT_ATTRIBUTES }
}

export async function getPlayerFaceAltitude(playerId: string) {
  void playerId
  return { currentFace: 'shaman' as const, altitudeLevel: 1 }
}

export async function getPlayerSkills(playerId: string) {
  void playerId
  return [] as Array<{
    skillId: string
    skill: { tier: number; attributeKey: string; name: string }
  }>
}

export async function incrementAttribute(
  playerId: string,
  attributeKey: AttributeKey,
  amount = 1
) {
  void playerId
  void attributeKey
  void amount
  return { score: 0, changed: false as const }
}

export async function checkAndUnlockSkills(playerId: string) {
  void playerId
  return [] as string[]
}

export async function advanceFaceAltitude(playerId: string) {
  void playerId
  return { altitudeLevel: 1, currentFace: 'shaman' as const, changed: false as const }
}

export async function seedSkillRegistry() {
  return 0
}
