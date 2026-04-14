/**
 * School entity types.
 *
 * A School has a portraysFace (GameMasterFace) and an optional nationId.
 * - nationId === null  → Big School (top-level, one per face)
 * - nationId !== null  → nation gym (one per nation × face)
 *
 * 36 total: 6 Big Schools + 30 nation gyms (5 nations × 6 faces).
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'

/** Shape returned from Prisma, typed at the TypeScript boundary. */
export interface SchoolRecord {
  id: string
  name: string
  description: string
  /** GameMasterFace value: shaman | challenger | regent | architect | diplomat | sage */
  portraysFace: GameMasterFace
  /** null = Big School; non-null = nation gym */
  nationId: string | null
  instanceId: string | null
  imgUrl: string | null
  archived: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/** Predicate: is this a Big School (top-level, face-canonical)? */
export function isBigSchool(school: Pick<SchoolRecord, 'nationId'>): boolean {
  return school.nationId === null
}

/** Predicate: is this a nation gym? */
export function isNationGym(school: Pick<SchoolRecord, 'nationId'>): boolean {
  return school.nationId !== null
}
