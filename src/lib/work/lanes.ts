import { NextRequest } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'

/**
 * The lanes, in Wendell's order on the board (`wq-lanes`): Claude Teams, Freebuff, Codex, Zo. Slice 1 opens the first
 * two (`wq-two-lanes-first`). Each lane has its own token, so a leaked token reaches one lane: WORK_TOKEN_CLAUDE,
 * WORK_TOKEN_FREEBUFF. COUNCIL_MENU_TOKEN (the council's own sessions) may act in any lane and push tickets.
 */
export const LANES = ['claude', 'freebuff'] as const
export type Lane = (typeof LANES)[number]
/** Where his answers go by themselves (`wq-who-routes`): Claude first, Freebuff when Claude runs dry. */
export const DEFAULT_LANES: Lane[] = ['claude', 'freebuff']
/** A claim holds a ticket this long; heartbeat extends it, and a lapsed lease returns the ticket to ready. */
export const LEASE_MS = 2 * 60 * 60 * 1000
/** A dry lane's lamp comes back on by itself after this long, unless a worker or he lights it sooner. */
export const DRY_MS = 5 * 60 * 60 * 1000

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
