import { db } from '@/lib/db'
import {
  defaultGridPolarities,
  derivePolaritiesFromNationArchetype,
  gridAxisSourceFromStoredJson,
  parseGridPoliciesFromStoryProgress,
  type ResolvedGridPolarities,
} from '@/lib/creator-scene-grid-deck/polarities'

/**
 * Resolution order: adventure / values JSON in storyProgress → nation+archetype derivation → default.
 */
export async function resolvePlayerGridPolarities(playerId: string): Promise<ResolvedGridPolarities> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      storyProgress: true,
      nation: { select: { name: true, element: true } },
      archetype: { select: { name: true, description: true, primaryWaveStage: true } },
    },
  })

  if (!player) return defaultGridPolarities()

  const fromAdventure = parseGridPoliciesFromStoryProgress(player.storyProgress)
  if (fromAdventure) {
    const channel = gridAxisSourceFromStoredJson(fromAdventure.source)
    return {
      source: channel,
      pair1: fromAdventure.pair1,
      pair2: fromAdventure.pair2,
      provenance: fromAdventure.adventureSlug ?? fromAdventure.source,
    }
  }

  const derived = derivePolaritiesFromNationArchetype(
    player.nation ? { name: player.nation.name, element: player.nation.element } : null,
    player.archetype
      ? {
          name: player.archetype.name,
          description: player.archetype.description,
          primaryWaveStage: player.archetype.primaryWaveStage,
        }
      : null
  )
  if (derived) return derived

  return defaultGridPolarities()
}
