/**
 * Quest Grammar Compiler — Privileged Variant (Server-Only)
 *
 * Async variant that resolves nation/playbook for choice privileging.
 * Uses Prisma (db) — must not be imported by client components.
 * Use compileQuestWithPrivilegingAction from @/actions/quest-grammar for client calls.
 */

import { db } from '@/lib/db'
import { compileQuest } from './compileQuestCore'
import type { ElementKey } from './elements'
import type { QuestCompileInput, QuestPacket, PersonalMoveType } from './types'

/**
 * Async variant that resolves nation/archetype for choice privileging.
 * Use when targetNationId or targetArchetypeId are provided.
 */
export async function compileQuestWithPrivileging(input: QuestCompileInput): Promise<QuestPacket> {
  const { targetNationId, targetArchetypeId } = input
  if (!targetNationId && !targetArchetypeId) {
    return compileQuest(input)
  }

  let nationElement: ElementKey = 'earth'
  let archetypeWave: PersonalMoveType = 'showUp'

  if (targetNationId) {
    const nation = await db.nation.findUnique({
      where: { id: targetNationId },
      select: { element: true },
    })
    if (nation?.element && ['metal', 'water', 'wood', 'fire', 'earth'].includes(nation.element)) {
      nationElement = nation.element as ElementKey
    }
  }

  if (targetArchetypeId) {
    const { getArchetypePrimaryWave } = await import('./archetype-wave')
    archetypeWave = await getArchetypePrimaryWave(targetArchetypeId)
  }

  return compileQuest({
    ...input,
    privilegeContext: { nationElement, archetypeWave },
  })
}
