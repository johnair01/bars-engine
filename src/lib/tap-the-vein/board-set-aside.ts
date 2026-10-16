/**
 * "Set aside" from the Council Board (six-faces-council docs/seed-library.md, the board's surface).
 *
 * The board's Morning tab shows each sealed intake item with the task id the seal gave it (`ttv-one-store`). Setting
 * one aside saves `seeds/<taskId>` on board=council; the save route calls this in the same transaction, so the task
 * rests in his seed library exactly as "Set aside" on a card's action sheet does (src/actions/tap-the-vein.ts,
 * restTask): only a live task (committed or in progress), status `resting`, one dated `library` note, no reason
 * asked. Drawing and letting go stay in bars-engine.
 */

import type { Prisma } from '@prisma/client'
import { LIBRARY_NOTE_KIND, RESTABLE_STATUSES, RESTING_STATUS, restNote } from './seed-library'

export type SetAsideResult =
  | { ok: true; already: boolean }
  | { ok: false; status: 404 | 409; error: string }

/** What a board set-aside does to a task in this status, before any write. */
export function setAsideOutcome(status: string | null): SetAsideResult | 'rest' {
  if (status === null) return { ok: false, status: 404, error: 'No such task' }
  if (status === RESTING_STATUS) return { ok: true, already: true }
  if (!RESTABLE_STATUSES.has(status)) return { ok: false, status: 409, error: `It is ${status.replace(/_/g, ' ')}, so it cannot rest` }
  return 'rest'
}

/** Rest the owner's task. Safe to save twice: a task already resting is left as it is, with no second note. */
export async function setAsideFromBoard(tx: Prisma.TransactionClient, playerId: string, taskId: string,
  now = new Date()): Promise<SetAsideResult> {
  const task = await tx.tapTheVeinTask.findUnique({ where: { id: taskId }, select: { playerId: true, status: true } })
  const outcome = setAsideOutcome(task && task.playerId === playerId ? task.status : null)
  if (outcome !== 'rest') return outcome
  await tx.tapTheVeinTask.update({ where: { id: taskId }, data: { status: RESTING_STATUS } })
  await tx.tapTheVeinTaskNote.create({
    data: { taskId, playerId, kind: LIBRARY_NOTE_KIND, body: restNote(now.toISOString().slice(0, 10)) },
  })
  return { ok: true, already: false }
}
