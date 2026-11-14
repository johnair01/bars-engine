import type { CloseRecord, Item, Safety } from './types'

/** Why a piece of work is not safe for Zo to run tonight (FR-005); empty when it is. */
export function unsafeReasons(s: Safety): string[] {
  const why: string[] = []
  if (!s.reversible) why.push('it cannot be undone')
  if (!s.oneLane) why.push('it spans more than one lane')
  if (!s.endsInPrOrRow) why.push('it does not end in a pull request or board row')
  if (s.merges) why.push('it merges')
  if (s.spend) why.push('it spends money')
  if (s.outreach) why.push('it sends outreach')
  if (s.touchesFaces) why.push('it changes council/faces.yaml')
  if (!s.nextOwner) why.push('its brief has no "Next owner + wake:"')
  return why
}

/** A red check anywhere in the day: the close refuses the label "safe to run tonight" for everything (FR-004). */
export function dayHasRed(r: Pick<CloseRecord, 'items'>): boolean {
  return r.items.some(i => i.check === 'red')
}

export function safeTonight(r: Pick<CloseRecord, 'items'>, s: Safety): boolean {
  return !dayHasRed(r) && unsafeReasons(s).length === 0
}

export interface Hulls { ready: Item[]; tonight: Item[]; wins: Item[]; momentum: Item[]; unsealed: number; refused: string | null }

/** Only sealed work shows (lading-seal): an item with no proof link is left out and counted. */
export function hullsOf(r: Pick<CloseRecord, 'items'>): Hulls {
  const sealed = r.items.filter(i => !!i.proof)
  const refused = dayHasRed(r) ? 'a check is red, so nothing is safe to run tonight' : null
  const next = sealed.filter(i => i.stage === 'next')
  return {
    wins: sealed.filter(i => i.stage === 'done' && i.check !== 'red'),
    momentum: sealed.filter(i => i.stage === 'doing'),
    tonight: next.filter(i => safeTonight(r, i)),
    ready: next.filter(i => !safeTonight(r, i)),
    unsealed: r.items.length - sealed.length,
    refused,
  }
}
