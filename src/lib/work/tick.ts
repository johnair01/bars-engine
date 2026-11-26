import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { dryLanes, beatLane, returnLapsed, unholdTicket } from './queue'
import { LANE_WORKERS } from './lanes'
import { openWakeWindow, wakePickup } from './wake'

/**
 * The orchestrator's tick (Wendell, 2026-11-19). It reads the Claude lane (ready tickets, live claims, the cooldown) and
 * says how many workers it wants, on the `tick` beat shown in GET /api/work/lanes. It does not start workers: the hourly
 * :07 scheduled task "Council worker (hourly :07)" does. The routine API refused every start call from here with 403
 * "this project is paused" on 2026-11-21 (anthropics/claude-code#102874), so the fire call was removed.
 */
export const TICK_LANE = 'claude'
export const TICK_MAX_FIRES = 4
export const TICK_COOLDOWN_MS = 15 * 60 * 1000
export const TICK_LOCK_LANE = 'tick:claude'
/** A ready Claude ticket that has waited this long means the save wake missed it (2026-11-24, st-answers-wake-3). */
export const TICK_WAKE_AFTER_MS = 20 * 60 * 1000
/** After a backstop wake the tick stays quiet this long, so a box curl every hour cannot fire a session every hour. */
export const TICK_WAKE_QUIET_MS = 60 * 60 * 1000
export const TICK_WAKE_LANE = 'tick:wake'

/** Pure: should the tick fire the save wake? True when the oldest ready ticket has waited past the limit. */
export function shouldWake(i: { oldestReadyAt: Date | null; now: Date; dry: boolean; afterMs?: number }): boolean {
  if (i.dry || !i.oldestReadyAt) return false
  return i.now.getTime() - i.oldestReadyAt.getTime() > (i.afterMs ?? TICK_WAKE_AFTER_MS)
}

/** Pure: how many workers to start now. */
export function decideFires(i: { ready: number; live: number; dry: boolean; cooldownOpen: boolean; max?: number }): number {
  if (i.dry || i.cooldownOpen) return 0
  const slots = Math.max(0, LANE_WORKERS - i.live)
  return Math.max(0, Math.min(i.ready, slots, i.max ?? TICK_MAX_FIRES))
}

/**
 * Self-started looks (Wendell, 2026-11-24, board row looks-self-start-1, answer A). A thread that finishes the work his yes
 * started files the strand's following look as a held ticket titled "Next look: <step>", with sourceKey
 * `next-look:<strand>:<n>`. When the Claude lane is idle the tick lifts one. It never writes a brief.
 */
export const NEXT_LOOK_PREFIX = 'Next look:'
export const NEXT_LOOK_DAILY_CAP = 4

export function strandOf(sourceKey: string): string | null {
  const m = /^next-look:([^:]+):/.exec(sourceKey)
  return m ? m[1] : null
}

/** Pure: the held "Next look:" ticket to lift, or null. `open` holds the strands that already have a self-started look ready or claimed. */
export function pickNextLook<T extends { sourceKey: string; title: string; createdAt: Date }>(i: {
  held: T[]; open: Set<string>; unheldToday: number; idle: boolean; cap?: number
}): T | null {
  if (!i.idle || i.unheldToday >= (i.cap ?? NEXT_LOOK_DAILY_CAP)) return null
  return [...i.held]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .find(t => {
      const strand = strandOf(t.sourceKey)
      return t.title.startsWith(NEXT_LOOK_PREFIX) && strand !== null && !i.open.has(strand)
    }) ?? null
}

async function unholdNextLook(db: PrismaClient, now: Date): Promise<string | null> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const where = { lane: TICK_LANE, title: { startsWith: NEXT_LOOK_PREFIX } }
  const [held, active, today] = await Promise.all([
    db.workTicket.findMany({ where: { ...where, state: 'held', attempts: 0 }, orderBy: { createdAt: 'asc' }, take: 50 }),
    db.workTicket.findMany({ where: { ...where, state: { in: ['ready', 'claimed'] } }, select: { sourceKey: true } }),
    db.workTicket.count({ where: { ...where, state: { in: ['ready', 'claimed', 'done', 'failed'] }, updatedAt: { gt: since } } }),
  ])
  const open = new Set(active.map(t => strandOf(t.sourceKey)).filter((s): s is string => !!s))
  const pick = pickNextLook({ held, open, unheldToday: today, idle: true })
  if (!pick) return null
  const r = await unholdTicket(db, pick.id)
  return r.ok ? pick.title : null
}

export type TickResult = { fired: number; ready: number; live: number; reason: string; woke?: string; unheld?: string }

export async function tick(db: PrismaClient, opts: { now?: Date; dry?: boolean } = {}): Promise<TickResult> {
  const now = opts.now ?? new Date()
  await returnLapsed(db, now)
  const [ready, live, out, lock] = await Promise.all([
    db.workTicket.count({ where: { lane: TICK_LANE, state: 'ready' } }),
    db.workTicket.count({ where: { lane: TICK_LANE, state: 'claimed', leaseUntil: { gt: now } } }),
    dryLanes(db, now),
    db.workLane.findUnique({ where: { lane: TICK_LOCK_LANE } }),
  ])
  const cooldownOpen = !!lock?.dryUntil && lock.dryUntil > now
  // Backstop for the save wake: the box curls this tick, and a Claude ticket that has waited 20 minutes starts one session.
  let woke: string | undefined
  if (ready > 0 && !opts.dry) {
    const oldest = await db.workTicket.findFirst({ where: { lane: TICK_LANE, state: 'ready' }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    if (shouldWake({ oldestReadyAt: oldest?.createdAt ?? null, now, dry: !!opts.dry }) && await openWakeWindow(db, now, TICK_WAKE_QUIET_MS, TICK_WAKE_LANE)) {
      woke = await wakePickup(`${ready} Claude ticket(s) ready more than 20 minutes (tick backstop)`)
    }
  }
  const n = decideFires({ ready, live, dry: out.has(TICK_LANE), cooldownOpen })
  const base = { ready, live, ...(woke ? { woke } : {}) }
  if (n === 0) {
    if (ready === 0 && live === 0 && !out.has(TICK_LANE) && !opts.dry) {
      const unheld = await unholdNextLook(db, now)
      if (unheld) {
        await beatLane(db, 'tick', `idle: lifted "${unheld}"`, now)
        return { ...base, fired: 0, reason: 'lifted-next-look', unheld }
      }
    }
    const reason = ready === 0 ? 'nothing-ready' : out.has(TICK_LANE) ? 'lane-dry' : cooldownOpen ? 'cooldown' : 'no-free-slot'
    await beatLane(db, 'tick', `${reason}: ${ready} ready, ${live} live`, now)
    return { ...base, fired: 0, reason }
  }
  // Workers are started by the hourly :07 scheduled task "Council worker (hourly :07)", not by this tick. The routine API
  // refused every fire from here with 403 "this project is paused" (2026-11-21), so the tick only reports what it sees.
  await beatLane(db, 'tick', `${n} worker(s) wanted, started by the scheduled task: ${ready} ready, ${live} live`, now)
  return { ...base, fired: 0, reason: opts.dry ? `dry-run: would want ${n}` : `wants-${n}` }
}
