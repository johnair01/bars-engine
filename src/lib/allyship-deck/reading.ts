import type { AllyshipDomain, BasicMove, MoveCard, Operation } from './types'

export type FlavorId = 'sadness' | 'anger' | 'fear' | 'numbness' | 'restlessness'
export type ReadingChoice = { move: BasicMove; domain: AllyshipDomain }
export type ReadingInput = { face: Operation; flavor: FlavorId; choices: ReadingChoice[] }
export type SpreadSlot = 'situation' | 'block' | 'move'

export const FLAVOR_MOVES: Record<FlavorId, BasicMove> = {
  sadness: 'clean_up', anger: 'show_up', fear: 'open_up', numbness: 'wake_up', restlessness: 'grow_up',
}
export const SLOT_BIASES: Record<SpreadSlot, BasicMove[]> = {
  situation: ['wake_up'], block: ['clean_up'], move: ['show_up', 'grow_up', 'open_up'],
}

function score(card: MoveCard, input: ReadingInput, bias: BasicMove[]) {
  let weight = card.operation === input.face ? 3 : 0
  if (bias.includes(card.move)) weight += 6
  for (const choice of input.choices) {
    if (card.move === choice.move) weight += 2
    if (card.domain === choice.domain) weight += 1
  }
  if (card.move === FLAVOR_MOVES[input.flavor]) weight += 2
  return weight
}

export function recommendSpread(cards: MoveCard[], input: ReadingInput): [MoveCard, MoveCard, MoveCard] {
  const used = new Set<string>()
  const picks = (Object.keys(SLOT_BIASES) as SpreadSlot[]).map((slot) => {
    const next = cards.filter((card) => !used.has(card.id)).map((card) => ({ card, score: score(card, input, SLOT_BIASES[slot]) }))
      .sort((a, b) => b.score - a.score || cards.indexOf(a.card) - cards.indexOf(b.card))[0]?.card
    if (!next) throw new Error('Deck does not contain enough cards for a spread')
    used.add(next.id)
    return next
  })
  return picks as [MoveCard, MoveCard, MoveCard]
}

export function replaceSpreadSlot(cards: MoveCard[], input: ReadingInput, spread: [MoveCard, MoveCard, MoveCard], slot: SpreadSlot): [MoveCard, MoveCard, MoveCard] {
  const index = slot === 'situation' ? 0 : slot === 'block' ? 1 : 2
  const held = new Set(spread.filter((_, itemIndex) => itemIndex !== index).map((card) => card.id))
  const replacement = cards.filter((card) => !held.has(card.id)).map((card) => ({ card, score: score(card, input, SLOT_BIASES[slot]) }))
    .sort((a, b) => b.score - a.score || cards.indexOf(a.card) - cards.indexOf(b.card))[0]?.card
  if (!replacement) throw new Error('No replacement card is available')
  const next = [...spread] as [MoveCard, MoveCard, MoveCard]
  next[index] = replacement
  return next
}
