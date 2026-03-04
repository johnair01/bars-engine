/**
 * Playbook → Primary WAVE Stage Mapping
 *
 * Fetches primaryWaveStage from DB for choice privileging.
 * Fallback: 'showUp' when playbook not found or primaryWaveStage unset.
 *
 * See: .specify/backlog/prompts/playbook-primary-wave-spec.md
 */

import { db } from '@/lib/db'
import type { PersonalMoveType } from './types'

const VALID_STAGES: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

/**
 * Get the primary WAVE stage for a playbook.
 * Returns 'showUp' when playbook not found or primaryWaveStage unset.
 */
export async function getPlaybookPrimaryWave(playbookId: string): Promise<PersonalMoveType> {
  if (!playbookId) return 'showUp'
  const playbook = await db.playbook.findUnique({
    where: { id: playbookId },
    select: { primaryWaveStage: true },
  })
  const stage = playbook?.primaryWaveStage
  if (stage && VALID_STAGES.includes(stage as PersonalMoveType)) {
    return stage as PersonalMoveType
  }
  return 'showUp'
}
