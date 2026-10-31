import type { Prisma, PrismaClient } from '@prisma/client'
import { DRY_MS, firstLitLane, LEASE_MS } from './lanes'
import type { TicketDraft } from './ticket'

type Db = PrismaClient | Prisma.TransactionClient

export interface ClaimedTicket {
  id: string; title: string; brief: string; basis: unknown; lanes: string[]; lane: string
  claimedBy: string | null; leaseUntil: Date | null; attempts: number
}

/** The lanes whose lamp is out now. A dry mark past its dryUntil has lapsed and counts as lit. */
export async function dryLanes(db: Db, now = new Date()): Promise<Set<string>> {
  const rows = await db.workLane.findMany({ where: { dry: true } })
  return new Set(rows.filter(r => !r.dryUntil || r.dryUntil > now).map(r => r.lane))
}

/** Put a ticket in the queue: into the first lit lane of its order. A second push of the same answer is a no-op. */
export async function pushTicket(db: Db, t: TicketDraft) {
  const lane = firstLitLane(t.lanes, await dryLanes(db))
  const existing = await db.workTicket.findUnique({ where: { sourceKey: t.sourceKey } })
  if (existing) return { ticket: existing, created: false }
  const ticket = await db.workTicket.create({
    data: { sourceKey: t.sourceKey, title: t.title, brief: t.brief, basis: t.basis as object, lanes: t.lanes, lane },
  })
  return { ticket, created: true }
}

/** Lapsed leases go back to ready, so a worker that died mid-ticket never strands it. */
export async function returnLapsed(db: Db, now = new Date()): Promise<number> {
  const r = await db.workTicket.updateMany({
    where: { state: 'claimed', leaseUntil: { lt: now } },
    data: { state: 'ready', claimedBy: null, leaseUntil: null },
  })
  return r.count
}

/**
 * Claim the oldest ready ticket in a lane, inside one UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED), so two
 * workers in one lane never take the same ticket. Null when the lane's deck is empty.
 */
export async function claimTicket(db: Db, lane: string, by: string, now = new Date()): Promise<ClaimedTicket | null> {
  await returnLapsed(db, now)
  const until = new Date(now.getTime() + LEASE_MS)
  const rows = await db.$queryRaw<ClaimedTicket[]>`
    UPDATE "work_tickets" SET "state" = 'claimed', "claimed_by" = ${by}, "lease_until" = ${until},
      "attempts" = "attempts" + 1, "updated_at" = ${now}
    WHERE "id" = (
      SELECT "id" FROM "work_tickets" WHERE "lane" = ${lane} AND "state" = 'ready'
      ORDER BY "created_at" ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING "id", "title", "brief", "basis", "lanes", "lane", "claimed_by" AS "claimedBy",
      "lease_until" AS "leaseUntil", "attempts"`
  return rows[0] ?? null
}

type Move = 'heartbeat' | 'done' | 'release' | 'failed'

/** A worker's move on the ticket it holds. Only the lane that holds the claim may move it. */
export async function moveTicket(db: Db, id: string, lane: string | null, move: Move,
                                 result: string | null, now = new Date()) {
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (lane && t.lane !== lane) return { ok: false as const, status: 403, error: `This ticket is in the ${t.lane} lane` }
  if (t.state !== 'claimed') return { ok: false as const, status: 409, error: `The ticket is ${t.state}, not claimed` }
  const data: Prisma.WorkTicketUpdateInput =
    move === 'heartbeat' ? { leaseUntil: new Date(now.getTime() + LEASE_MS) }
    : move === 'done' ? { state: 'done', result, doneAt: now, leaseUntil: null }
    : move === 'failed' ? { state: 'failed', result, leaseUntil: null }
    : { state: 'ready', claimedBy: null, leaseUntil: null, result }
  const ticket = await db.workTicket.update({ where: { id }, data })
  return { ok: true as const, ticket }
}

/**
 * Mark a lane dry (its lamp out) or lit. Going dry passes its ready tickets to the next lit lane in each ticket's own
 * order; a ticket with no lit lane after it stays where it is and waits for the lamp.
 */
export async function setLaneDry(db: Db, lane: string, dry: boolean, note: string | null, now = new Date()) {
  const dryUntil = dry ? new Date(now.getTime() + DRY_MS) : null
  await db.workLane.upsert({ where: { lane }, create: { lane, dry, dryUntil, note }, update: { dry, dryUntil, note } })
  if (!dry) return { lane, dry, moved: 0 }
  const out = await dryLanes(db, now)
  const ready = await db.workTicket.findMany({ where: { lane, state: 'ready' }, select: { id: true, lanes: true } })
  let moved = 0
  for (const t of ready) {
    const after = t.lanes.slice(t.lanes.indexOf(lane) + 1).filter(l => !out.has(l))
    if (!after.length) continue
    await db.workTicket.update({ where: { id: t.id }, data: { lane: after[0] } })
    moved++
  }
  return { lane, dry, moved, dryUntil }
}

/** Each lane as the board draws it: lamp lit or out, and the height of its deck (ready) and crew's hands (claimed). */
export async function laneState(db: Db, lanes: readonly string[], now = new Date()) {
  const out = await dryLanes(db, now)
  const counts = await db.workTicket.groupBy({ by: ['lane', 'state'], where: { state: { in: ['ready', 'claimed'] } },
    _count: { _all: true } })
  return lanes.map(lane => ({
    lane, lit: !out.has(lane),
    deck: counts.find(c => c.lane === lane && c.state === 'ready')?._count._all ?? 0,
    held: counts.find(c => c.lane === lane && c.state === 'claimed')?._count._all ?? 0,
  }))
}
