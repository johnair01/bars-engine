import { NextRequest } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'

/**
 * The lanes, in Wendell's order on the board (`wq-lanes`): Claude Teams, Freebuff, Codex, Zo. Slice 1 opens the first
 * two (`wq-two-lanes-first`); DeepAI Code opens as a third so its environment can pull from the same queue and be
 * measured beside the others. Each lane has its own token, so a leaked token reaches one lane: WORK_TOKEN_CLAUDE,
 * WORK_TOKEN_FREEBUFF, WORK_TOKEN_DEEPAI. Zo is the night crew: it opens as an explicit lane too (WORK_TOKEN_ZO), never in DEFAULT_LANES, and only
 * the closing ritual's lever (src/lib/close/lever.ts) puts tickets in it. COUNCIL_MENU_TOKEN (the council's own sessions) may act in any lane and push
 * tickets.
 */
export const LANES = ['claude', 'freebuff', 'deepai', 'zo'] as const
export type Lane = (typeof LANES)[number]
/**
 * Where his answers go by themselves (`wq-who-routes`): Claude first, Freebuff when Claude runs dry. DeepAI is
 * deliberately not here. It opens as an explicit lane (a ticket naming it, or a claim from it) so its throughput and
 * quality can be measured before it carries work he did not route to it himself.
 */
export const DEFAULT_LANES: Lane[] = ['claude', 'freebuff']
/** A claim holds a ticket this long; heartbeat extends it, and a lapsed lease returns the ticket to ready. */
export const LEASE_MS = 2 * 60 * 60 * 1000
/** A dry lane's lamp comes back on by itself after this long, unless a worker or he lights it sooner. */
export const DRY_MS = 5 * 60 * 60 * 1000
/** The furthest out he can set the renewal gate by hand. Beyond this the gate is a guess, not a signal. */
export const MAX_DRY_MS = 7 * 24 * 60 * 60 * 1000

export function isLane(v: unknown): v is Lane {
  return typeof v === 'string' && (LANES as readonly string[]).includes(v)
}

export function laneTokenName(lane: Lane): string {
  return `WORK_TOKEN_${lane.toUpperCase()}`
}

/** 'council' when the council token was given, 'lane' when the lane's own token was, else null. */
export function laneCaller(req: NextRequest, lane: Lane): 'council' | 'lane' | null {
  const given = givenToken(req)
  const council = process.env.COUNCIL_MENU_TOKEN
  if (council && tokenMatches(given, council)) return 'council'
  const own = process.env[laneTokenName(lane)]
  if (own && tokenMatches(given, own)) return 'lane'
  return null
}

export function councilCaller(req: NextRequest): boolean {
  const council = process.env.COUNCIL_MENU_TOKEN
  return !!council && tokenMatches(givenToken(req), council)
}

/** The ticket's lanes, cleaned: known lanes only, no repeats, never empty. */
export function cleanLanes(v: unknown): Lane[] {
  const out: Lane[] = []
  for (const l of Array.isArray(v) ? v : []) if (isLane(l) && !out.includes(l)) out.push(l)
  return out.length ? out : [...DEFAULT_LANES]
}

/** The first lane in the ticket's order whose lamp is lit, or the last one when every lamp is out. */
export function firstLitLane(lanes: string[], dry: Set<string>): string {
  return lanes.find(l => !dry.has(l)) ?? lanes[lanes.length - 1]
}

/**
 * A lane holding this many open tickets (ready plus claimed) takes no new work while a lane behind it
 * has room. Counting both states is the point: a lane with 3 ready and 40 claimed is full, not idle.
 * Set by his ruling of 2026-11-18 (option A: the ceiling yields his order, and the ceiling is 20).
 */
export const DECK_CEILING = 20

export type RouteReason = 'order' | 'ceiling'

/** Why a lane got the ticket: the next one in his order with room, or the ceiling picked the shortest deck. */
export interface Route {
  lane: string
  reason: RouteReason
}

/**
 * Where a new ticket goes. `DEFAULT_LANES` keeps its authority as the preference order; the ceiling decides
 * whether the next lane in that order gets a turn. A lane that is not named first still receives work once the
 * lanes ahead of it are full, so a maker no longer waits on a name being added to a constant.
 *
 * Zo stays out (spec FR-4): the closing lever keeps its monopoly, so zo can only receive a ticket whose order is
 * zo alone.
 */
export function routeLane(
  lanes: string[], lit: Set<string>, depth: Record<string, number>, ceiling = DECK_CEILING,
): Route | null {
  const zoOnly = lanes.length === 1 && lanes[0] === 'zo'
  const order = zoOnly ? lanes : lanes.filter(l => l !== 'zo')
  const room = order.find(l => lit.has(l) && (depth[l] ?? 0) < ceiling)
  if (room) return { lane: room, reason: 'order' }
  // His words: when no lane in the order is under the ceiling, the lit lane with the smallest deck takes it.
  // That pool is every lane, not the order, which is how a maker outside DEFAULT_LANES receives work at all.
  const pool = zoOnly ? order : [...new Set([...order, ...LANES])].filter(l => l !== 'zo')
  const open = pool.filter(l => lit.has(l))
  if (!open.length) return null
  const byDepth = [...open].sort((a, b) => (depth[a] ?? 0) - (depth[b] ?? 0) || pool.indexOf(a) - pool.indexOf(b))
  return { lane: byDepth[0], reason: 'ceiling' }
}
