'use server'

/**
 * Phase 7: Merge 321 shadow name + bounded metadata into matching NPCs (`Player` with creatorType `agent`).
 * Spec: .specify/specs/321-suggest-name/spec.md
 */

import {
  merge321NameIntoMatchingNpcs as merge321NameIntoMatchingNpcsImpl,
  type Merge321NameParams,
} from '@/lib/npc321-inner-work-merge'

/**
 * Create one merge row per matching NPC (same nation + archetype as match key).
 * Idempotent per (shadow321SessionId, npcPlayerId) via DB unique + skipDuplicates.
 */
export async function merge321NameIntoMatchingNpcs(
  params: Merge321NameParams
): Promise<{ merged: number }> {
  return merge321NameIntoMatchingNpcsImpl(params)
}
