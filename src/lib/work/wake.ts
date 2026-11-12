import 'server-only'
import { after } from 'next/server'
import type { PrismaClient } from '@prisma/client'
import { db as prisma } from '@/lib/db'

/**
 * Answers start the work (live board step 3, six-faces-council council/callsheets/live-board-design.md). On 2026-11-03
 * Wendell answered lb-start at 02:09 and nothing started: his answer became a ticket, and the ticket waited for the
 * hourly pickup routine ("Why didn't it start on its own?"). Now, when a save puts a new ticket in the Claude lane, the
 * server fires that routine at once through its API trigger. The routine claims the ticket and posts its "Board Send
 * at" line to the project, and the coordinator starts the thread, so the work begins within about a minute, with no Send.
 *
 * Settings (Vercel, production): PICKUP_ROUTINE_FIRE_URL, the routine's API trigger URL
 * (https://api.anthropic.com/v1/claude_code/routines/<trig_id>/fire), and PICKUP_ROUTINE_TOKEN, the token claude.ai
 * shows once when that API trigger is added. Without them nothing is fired and the hourly run still claims the ticket.
 * A refusal or network error is logged and never thrown: the save and the ticket are already stored.
 */
export const WAKE_THROTTLE_MS = 20_000
let lastSent = 0
let last: { at: string; result: WakeResult; status?: number } | null = null

export type WakeResult = 'sent' | 'throttled' | 'not-set' | 'failed'

/** What a deployment can say about the wake without exposing it: set or not, which routine, and the last attempt here. */
export function wakeStatus() {
  const url = process.env.PICKUP_ROUTINE_FIRE_URL, token = process.env.PICKUP_ROUTINE_TOKEN
  return {
    urlSet: !!url, tokenSet: !!token,
    routine: url?.match(/\/routines\/(trig_[A-Za-z0-9]+)\/fire/)?.[1] ?? null,
    lastOnThisInstance: last,
  }
}

export async function wakePickup(reason: string, now = Date.now()): Promise<WakeResult> {
  const url = process.env.PICKUP_ROUTINE_FIRE_URL, token = process.env.PICKUP_ROUTINE_TOKEN
  if (!url || !token) return 'not-set'
  // One run claims up to ten tickets, so answers saved a few seconds apart need one wake.
  if (now - lastSent < WAKE_THROTTLE_MS) return 'throttled'
  lastSent = now
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: `Woken by bars-engine: ${reason}` }),
      signal: AbortSignal.timeout(8000),
    })
    last = { at: new Date().toISOString(), result: res.ok ? 'sent' : 'failed', status: res.status }
    if (res.ok) return 'sent'
    console.error(`[work] pickup wake refused: ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`)
  } catch (e) {
    console.error('[work] pickup wake failed', e)
    last = { at: new Date().toISOString(), result: 'failed' }
  }
  return 'failed'
}

/**
 * One wake per burst (2026-11-07). On that day ten answers in 15 minutes fired ten routine sessions, each posting its own
 * "Board Send" line in the project chat. The 20 second throttle above lives in one server instance's memory, and
 * serverless instances do not share memory, so it stopped nothing. The window below lives in the database, in a
 * WorkLane row (dry stays false, so no lane reads it as a dry mark): `dryUntil` is when the open window closes.
 *   - The first save after a window closed opens the next one, sleeps until it closes, then fires once.
 *   - A save that lands inside an open window does nothing; the one fire at the window's close claims its ticket too,
 *     because the routine claims every ready ticket.
 *   - At the close it counts the Claude lane's ready tickets and fires only if one waits, so a hand-claimed deck
 *     costs no empty session.
 * A function that dies mid-sleep loses that one wake; the next save after the window's end opens a fresh window, and
 * the three-hourly claim still picks the tickets up. The route needs maxDuration above the window.
 */
export const WAKE_WINDOW_MS = Number(process.env.PICKUP_WAKE_WINDOW_MS) || 120_000
export const WAKE_LOCK_LANE = 'wake:pickup'
type Sleep = (ms: number) => Promise<void>
const realSleep: Sleep = ms => new Promise(r => setTimeout(r, ms))

/** Open a window if none is open. True when this caller opened it and owns the fire. Atomic across instances. */
export async function openWakeWindow(db: PrismaClient, now = new Date(), windowMs = WAKE_WINDOW_MS): Promise<boolean> {
  const until = new Date(now.getTime() + windowMs)
  const taken = await db.workLane.updateMany({
    where: { lane: WAKE_LOCK_LANE, OR: [{ dryUntil: null }, { dryUntil: { lte: now } }] },
    data: { dryUntil: until },
  })
  if (taken.count > 0) return true
  try {
    await db.workLane.create({ data: { lane: WAKE_LOCK_LANE, dry: false, dryUntil: until, note: 'pickup wake window' } })
    return true
  } catch { return false } // the row exists and its window is open (or another instance created it first)
}

export type BatchedResult = WakeResult | 'batched' | 'nothing-ready'

/** Debounced wake: one routine fire for every answer saved inside one window. */
export async function wakePickupBatched(reason: string, opts: { db?: PrismaClient; sleep?: Sleep; windowMs?: number } = {}): Promise<BatchedResult> {
  const db = opts.db ?? prisma
  const windowMs = opts.windowMs ?? WAKE_WINDOW_MS
  if (!process.env.PICKUP_ROUTINE_FIRE_URL || !process.env.PICKUP_ROUTINE_TOKEN) return 'not-set'
  let owns = false
  try { owns = await openWakeWindow(db, new Date(), windowMs) } catch (e) { console.error('[work] wake window failed', e); owns = true }
  if (!owns) return 'batched'
  await (opts.sleep ?? realSleep)(windowMs)
  const ready = await db.workTicket.count({ where: { lane: 'claude', state: 'ready' } }).catch(() => -1)
  if (ready === 0) return 'nothing-ready'
  const what = ready > 1 ? `${ready} answers waiting in the Claude lane, the first: ${reason}` : reason
  return wakePickup(what, Date.now() + windowMs)
}

/** Wake the pickup after the response has gone, so his save never waits on claude.ai. */
export function wakePickupAfter(reason: string) {
  const run = () => wakePickupBatched(reason).then(() => undefined, e => console.error('[work] pickup wake failed', e))
  try { after(run) } catch { void run() }
}

/** Test hook: forget the last wake. */
export function resetWakeThrottle() { lastSent = 0; last = null }
