import 'server-only'
import { after } from 'next/server'

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

/** Wake the pickup after the response has gone, so his save never waits on claude.ai. */
export function wakePickupAfter(reason: string) {
  const run = () => wakePickup(reason).then(() => undefined)
  try { after(run) } catch { void run().catch(() => undefined) }
}

/** Test hook: forget the last wake. */
export function resetWakeThrottle() { lastSent = 0; last = null }
