import type { SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'

/** Flatten deck in canonical order: `orderedSuits` × ranks ascending. */
export function flattenSceneAtlasCards(
  orderedSuits: string[],
  cardsBySuit: Record<string, SceneGridCardView[]>
): SceneGridCardView[] {
  return orderedSuits.flatMap((suit) => {
    const row = cardsBySuit[suit] ?? []
    return [...row].sort((a, b) => a.rank - b.rank)
  })
}

/**
 * Next empty cell after `afterCardId` in scan order (for “next scene” flow).
 * If `afterCardId` is null, returns first empty cell.
 */
export function nextEmptySceneAtlasCell(
  orderedSuits: string[],
  cardsBySuit: Record<string, SceneGridCardView[]>,
  afterCardId: string | null
): SceneGridCardView | null {
  const flat = flattenSceneAtlasCards(orderedSuits, cardsBySuit)
  let start = 0
  if (afterCardId) {
    const idx = flat.findIndex((c) => c.id === afterCardId)
    start = idx >= 0 ? idx + 1 : 0
  }
  for (let i = start; i < flat.length; i++) {
    if (!flat[i].boundBar) return flat[i]
  }
  return null
}
