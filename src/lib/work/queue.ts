import type { Prisma, PrismaClient } from '@prisma/client'
import { DRY_MS, firstLitLane, isLane, LANES, LANE_WORKERS, CAP_LIVE_MS, LEASE_MS, MAX_DRY_MS, routeLane } from './lanes'
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

/** Ready plus claimed, per lane: the number a ceiling is measured against, so a lane holding a crew's hands counts as full. */
export async function laneDepth(db: Db): Promise<Record<string, number>> {
  const rows = await db.workTicket.groupBy({ by: ['lane'], where: { state: { in: ['ready', 'claimed'] } }, _count: { _all: true } })
  return Object.fromEntries(rows.map(r => [r.lane, r._count._all]))
}

/**
 * Put a ticket in the queue: into the first lane of its order that is lit and under the ceiling, else the
 * lit lane with the shortest deck. A second push of the same answer is a no-op.
 */
export async function pushTicket(db: Db, t: TicketDraft) {
  const dry = await dryLanes(db)
  const lit = new Set(LANES.filter(l => !dry.has(l)))
  const lane = routeLane(t.lanes, lit, await laneDepth(db))?.lane ?? firstLitLane(t.lanes, dry)
  const existing = await db.workTicket.findUnique({ where: { sourceKey: t.sourceKey } })
  if (existing) return { ticket: existing, created: false }
  const ticket = await db.workTicket.create({
    data: { sourceKey: t.sourceKey, title: t.title, brief: t.brief, basis: t.basis as object, lanes: t.lanes, lane,
      ...(t.state === 'held' ? { state: 'held' } : {}) },
  })
  return { ticket, created: true }
}

/** A ticket claimed this many times without ever being closed stops coming back: it is held with a reason instead. */
export const MAX_ATTEMPTS = 3
export const AUTO_HELD = 'auto-held'

/**
 * Lapsed leases go back to ready, so a worker that died mid-ticket never strands it. A ticket whose lease has lapsed
 * MAX_ATTEMPTS times is held instead, with a result naming why (2026-11-18: the hourly pickup claimed the same twenty
 * tickets every two hours because nothing closed them; a lapse is the proof nobody did). A held ticket waits for an
 * unhold or a steer from the board; it is not announced again.
 */
export async function returnLapsed(db: Db, now = new Date()): Promise<number> {
  const lapsed = { state: 'claimed', leaseUntil: { lt: now } }
  const stalled = await db.workTicket.updateMany({
    where: { ...lapsed, attempts: { gte: MAX_ATTEMPTS } },
    data: { state: 'held', claimedBy: null, leaseUntil: null,
      result: `${AUTO_HELD}: claimed ${MAX_ATTEMPTS} times and never closed. Lift the hold or steer it from the board.` },
  })
  // A READY ticket already past the limit (released before the circuit breaker existed, found 2026-11-21: twenty
  // tickets at 90 to 106 claims sat at the head of the oldest-first deck, so every worker took one and ended with
  // nothing, and the 16 newer tickets never reached a lane) is held too, so it stops heading the deck.
  const stale = await db.workTicket.updateMany({
    where: { state: 'ready', attempts: { gte: MAX_ATTEMPTS } },
    data: { state: 'held', claimedBy: null, leaseUntil: null,
      result: `${AUTO_HELD}: claimed ${MAX_ATTEMPTS} or more times and never closed. Lift the hold or steer it from the board.` },
  })
  const r = await db.workTicket.updateMany({
    where: lapsed,
    data: { state: 'ready', claimedBy: null, leaseUntil: null },
  })
  return r.count + stalled.count + stale.count
}

/**
 * Claim the oldest ready ticket in a lane (or the one named by `id`, if it is ready in that lane), inside one UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED), so two
 * workers in one lane never take the same ticket. Null when the lane's deck is empty.
 */
export async function claimTicket(db: Db, lane: string, by: string, now = new Date(), id?: string): Promise<ClaimedTicket | null> {
  await returnLapsed(db, now)
  // A lane holds at most LANE_WORKERS live claims; the settle pass claims only to close, so it is not counted out.
  if (by !== 'settle') {
    const live = await db.workTicket.count({ where: { lane, state: 'claimed', leaseUntil: { gte: now },
      updatedAt: { gte: new Date(now.getTime() - CAP_LIVE_MS) } } })
    if (live >= LANE_WORKERS) return null
  }
  const until = new Date(now.getTime() + LEASE_MS)
  // With an id, only that ticket may be taken (still ready, still in this lane); otherwise the lane's oldest.
  const rows = await db.$queryRaw<ClaimedTicket[]>`
    UPDATE "work_tickets" SET "state" = 'claimed', "claimed_by" = ${by}, "lease_until" = ${until},
      "attempts" = "attempts" + 1, "updated_at" = ${now}
    WHERE "id" = (
      SELECT "id" FROM "work_tickets" WHERE "lane" = ${lane} AND "state" = 'ready'
        AND (${id ?? null}::text IS NULL OR "id" = ${id ?? null}::text)
      ORDER BY "created_at" ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING "id", "title", "brief", "basis", "lanes", "lane", "claimed_by" AS "claimedBy",
      "lease_until" AS "leaseUntil", "attempts"`
  return rows[0] ?? null
}

type Move = 'heartbeat' | 'done' | 'release' | 'failed'

/** Lift a hold: a held ticket goes back to ready, in the lane it rests in. Any other state is left alone. */
export async function unholdTicket(db: Db, id: string) {
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (t.state !== 'held') return { ok: false as const, status: 409, error: `The ticket is ${t.state}, not held` }
  const ticket = await db.workTicket.update({ where: { id }, data: { state: 'ready', attempts: 0, result: null } })
  return { ok: true as const, ticket }
}

/**
 * Close a ticket the work behind it is already done for, whatever state it rests in (held, failed, ready or claimed).
 * Found 2026-11-19: a held or failed ticket answers `release` and `done` with 409, so a ticket built by hand stayed in
 * the queue for good. Council only. Needs a result (a pull request link, or one line saying no code was needed); a
 * pull request link is kept as `basis.draft`, as `done` does. A ticket already done is left alone.
 */
export async function closeTicket(db: Db, id: string, result: string, by: string, now = new Date()) {
  if (!result.trim()) return { ok: false as const, status: 400, error: 'close needs a result: the pull request link, or one line saying no code was needed' }
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (t.state === 'done') return { ok: false as const, status: 409, error: 'The ticket is already done' }
  const pr = result.match(/https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/)
  const basis = { ...((t.basis ?? {}) as object), closed: { by, at: now.toISOString(), from: t.state },
    ...(pr ? { draft: { url: pr[0], label: `${pr[2]} #${pr[3]}` } } : {}) }
  const ticket = await db.workTicket.update({ where: { id }, data: {
    state: 'done', result, doneAt: now, leaseUntil: null, basis: basis as Prisma.InputJsonValue } })
  return { ok: true as const, ticket }
}

/**
 * Return a failed ticket to the deck, but only through a review. The move carries the name of the after-action
 * review that explains the failure (`aar`, a path or a link), and the failure it replaces is appended to the
 * basis so the retry does not erase what went wrong. A ticket that was not failed is left alone: `release`
 * already gives a held one back, and nothing else needs a second run.
 */
export async function retryTicket(db: Db, id: string, aar: string, by: string, now = new Date()) {
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (t.state !== 'failed') return { ok: false as const, status: 409, error: `The ticket is ${t.state}, not failed` }
  const basis = (t.basis ?? {}) as Record<string, unknown>
  const attempts = Array.isArray(basis.attempts) ? (basis.attempts as unknown[]) : []
  const past = [...attempts, { at: now.toISOString(), by, aar, failed: t.result ?? null }]
  const ticket = await db.workTicket.update({ where: { id }, data: {
    state: 'ready', claimedBy: null, leaseUntil: null, result: null, attempts: 0,
    basis: { ...basis, attempts: past } as Prisma.InputJsonValue,
  } })
  return { ok: true as const, ticket }
}

/**
 * Steer a ticket he has not started: a ready or held ticket goes to another lane (`to` a lane name) or is held back
 * (`to` 'hold'). The ticket keeps its other lanes after the one it is steered to, so a dry lane still hands it on. A
 * claimed, done or failed ticket is left alone: its crew holds it, and the crew's own `release` gives it back. Fleet
 * by altitude, his A + C on fleet-altitude-look-1 (2026-11-13). Both the harbour page and the MCP tool come here.
 */
export async function steerTicket(db: Db, id: string, to: string, by: string, now = new Date()) {
  if (to !== 'hold' && !isLane(to)) return { ok: false as const, status: 400, error: `to must be hold or one of ${LANES.join(', ')}` }
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (t.state !== 'ready' && t.state !== 'held') return { ok: false as const, status: 409, error: `The ticket is ${t.state}; only a ready or held ticket can be steered` }
  const basis = { ...((t.basis ?? {}) as object), steered: { to, by, at: now.toISOString(), from: t.lane } }
  const data: Prisma.WorkTicketUpdateInput = to === 'hold'
    ? { state: 'held', claimedBy: null, leaseUntil: null, basis }
    : { state: 'ready', lane: to, lanes: [to, ...t.lanes.filter(l => l !== to)], claimedBy: null, leaseUntil: null, basis }
  const ticket = await db.workTicket.update({ where: { id }, data })
  return { ok: true as const, ticket }
}

/** A worker's move on the ticket it holds. Only the lane that holds the claim may move it. */
export async function moveTicket(db: Db, id: string, lane: string | null, move: Move,
                                 result: string | null, now = new Date(), look: string | null = null, hold = false) {
  const t = await db.workTicket.findUnique({ where: { id } })
  if (!t) return { ok: false as const, status: 404, error: 'No such ticket' }
  if (lane && t.lane !== lane) return { ok: false as const, status: 403, error: `This ticket is in the ${t.lane} lane` }
  if (t.state !== 'claimed') return { ok: false as const, status: 409, error: `The ticket is ${t.state}, not claimed` }
  // `look` is the board row of the look this voyage brought home (homeport FR-006); the ring reads it from the basis.
  // A ticket does not finish silently: `done` carries its result, a pull request link or a note. A pull request link
  // is also kept as `basis.draft`, which the harbour's steer card shows.
  if (move === 'done' && !(result ?? '').trim()) {
    return { ok: false as const, status: 400, error: 'done needs a result: the pull request link, or one line saying no code was needed' }
  }
  const pr = move === 'done' ? (result ?? '').match(/https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/) : null
  const draft = pr ? { url: pr[0], label: `${pr[2]} #${pr[3]}` } : null
  const basis = (look || draft) && move === 'done'
    ? { ...((t.basis ?? {}) as object), ...(look ? { look } : {}), ...(draft ? { draft } : {}) } : undefined
  const data: Prisma.WorkTicketUpdateInput =
    move === 'heartbeat' ? { leaseUntil: new Date(now.getTime() + LEASE_MS) }
    : move === 'done' ? { state: 'done', result, doneAt: now, leaseUntil: null, ...(basis ? { basis } : {}) }
    : move === 'failed' ? { state: 'failed', result, leaseUntil: null }
    : move === 'release' && hold && (result ?? '').trim()
      // A hold with a reason sticks: the ticket rests (not re-claimed, not re-announced) until an unhold move.
      ? { state: 'held', claimedBy: null, leaseUntil: null, result,
          basis: { ...((t.basis ?? {}) as object), hold: { reason: (result ?? '').trim(), by: t.claimedBy, at: now.toISOString() } } as Prisma.InputJsonValue }
    : move === 'release' && t.attempts >= MAX_ATTEMPTS
      // The circuit breaker for a plain release. returnLapsed holds a ticket only when its lease lapses, so a worker
      // that claimed and released the same ticket every hour never lapsed it: one ticket reached 106 claims
      // (found 2026-11-20). A ticket released after MAX_ATTEMPTS claims rests held until an unhold or a steer.
      ? { state: 'held', claimedBy: null, leaseUntil: null,
          result: `${AUTO_HELD}: claimed ${t.attempts} times and released without a result (last: ${(result ?? '').trim().slice(0, 120) || 'no note'}). Lift the hold or steer it from the board.` }
    : { state: 'ready', claimedBy: null, leaseUntil: null, result }
  const ticket = await db.workTicket.update({ where: { id }, data })
  return { ok: true as const, ticket }
}

/**
 * Mark a lane dry (its lamp out) or lit. Going dry passes its ready tickets to the next lit lane in each ticket's own
 * order; a ticket with no lit lane after it stays where it is and waits for the lamp.
 *
 * Going dry returns lapsed leases first. A lane whose usage ran out holds the tickets its last worker abandoned, and
 * the only other sweep runs inside claimTicket — which a dry lane never gets, so those tickets were unreachable for
 * good: not in its deck, not in the next lane's, and no claim would ever return them (found 2026-11-11: 35 stranded).
 */
export async function setLaneDry(db: Db, lane: string, dry: boolean, note: string | null, now = new Date(),
                                 until: Date | null = null) {
  // The renewal gate: when the lamp comes back on. Default five hours; he can name the hour instead, so a lane whose
  // usage is out overnight stays out until the morning rather than relighting at 3 a.m. and filling again.
  const dryUntil = !dry ? null
    : until && until > now ? new Date(Math.min(until.getTime(), now.getTime() + MAX_DRY_MS)) : new Date(now.getTime() + DRY_MS)
  await db.workLane.upsert({ where: { lane }, create: { lane, dry, dryUntil, note }, update: { dry, dryUntil, note } })
  if (!dry) return { lane, dry, moved: 0 }
  await returnLapsed(db, now)
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

/** A heartbeat: the note and the time on the lane's row. The lamp (dry, dryUntil) is left exactly as it is. */
export async function beatLane(db: Db, lane: string, note: string, now = new Date()) {
  await db.workLane.upsert({ where: { lane }, create: { lane, note, updatedAt: now }, update: { note, updatedAt: now } })
  return { lane, note, beatAt: now.toISOString() }
}

/** The orchestrator tick's last beat (lane row `tick`): when it ran and its note. Null before the first run. */
export async function tickBeat(db: Db) {
  const row = await db.workLane.findUnique({ where: { lane: 'tick' }, select: { note: true, updatedAt: true } })
  return row?.note != null ? { beatAt: row.updatedAt.toISOString(), beatNote: row.note } : null
}

/** A lane counts as live when it touched a ticket inside this window. */
export const LIVE_MS = 24 * 60 * 60 * 1000

export type LaneStatus = 'live' | 'quiet' | 'dry'

/**
 * Pure: whether a lane is accepting work. Dry (lamp out) wins; a lit lane is live when it claimed or finished a ticket
 * inside the window, and quiet when its lamp is lit but nothing has touched it, which is how a lane looks when its
 * crew never started.
 */
export function laneStatus(lit: boolean, lastClaimAt: Date | null, now = new Date()): LaneStatus {
  if (!lit) return 'dry'
  return lastClaimAt && now.getTime() - lastClaimAt.getTime() <= LIVE_MS ? 'live' : 'quiet'
}

/** Each lane as the board draws it: lamp lit or out, and the height of its deck (ready) and crew's hands (claimed). */
export async function laneState(db: Db, lanes: readonly string[], now = new Date()) {
  const out = await dryLanes(db, now)
  const counts = await db.workTicket.groupBy({ by: ['lane', 'state'], where: { state: { in: ['ready', 'claimed'] } },
    _count: { _all: true } })
  // A ticket with a claimant has been taken by someone; its updatedAt moves on claim, heartbeat and done.
  const since = new Date(now.getTime() - LIVE_MS)
  const touched = await db.workTicket.groupBy({ by: ['lane'], where: { claimedBy: { not: null } },
    _max: { updatedAt: true } })
  const recent = await db.workTicket.groupBy({ by: ['lane'], where: { claimedBy: { not: null }, updatedAt: { gte: since } },
    _count: { _all: true } })
  const rows = await db.workLane.findMany({ select: { lane: true, note: true, updatedAt: true } })
  return lanes.map(lane => {
    const beat = rows.find(r => r.lane === lane)
    const lastClaimAt = touched.find(t => t.lane === lane)?._max?.updatedAt ?? null
    const lit = !out.has(lane)
    return {
      lane, lit,
      deck: counts.find(c => c.lane === lane && c.state === 'ready')?._count._all ?? 0,
      held: counts.find(c => c.lane === lane && c.state === 'claimed')?._count._all ?? 0,
      lastClaimAt: lastClaimAt ? lastClaimAt.toISOString() : null,
      claims24h: recent.find(t => t.lane === lane)?._count._all ?? 0,
      // The lane row's last write (a heartbeat or a lamp change) and its note: how the watchdog sees a silent worker.
      beatAt: beat?.note != null ? beat.updatedAt.toISOString() : null,
      beatNote: beat?.note ?? null,
      status: laneStatus(lit, lastClaimAt, now),
    }
  })
}
