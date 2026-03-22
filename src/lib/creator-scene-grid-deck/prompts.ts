import {
  rankLabel,
  type SceneGridSuitKey,
  SCENE_GRID_SUITS,
} from '@/lib/creator-scene-grid-deck/suits'

export interface CardPrompt {
  promptTitle: string
  promptText: string
  metadata: Record<string, unknown>
}

function suitMeta(suit: SceneGridSuitKey) {
  const def = SCENE_GRID_SUITS.find((s) => s.key === suit)
  return {
    gridDeck: true,
    axis: def?.axis ?? null,
    suitLabel: def?.label ?? suit,
    suitShort: def?.short ?? suit,
  }
}

/**
 * Neutral, structural prompts — safe defaults for any creative planning use case.
 */
export function buildSceneGridCardPrompt(suit: SceneGridSuitKey, rank: number): CardPrompt {
  const rl = rankLabel(rank)
  const sm = suitMeta(suit)
  const title = `${sm.suitLabel} · ${rl}`

  const body = [
    `**Your task:** Create a BAR that answers this cell. In Vault terms, that means a title plus notes — the BAR is the artifact; this text is the prompt that shapes it.`,
    `**Answer (${rl}):** In one line, what belongs in this slot for you right now? (That line can become your BAR title.)`,
    `**Notes:** What would you write in the BAR body so Future You knows what this cell meant — boundary, commitment, feeling, or next check?`,
    `**Done means:** When you save the BAR to this card, you’ve “answered” the cell for this pass through the deck.`,
  ].join('\n\n')

  return {
    promptTitle: title,
    promptText: body,
    metadata: {
      ...sm,
      rank,
      rankLabel: rl,
      playingCard: { rank, note: 'Maps to 52-card grid: 4 suits × 13 ranks.' },
    },
  }
}

export function allSceneGridPrompts(): Array<{ suit: SceneGridSuitKey; rank: number } & CardPrompt> {
  const out: Array<{ suit: SceneGridSuitKey; rank: number } & CardPrompt> = []
  for (const { key } of SCENE_GRID_SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      const p = buildSceneGridCardPrompt(key, rank)
      out.push({ suit: key, rank, ...p })
    }
  }
  return out
}
