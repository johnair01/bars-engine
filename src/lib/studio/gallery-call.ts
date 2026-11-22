/** A call for more, from the Stores' empty place (six-faces-council council/callsheets/asset-gallery.md; his A on
 * ag-who-triggers-spend: "my tap is my yes, under the cap", and on ag-floor-look-1). A call is a placement under the
 * gallery's run key: docId `call~<hole id>`, kind `call`, to `bell` (the thread goes up the bell line). Its price is the
 * planned row's own, printed on the card before the tap (ag-call-is-priced-row). The month's dollars come from the
 * calls already open, claimed or returned; one that would pass the cap lands `held_at_cap` and spends nothing. Pure. */
import { dayOf, placementId, type Placement } from './stores'

export const CALL_CAP_DOLLARS = 30
export type CallState = 'open' | 'claimed' | 'returned' | 'held_at_cap'
export type CallPrice = { tokens: number; dollars: number }
/** A saved call as the `stores` collection holds it. `crate` is the first 16 hex of the returned crate's sha. */
export type CallDoc = Placement & { price?: CallPrice; state?: CallState; crate?: string }

/** A call's docId, built the way a placement's is. */
export const callId = (holeId: string) => placementId('call', holeId)
export const monthOf = (iso: string) => dayOf(iso).slice(0, 7)

/** The calls among a `stores` collection, by hole id. */
export function callsOf(placed: Record<string, Placement>): Record<string, CallDoc> {
  const out: Record<string, CallDoc> = {}
  for (const [k, v] of Object.entries(placed)) if (k.startsWith('call~') && v?.kind === 'call') out[v.thing ?? k.slice(5)] = v as CallDoc
  return out
}

/** Dollars already committed this Pacific month: every call that is not held at the cap. */
export function spentThisMonth(calls: Record<string, CallDoc>, now: Date): number {
  const m = monthOf(now.toISOString())
  return Object.values(calls).reduce((sum, c) =>
    c.state && c.state !== 'held_at_cap' && c.savedAt && monthOf(c.savedAt) === m ? sum + (c.price?.dollars ?? 0) : sum, 0)
}

export function decideCall(price: CallPrice, spent: number, cap = CALL_CAP_DOLLARS): CallState {
  return spent + (price.dollars || 0) <= cap + 1e-9 ? 'open' : 'held_at_cap'
}

export function callDoc(hole: { id: string; name: string; price: CallPrice }, state: CallState, now: Date): Record<string, unknown> {
  return { run: 'gallery', thing: hole.id, kind: 'call', words: hole.name, to: 'bell', price: hole.price, state, savedAt: now.toISOString() }
}

/** What the card says once the tap is answered. */
export function callWords(state: CallState, price: CallPrice, spent: number): string {
  const dollars = Math.round((spent + (state === 'open' ? price.dollars : 0)) * 100) / 100
  return state === 'open'
    ? `It went up the bell line. This month: $${dollars} of $${CALL_CAP_DOLLARS}.`
    : `This would pass your $${CALL_CAP_DOLLARS} for the month, so it waits for you. Nothing was spent.`
}
