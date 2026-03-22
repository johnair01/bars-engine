import { db } from '@/lib/db'
import type { SceneGridCardView } from '@/lib/creator-scene-grid-deck/load-deck-view'
import { parseIdArray } from '@/lib/prompt-deck/cycle-logic'
import { rankToPromptMove, type PromptMoveFamily } from '@/lib/prompt-deck/rank-move-map'

export const PROMPT_HAND_MAX = 5

export type PromptHandCardView = {
  id: string
  suit: string
  rank: number
  promptTitle: string
  displayTitle: string
  moveFamily: PromptMoveFamily
}

export type PromptDeckPlaySnapshot = {
  hand: PromptHandCardView[]
  drawCount: number
  discardCount: number
  handSize: number
  handMax: number
}

function cardMapFromGrid(cardsBySuit: Record<string, SceneGridCardView[]>): Map<string, SceneGridCardView> {
  const m = new Map<string, SceneGridCardView>()
  for (const row of Object.values(cardsBySuit)) {
    for (const c of row) m.set(c.id, c)
  }
  return m
}

/** Server-only: current global hand + this deck’s draw/discard counts for Scene Atlas UI. */
export async function loadPromptDeckPlaySnapshot(
  playerId: string,
  deckId: string,
  cardsBySuit: Record<string, SceneGridCardView[]>
): Promise<PromptDeckPlaySnapshot> {
  const map = cardMapFromGrid(cardsBySuit)

  const [handRow, cycleRow] = await Promise.all([
    db.playerPromptHand.findUnique({
      where: { playerId },
      select: { handCardIds: true },
    }),
    db.promptDeckCycle.findUnique({
      where: { playerId_deckId: { playerId, deckId } },
      select: { drawCardIds: true, discardCardIds: true },
    }),
  ])

  const handIds = parseIdArray(handRow?.handCardIds)
  const hand: PromptHandCardView[] = []

  for (const id of handIds) {
    let c = map.get(id)
    if (!c) {
      const dbCard = await db.barDeckCard.findUnique({
        where: { id },
        select: { id: true, suit: true, rank: true, promptTitle: true },
      })
      if (!dbCard) continue
      c = {
        id: dbCard.id,
        suit: dbCard.suit,
        rank: dbCard.rank,
        promptTitle: dbCard.promptTitle,
        promptText: '',
        rowLabel: dbCard.suit,
        displayTitle: `${dbCard.suit} · ${dbCard.rank}`,
        boundBar: null,
      }
    }
    const rm = rankToPromptMove(c.rank)
    const moveFamily: PromptMoveFamily = rm?.family ?? 'wild'
    hand.push({
      id: c.id,
      suit: c.suit,
      rank: c.rank,
      promptTitle: c.promptTitle,
      displayTitle: c.displayTitle,
      moveFamily,
    })
  }

  const drawCount = parseIdArray(cycleRow?.drawCardIds).length
  const discardCount = parseIdArray(cycleRow?.discardCardIds).length

  return {
    hand,
    drawCount,
    discardCount,
    handSize: hand.length,
    handMax: PROMPT_HAND_MAX,
  }
}
