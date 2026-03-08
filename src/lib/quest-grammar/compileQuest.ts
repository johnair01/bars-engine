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
 * Async variant that resolves nation/playbook for choice privileging.
 * Use when targetNationId or targetPlaybookId are provided.
 */
export async function compileQuestWithPrivileging(input: QuestCompileInput): Promise<QuestPacket> {
  const { targetNationId, targetPlaybookId } = input
  if (!targetNationId && !targetPlaybookId) {
    return compileQuest(input)
  }

  let nationElement: ElementKey = 'earth'
  let playbookWave: PersonalMoveType = 'showUp'

  if (targetNationId) {
    const nation = await db.nation.findUnique({
      where: { id: targetNationId },
      select: { element: true },
    })
    if (nation?.element && ['metal', 'water', 'wood', 'fire', 'earth'].includes(nation.element)) {
      nationElement = nation.element as ElementKey
    }
  }

  if (targetPlaybookId) {
    const { getPlaybookPrimaryWave } = await import('./playbook-wave')
    playbookWave = await getPlaybookPrimaryWave(targetPlaybookId)
  }

  return compileQuest({
    ...input,
    privilegeContext: { nationElement, playbookWave },
  })
}
