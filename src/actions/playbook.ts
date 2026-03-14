'use server'

import { db } from '@/lib/db'

/**
 * Get the Playbook (list of NationMoves) for an Archetype.
 * Playbook = moves where archetypeId matches.
 * Per spec: [archetype-playbooks](.specify/specs/deftness-uplevel-character-daemons-agents/archetype-playbooks/spec.md)
 */
export async function getPlaybookForArchetype(archetypeId: string) {
  return db.nationMove.findMany({
    where: { archetypeId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isStartingUnlocked: true,
      sortOrder: true,
    },
  })
}

/**
 * Get the Playbook (list of NationMoves) for the current player's Archetype.
 * Returns empty array if player has no archetype.
 */
export async function getPlaybookForPlayer(playerId: string) {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { archetypeId: true },
  })
  if (!player?.archetypeId) return []
  return getPlaybookForArchetype(player.archetypeId)
}
