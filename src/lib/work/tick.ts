import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { dryLanes, beatLane, returnLapsed } from './queue'
import { LANE_WORKERS } from './lanes'

/**
 * The orchestrator's tick (Wendell, 2026-11-19: the pipeline needs "an orchestrator that starts workers itself"; decision
 * record council docs/factory-research-decision.md). On each tick, for the Claude lane: if tickets are ready, the lane has
 * a free worker slot (LANE_WORKERS live claims at most) and the cooldown is closed, fire the WORKER routine once per
 * ticket, up to TICK_MAX_FIRES. Each fire starts a fresh cloud session that claims one ticket and works it. No coordinator
 * and no person sits in the path. The pickup routine (wake.ts) stays the way a save reaches the coordinator; this is the
 * way a waiting ticket reaches a worker.
 *
 * Settings (Vercel, production): WORKER_ROUTINE_FIRE_URL (https://api.anthropic.com/v1/claude_code/routines/<trig_id>/fire)
 * and WORKER_ROUTINE_TOKEN, the token claude.ai shows once when the API trigger is added to the worker routine.
 */
export const TICK_LANE = 'claude'
export const TICK_MAX_FIRES = 2
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
  const url = process.env.WORKER_ROUTINE_FIRE_URL, token = process.env.WORKER_ROUTINE_TOKEN
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
  if (!url || !token) { await beatLane(db, 'tick', `not-set: ${ready} ready`, now); return { ...base, fired: 0, reason: 'not-set' } }
  if (n === 0) {
    const reason = ready === 0 ? 'nothing-ready' : out.has(TICK_LANE) ? 'lane-dry' : cooldownOpen ? 'cooldown' : 'no-free-slot'
    await beatLane(db, 'tick', `${reason}: ${ready} ready, ${live} live`, now)
    return { ...base, fired: 0, reason }
  }
  if (opts.dry) return { ...base, fired: 0, reason: `dry-run: would fire ${n}` }
  let fired = 0
  for (let k = 0; k < n; k++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, 'anthropic-version': '2023-06-01',
          'anthropic-beta': 'experimental-cc-routine-2026-04-01', 'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: `Started by bars-engine tick: ${ready} ready in the Claude lane, worker ${k + 1} of ${n}.` }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) fired++
      else console.error(`[work] tick fire refused: ${res.status}`)
    } catch (e) { console.error('[work] tick fire failed', e) }
  }
  if (fired > 0) {
    const until = new Date(now.getTime() + TICK_COOLDOWN_MS)
    await db.workLane.upsert({ where: { lane: TICK_LOCK_LANE }, create: { lane: TICK_LOCK_LANE, dry: false, dryUntil: until, note: 'tick cooldown' }, update: { dryUntil: until } })
  }
  await beatLane(db, 'tick', `fired ${fired}/${n}: ${ready} ready, ${live} live`, now)
  return { ...base, fired, reason: fired === n ? 'fired' : 'partial' }
}
