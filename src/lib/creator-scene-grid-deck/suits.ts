/**
 * Scene Atlas — four-quadrant grid suits → BarDeckCard.suit strings (namespaced).
 * @see .specify/specs/creator-scene-grid-deck/spec.md
 */

export const SCENE_GRID_INSTANCE_SLUG = 'creator-scene-grid' as const

export const SCENE_GRID_SUITS = [
  {
    key: 'SCENE_GRID_TOP_DOM',
    label: 'Top · Lead',
    short: 'T/D',
    axis: { vertical: 'top', power: 'dom' as const },
  },
  {
    key: 'SCENE_GRID_TOP_SUB',
    label: 'Top · Follow',
    short: 'T/S',
    axis: { vertical: 'top', power: 'sub' as const },
  },
  {
    key: 'SCENE_GRID_BOTTOM_DOM',
    label: 'Bottom · Lead',
    short: 'B/D',
    axis: { vertical: 'bottom', power: 'dom' as const },
  },
  {
    key: 'SCENE_GRID_BOTTOM_SUB',
    label: 'Bottom · Follow',
    short: 'B/S',
    axis: { vertical: 'bottom', power: 'sub' as const },
  },
] as const

export type SceneGridSuitKey = (typeof SCENE_GRID_SUITS)[number]['key']

const RANK_NAMES = [
  'Anchor',
  'Lens',
  'Beat',
  'Boundary',
  'Prop',
  'Light',
  'Sound',
  'Pace',
  'Reveal',
  'Turn',
  'Aftercare',
  'Review',
  'Integration',
] as const

export function rankLabel(rank: number): string {
  if (rank < 1 || rank > 13) return String(rank)
  return RANK_NAMES[rank - 1] ?? `Step ${rank}`
}

export function orderedSuitKeys(): SceneGridSuitKey[] {
  return SCENE_GRID_SUITS.map((s) => s.key)
}
