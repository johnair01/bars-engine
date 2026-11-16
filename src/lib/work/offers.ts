import type { PrismaClient, Prisma } from '@prisma/client'
import { isLane, LANES, type Lane } from './lanes'
import { laneState, steerTicket } from './queue'

type Db = PrismaClient | Prisma.TransactionClient

/** One lane as laneState reports it; the offer needs only these fields. */
export interface LaneRow { lane: string; status: 'live' | 'quiet' | 'dry'; claims24h: number }

/**
 * Lanes that may receive a suggested move. Zo is the night crew and takes only what the closing ritual hands it, and
 * DeepAI opens only when a ticket names it, so neither is ever suggested as a place to send waiting cards.
 */
export const OFFER_TARGETS: Lane[] = ['claude', 'freebuff']

/**
 * Pure: the lane to offer, or null. It must be live (claimed within 24 hours), never the quiet lane itself. Freebuff is
 * the row's wording (`lane-routing-1`, his A), so it wins whenever it is live; otherwise the live lane with the most
 * claims in the last day, so a dead Freebuff is never offered as the destination.
 */
export function pickTarget(from: string, lanes: LaneRow[]): Lane | null {
  const live = lanes.filter(l => l.status === 'live' && l.lane !== from && (OFFER_TARGETS as string[]).includes(l.lane))
  if (!live.length) return null
  const fb = live.find(l => l.lane === 'freebuff')
  if (fb) return 'freebuff'
  return live.sort((a, b) => b.claims24h - a.claims24h)[0].lane as Lane
}

/**
 * Pure: a card the offer may move. Only a ready card; a held card (a compost pass or his own hold) never moves, and a
 * card with a `steered` mark in its basis was placed by hand (his drag, his steer, a council steer) and never moves.
 */
export function movable(t: { state: string; basis: unknown }): boolean {
  if (t.state !== 'ready') return false
  const steered = ((t.basis ?? {}) as { steered?: unknown }).steered
  return !steered
}

export interface Offer { from: string; to: Lane; count: number; targetLine: string }

/** The one-tap offers now: a quiet lane with movable waiting cards, and a live lane to take them. Counts only. */
export async function laneOffers(db: Db, now = new Date()): Promise<{ offers: Offer[]; lanes: LaneRow[] }> {
  const lanes = (await laneState(db, LANES, now)) as LaneRow[]
  const offers: Offer[] = []
  for (const l of lanes) {
    if (l.status !== 'quiet') continue
    const to = pickTarget(l.lane, lanes)
    if (!to) continue
    const waiting = await db.workTicket.findMany({ where: { lane: l.lane, state: 'ready' }, select: { id: true, state: true, basis: true } })
    const count = waiting.filter(movable).length
    if (count) offers.push({ from: l.lane, to, count, targetLine: `Move these to ${to === 'freebuff' ? 'Freebuff' : 'Claude'}` })
  }
  return { offers, lanes }
}

/**
 * His tap: move the movable ready cards of a quiet lane to a live one. Recomputed here, so a lane that woke since the
 * offer was drawn, or a target that went quiet, moves nothing. Each card goes through steerTicket, so the card keeps its
 * other lanes and carries the steer mark in its basis (`by: 'offer'`), which stops a second offer from moving it again.
 */
export async function applyOffer(db: Db, from: string, to: string, by: string, now = new Date()) {
  if (!isLane(from) || !isLane(to)) return { ok: false as const, status: 400, error: 'from and to must be lanes' }
  const { offers } = await laneOffers(db, now)
  const offer = offers.find(o => o.from === from && o.to === to)
  if (!offer) return { ok: false as const, status: 409, error: 'No such offer now: the lane is live again, the target is not live, or nothing is waiting' }
  const waiting = await db.workTicket.findMany({ where: { lane: from, state: 'ready' }, select: { id: true, state: true, basis: true } })
  let moved = 0
  for (const t of waiting.filter(movable)) {
    const r = await steerTicket(db, t.id, to, by, now)
    if (r.ok) moved++
  }
  return { ok: true as const, from, to, moved }
}
