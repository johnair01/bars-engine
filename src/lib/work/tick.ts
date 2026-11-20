import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { dryLanes, beatLane, returnLapsed } from './queue'
import { LANE_WORKERS } from './lanes'

/**
 * The orchestrator's tick (Wendell, 2026-11-19: the pipeline needs "an orchestrator that starts workers itself"; decision
 * record council docs/factory-research-decision.md). On each tick, for each lane with a worker routine (Claude, then Freebuff): if tickets are ready, the lane has
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

/**
 * The lanes the tick feeds, each with its own worker routine and its own settings, so a lane's workers start only when
 * that lane's trigger is set. Freebuff (2026-11-20): its tickets used to wait for a session nothing woke. Its worker
 * is a routine whose prompt is the Freebuff rules (claim from the freebuff lane, open a pull request, never merge);
 * the fire URL and token are WORKER_ROUTINE_FIRE_URL_FREEBUFF and WORKER_ROUTINE_TOKEN_FREEBUFF. A lane without both
 * settings answers `not-set` and its tickets keep waiting, exactly as before.
 */
export const TICK_LANES = ['claude', 'freebuff'] as const
export type TickLane = (typeof TICK_LANES)[number]

export function tickEnv(lane: string): { url?: string; token?: string } {
  const suffix = lane === 'claude' ? '' : `_${lane.toUpperCase()}`
  return { url: process.env[`WORKER_ROUTINE_FIRE_URL${suffix}`], token: process.env[`WORKER_ROUTINE_TOKEN${suffix}`] }
}

export function tickLockLane(lane: string): string { return `tick:${lane}` }

/** What a worker session is told when the tick starts it. The lane's own rules live in the routine's prompt. */
export function fireText(lane: string, ready: number, k: number, n: number): string {
  return `Started by bars-engine tick: ${ready} ready in the ${lane === 'claude' ? 'Claude' : lane} lane, worker ${k + 1} of ${n}.`
}

/** Pure: how many workers to start now. */
export function decideFires(i: { ready: number; live: number; dry: boolean; cooldownOpen: boolean; max?: number }): number {
  if (i.dry || i.cooldownOpen) return 0
  const slots = Math.max(0, LANE_WORKERS - i.live)
  return Math.max(0, Math.min(i.ready, slots, i.max ?? TICK_MAX_FIRES))
}

export type TickResult = { lane: string; fired: number; ready: number; live: number; reason: string }

export async function tickLane(db: PrismaClient, lane: string, opts: { now?: Date; dry?: boolean } = {}): Promise<TickResult> {
  const now = opts.now ?? new Date()
  const { url, token } = tickEnv(lane)
  const lockLane = tickLockLane(lane)
  const beatName = lane === 'claude' ? 'tick' : `tick:${lane}:beat`
  const [ready, live, out, lock] = await Promise.all([
    db.workTicket.count({ where: { lane, state: 'ready' } }),
    db.workTicket.count({ where: { lane, state: 'claimed', leaseUntil: { gt: now } } }),
    dryLanes(db, now),
    db.workLane.findUnique({ where: { lane: lockLane } }),
  ])
  const cooldownOpen = !!lock?.dryUntil && lock.dryUntil > now
  const n = decideFires({ ready, live, dry: out.has(lane), cooldownOpen })
  const base = { lane, ready, live }
  if (!url || !token) { await beatLane(db, beatName, `not-set: ${ready} ready`, now); return { ...base, fired: 0, reason: 'not-set' } }
  if (n === 0) {
    const reason = ready === 0 ? 'nothing-ready' : out.has(lane) ? 'lane-dry' : cooldownOpen ? 'cooldown' : 'no-free-slot'
    await beatLane(db, beatName, `${reason}: ${ready} ready, ${live} live`, now)
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
        body: JSON.stringify({ text: fireText(lane, ready, k, n) }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) fired++
      else console.error(`[work] tick fire refused (${lane}): ${res.status}`)
    } catch (e) { console.error(`[work] tick fire failed (${lane})`, e) }
  }
  if (fired > 0) {
    const until = new Date(now.getTime() + TICK_COOLDOWN_MS)
    await db.workLane.upsert({ where: { lane: lockLane }, create: { lane: lockLane, dry: false, dryUntil: until, note: 'tick cooldown' }, update: { dryUntil: until } })
  }
  await beatLane(db, beatName, `fired ${fired}/${n}: ${ready} ready, ${live} live`, now)
  return { ...base, fired, reason: fired === n ? 'fired' : 'partial' }
}

/** One tick: return lapsed holds to their decks once, then feed each lane. A lane's failure never stops the next lane. */
export async function tick(db: PrismaClient, opts: { now?: Date; dry?: boolean } = {}): Promise<{ results: TickResult[] } & TickResult> {
  const now = opts.now ?? new Date()
  await returnLapsed(db, now)
  const results: TickResult[] = []
  for (const lane of TICK_LANES) {
    try { results.push(await tickLane(db, lane, { ...opts, now })) }
    catch (e) { console.error(`[work] tick lane failed (${lane})`, e); results.push({ lane, ready: 0, live: 0, fired: 0, reason: 'error' }) }
  }
  // The top level keeps the Claude lane's fields, so a caller that read them before still reads the same shape.
  return { ...results[0], results }
}
