/**
 * Quest Library wave routing (DW) — pool tags derived from moveType on approve.
 * @see .specify/specs/quest-library-wave-routing/spec.md
 */
export type QuestPoolType = 'efa' | 'dojo' | 'discovery' | 'gameboard'

const MOVE_TO_POOL: Record<string, QuestPoolType> = {
  wakeUp: 'discovery',
  cleanUp: 'efa',
  growUp: 'dojo',
  showUp: 'gameboard',
}

export function questPoolForMoveType(moveType: string | null | undefined): QuestPoolType {
  const key = moveType ?? 'growUp'
  return MOVE_TO_POOL[key] ?? 'dojo'
}
