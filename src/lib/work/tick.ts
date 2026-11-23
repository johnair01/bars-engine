import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { dryLanes, beatLane, returnLapsed } from './queue'
import { LANE_WORKERS } from './lanes'

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

/** Pure: how many workers to start now. */
export function decideFires(i: { ready: number; live: number; dry: boolean; cooldownOpen: boolean; max?: number }): number {
  if (i.dry || i.cooldownOpen) return 0
  const slots = Math.max(0, LANE_WORKERS - i.live)
  return Math.max(0, Math.min(i.ready, slots, i.max ?? TICK_MAX_FIRES))
}

export type TickResult = { fired: number; ready: number; live: number; reason: string }

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
  const n = decideFires({ ready, live, dry: out.has(TICK_LANE), cooldownOpen })
  const base = { ready, live }
  if (n === 0) {
    const reason = ready === 0 ? 'nothing-ready' : out.has(TICK_LANE) ? 'lane-dry' : cooldownOpen ? 'cooldown' : 'no-free-slot'
    await beatLane(db, 'tick', `${reason}: ${ready} ready, ${live} live`, now)
    return { ...base, fired: 0, reason }
  }
  // Workers are started by the hourly :07 scheduled task "Council worker (hourly :07)", not by this tick. The routine API
  // refused every fire from here with 403 "this project is paused" (2026-11-21), so the tick only reports what it sees.
  await beatLane(db, 'tick', `${n} worker(s) wanted, started by the scheduled task: ${ready} ready, ${live} live`, now)
  return { ...base, fired: 0, reason: opts.dry ? `dry-run: would want ${n}` : `wants-${n}` }
}
