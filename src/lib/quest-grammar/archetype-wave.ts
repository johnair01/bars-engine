/**
 * Archetype → Primary WAVE Stage Mapping
 *
 * Fetches primaryWaveStage from DB for choice privileging.
 * Fallback: 'showUp' when archetype not found or primaryWaveStage unset.
 *
 * See: .specify/backlog/prompts/playbook-primary-wave-spec.md
 */

import { db } from '@/lib/db'
import type { PersonalMoveType } from './types'

const VALID_STAGES: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

/**
 * Get the primary WAVE stage for an archetype.
 * Returns 'showUp' when archetype not found or primaryWaveStage unset.
 */
export async function getArchetypePrimaryWave(archetypeId: string): Promise<PersonalMoveType> {
  if (!archetypeId) return 'showUp'
  const archetype = await db.archetype.findUnique({
    where: { id: archetypeId },
    select: { primaryWaveStage: true },
  })
  const stage = archetype?.primaryWaveStage
  if (stage && VALID_STAGES.includes(stage as PersonalMoveType)) {
    return stage as PersonalMoveType
  }
  return 'showUp'
}
