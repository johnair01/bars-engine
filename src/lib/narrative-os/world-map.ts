import { SPACE_IDS, type SpaceId, type WorldMapPayload, type WorldMapSpaceSummary, type WorldMapState } from './types'
import { NARRATIVE_SPACE_SECTIONS } from './baseline-map'
import { BASELINE_LOOP_HINTS, getDefaultRecommendedTransitions } from './transitions'

function sectionToSummary(section: (typeof NARRATIVE_SPACE_SECTIONS)[number]): WorldMapSpaceSummary {
  return {
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    narrativeDescription: section.narrativeDescription,
    mechanicalDescription: section.mechanicalDescription,
    isUnlocked: true,
    isHighlighted: false,
    recentActivityCount: 0,
    recommendedAction: defaultRecommendedAction(section.id),
    availableContentCounts: {
      links: section.items.length,
    },
    campaignOverlayCount: 0,
  }
}

function defaultRecommendedAction(space: SpaceId): string {
  switch (space) {
    case 'library':
      return 'Read something short in the wiki, then pick a quest in the library.'
    case 'dojo':
      return 'Open moves in your hand or revisit character creator.'
    case 'forest':
      return 'Start an adventure or step into the campaign hub.'
    case 'forge':
      return 'Capture a charge or run a 321 pass — then visit Vault.'
  }
}

/** Public map payload for GET /api/world/map and server-rendered shell. */
export function buildWorldMapPayload(): WorldMapPayload {
  return {
    version: 1,
    spaces: NARRATIVE_SPACE_SECTIONS.map(sectionToSummary),
    recommendations: [...BASELINE_LOOP_HINTS],
    activeOverlays: [],
    starterPlayAvailable: true,
  }
}

/** Per-player state for GET /api/world/map/state (v0: minimal, no DB). */
export function buildWorldMapState(playerId: string | null): WorldMapState {
  return {
    playerId,
    currentSpace: null,
    unlockedSpaces: [...SPACE_IDS],
    recentTransitions: [],
    recommendedTransitions: getDefaultRecommendedTransitions(),
    activeOverlays: [],
    starterWorldReady: true,
  }
}
