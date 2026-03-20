/**
 * Palette labels + which kinds show in the admin UI (pure — no browser APIs).
 */

import { CMA_NODE_KINDS, type CmaNodeKind } from './types'

export const CMA_KIND_LABELS: Record<CmaNodeKind, string> = {
  scene: 'Scene',
  choice: 'Choice',
  metabolize: 'Metabolize',
  commit: 'Commit',
  branch_guard: 'Branch guard',
  merge: 'Merge',
  end: 'End',
}

/** Default subset before “unlock all archetypes”. */
export const CMA_MVP_KINDS: CmaNodeKind[] = ['scene', 'choice', 'end']

export function cmaKindsForAdminPalette(fullArchetypesUnlocked: boolean): CmaNodeKind[] {
  return fullArchetypesUnlocked ? [...CMA_NODE_KINDS] : [...CMA_MVP_KINDS]
}
