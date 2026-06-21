/**
 * Need → AllyshipCard view mapping (Mobility Quest design handoff).
 * Pure: turns a deck card + a milestone need (+ the deck-derived labels/element)
 * into the `{ card, mod, status }` contract AllyshipCard consumes. No I/O, no AI.
 */
import type { MoveCard } from '../allyship-deck/types'
import { MOVE_ELEMENT, MOVE_LABELS, OPERATION_LABELS, DOMAIN_LABELS } from '../allyship-deck/card-visuals'
import { SUPERPOWER_DEFS, type Superpower, type SuperpowerOrientation } from './types'
import { translateCardForSuperpower } from './translate'
import type {
  AllyshipCardData,
  AllyshipCardMod,
  CardStatus,
  DomainKey,
  MoveKey,
} from '@/components/superpowers/AllyshipCard'

/** Vibeulon yield is not authored on deck cards yet — a stable default. */
const DEFAULT_YIELD = 2

const MOVE_KEY: Record<MoveCard['move'], MoveKey> = {
  wake_up: 'wake',
  open_up: 'open',
  clean_up: 'clean',
  grow_up: 'grow',
  show_up: 'show',
}

const DOMAIN_KEY: Record<MoveCard['domain'], DomainKey> = {
  GATHERING_RESOURCES: 'gather',
  RAISE_AWARENESS: 'aware',
  DIRECT_ACTION: 'direct',
  SKILLFUL_ORGANIZING: 'organize',
}

/** The minimal need shape this mapping needs (engine need or DB row). */
export interface NeedLike {
  id: string
  superpower: Superpower
  orientation: SuperpowerOrientation
  cardId: string
  unit: 'action' | 'currency' | 'hours'
  value: number
  status: 'open' | 'claimed' | 'done'
  claimedByPlayerId?: string | null
  title?: string | null
}

export interface NeedView {
  id: string
  card: AllyshipCardData
  mod: AllyshipCardMod
  status: CardStatus
}

/** Short ask label, e.g. "$50", "2 hrs", "1 action". Never a per-action score. */
export function formatAsk(unit: NeedLike['unit'], value: number): string {
  if (unit === 'currency') return `$${value}`
  if (unit === 'hours') return `${value} hr${value === 1 ? '' : 's'}`
  return '1 action'
}

/** Map need.status (+ ownership/auth) → the card's visual status. */
export function resolveCardStatus(
  status: NeedLike['status'],
  opts: { mine: boolean; signedIn: boolean },
): CardStatus {
  if (status === 'done') return 'done'
  if (status === 'claimed') return opts.mine ? 'mine' : 'taken'
  return opts.signedIn ? 'open' : 'signedout'
}

export function buildCardData(deckCard: MoveCard): AllyshipCardData {
  const move = MOVE_KEY[deckCard.move]
  return {
    id: deckCard.id,
    num: deckCard.num,
    title: deckCard.title,
    move,
    moveLabel: MOVE_LABELS[deckCard.move],
    face: deckCard.operation,
    faceLabel: OPERATION_LABELS[deckCard.operation],
    el: MOVE_ELEMENT[deckCard.move],
    domain: DOMAIN_KEY[deckCard.domain],
    domainLabel: DOMAIN_LABELS[deckCard.domain],
    q: deckCard.primaryQuestion,
    yield: DEFAULT_YIELD,
  }
}

export function buildMod(deckCard: MoveCard, need: NeedLike): AllyshipCardMod {
  const t = translateCardForSuperpower(deckCard, need.superpower, need.orientation)
  return {
    spKey: need.superpower,
    spLabel: SUPERPOWER_DEFS[need.superpower].label,
    contribution: need.title?.trim() || t.prompt,
    artifact: t.suggestedArtifact,
    ask: formatAsk(need.unit, need.value),
    internal: need.orientation === 'internal',
  }
}

/** Full view for one need. `deckCard` is looked up by `need.cardId` by the caller. */
export function buildNeedView(
  deckCard: MoveCard,
  need: NeedLike,
  opts: { mine: boolean; signedIn: boolean },
): NeedView {
  return {
    id: need.id,
    card: buildCardData(deckCard),
    mod: buildMod(deckCard, need),
    status: resolveCardStatus(need.status, opts),
  }
}
