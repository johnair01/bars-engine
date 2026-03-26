import type { SpaceId, SpaceHomePayload } from './types'
import { NARRATIVE_SPACE_SECTIONS } from './baseline-map'
import { buildWorldMapState } from './world-map'

/** Curated primary CTA per space (not always the first card). */
const PRIMARY_CTA: Record<SpaceId, { label: string; href: string }> = {
  library: { label: 'Open quest library', href: '/library' },
  dojo: { label: 'Moves in your hand', href: '/hand/moves' },
  forest: { label: 'Browse adventures', href: '/adventures' },
  forge: { label: 'Capture a charge', href: '/capture' },
}

function recommendationsForSpace(space: SpaceId): string[] {
  const { recommendedTransitions } = buildWorldMapState(null)
  const lines: string[] = []
  for (const tr of recommendedTransitions) {
    if (tr.from === space) {
      lines.push(`Toward ${tr.to}: ${tr.narrativeHint}`)
    }
    if (tr.to === space) {
      lines.push(`From ${tr.from}: ${tr.reason}`)
    }
  }
  return lines.slice(0, 5)
}

/** Payload for space home API and `/narrative/[space]` page. */
export function getSpaceHomePayload(space: SpaceId): SpaceHomePayload {
  const section = NARRATIVE_SPACE_SECTIONS.find((s) => s.id === space)
  if (!section) {
    throw new Error(`Unknown narrative space: ${space}`)
  }
  return {
    spaceId: space,
    title: section.title,
    subtitle: section.subtitle,
    narrativeDescription: section.narrativeDescription,
    mechanicalDescription: section.mechanicalDescription,
    accentBar: section.accentBar,
    primaryCta: PRIMARY_CTA[space],
    destinations: section.items,
    recommendations: recommendationsForSpace(space),
    gameMapHash: `space-${space}`,
  }
}
