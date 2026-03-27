import { db } from '@/lib/db'
import { getSceneAtlasDailyState } from '@/lib/scene-atlas-daily'
import {
  cardDisplayTitle,
  quadrantLabelsFromPairs,
  type ResolvedGridPolarities,
} from '@/lib/creator-scene-grid-deck/polarities'
import { resolvePlayerGridPolarities } from '@/lib/creator-scene-grid-deck/resolve-player-polarities'
import { orderedSuitKeys, type SceneGridSuitKey } from '@/lib/creator-scene-grid-deck/suits'

export type SceneAtlasDailyView = {
  used: number
  limit: number
  remaining: number
}

export type SceneGridCardView = {
  id: string
  suit: string
  rank: number
  promptTitle: string
  promptText: string
  /** Row heading from resolved polarity pairs (same for all cards in this suit). */
  rowLabel: string
  /** Player-specific title for this cell (row + rank lens). */
  displayTitle: string
  boundBar: { id: string; title: string } | null
}

export async function loadSceneGridDeckView(
  playerId: string,
  instanceSlug: string
): Promise<
  | { ok: false; reason: 'not_found' }
  | {
      ok: true
      /** `BarDeck.id` — prompt draw / play cycle (see prompt-deck-draw-hand spec). */
      deckId: string
      instance: { id: string; slug: string; name: string }
      polarities: ResolvedGridPolarities
      cardsBySuit: Record<string, SceneGridCardView[]>
      orderedSuits: string[]
      filledCount: number
      dailySceneAtlas: SceneAtlasDailyView
    }
> {
  const [polarities, playerRow] = await Promise.all([
    resolvePlayerGridPolarities(playerId),
    db.player.findUnique({
      where: { id: playerId },
      select: { storyProgress: true },
    }),
  ])
  const dailySceneAtlas = getSceneAtlasDailyState(playerRow?.storyProgress)
  const rowLabels = quadrantLabelsFromPairs(polarities)

  const instance = await db.instance.findUnique({
    where: { slug: instanceSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      deckLibrary: {
        select: {
          decks: {
            where: { deckType: 'SCENE_ATLAS' },
            select: {
              id: true,
              cards: {
                orderBy: [{ suit: 'asc' }, { rank: 'asc' }],
                select: {
                  id: true,
                  suit: true,
                  rank: true,
                  promptTitle: true,
                  promptText: true,
                  bindings: {
                    where: { authorActorId: playerId, status: 'active' },
                    take: 1,
                    select: {
                      bar: { select: { id: true, title: true, visibility: true, creatorId: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const deck = instance?.deckLibrary?.decks[0]
  if (!deck) {
    return { ok: false, reason: 'not_found' }
  }

  const order = orderedSuitKeys()
  const cardsBySuit: Record<string, SceneGridCardView[]> = {}
  for (const k of order) {
    cardsBySuit[k] = []
  }

  let filledCount = 0
  for (const c of deck.cards) {
    const b = c.bindings[0]?.bar
    let boundBar: { id: string; title: string } | null = null
    if (b && b.creatorId === playerId && (b.visibility === 'private' || b.visibility === 'public')) {
      boundBar = { id: b.id, title: b.title }
      filledCount++
    }
    const suitKey = c.suit as SceneGridSuitKey
    const rowLabel = rowLabels[suitKey] ?? c.suit
    const row: SceneGridCardView = {
      id: c.id,
      suit: c.suit,
      rank: c.rank,
      promptTitle: c.promptTitle,
      promptText: c.promptText,
      rowLabel,
      displayTitle: cardDisplayTitle(suitKey, c.rank, polarities),
      boundBar,
    }
    if (!cardsBySuit[c.suit]) cardsBySuit[c.suit] = []
    cardsBySuit[c.suit].push(row)
  }

  for (const k of order) {
    cardsBySuit[k].sort((a, b) => a.rank - b.rank)
  }

  return {
    ok: true,
    deckId: deck.id,
    instance: { id: instance.id, slug: instance.slug, name: instance.name },
    polarities,
    cardsBySuit,
    orderedSuits: order,
    filledCount,
    dailySceneAtlas,
  }
}
