import 'server-only'

const URL = 'https://api.github.com/repos/wendell-britt/Six-faces-council/actions/workflows/board-pull.yml/dispatches'
export const DISPATCH_THROTTLE_MS = 60_000
let lastSent = 0

/**
 * Asks GitHub to run board-pull now, so a save reaches main in about a minute instead of waiting for a schedule
 * GitHub often drops. A missing token, a refusal or a network error is logged and never thrown: the save is
 * already stored and the cron still sweeps. At most one call a minute per server instance.
 */
export async function dispatchBoardPull(now = Date.now()): Promise<'sent' | 'throttled' | 'no-token' | 'failed'> {
  const token = process.env.BOARD_DISPATCH_TOKEN
  if (!token) return 'no-token'
  if (now - lastSent < DISPATCH_THROTTLE_MS) return 'throttled'
  lastSent = now
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return 'sent'
    console.error(`board-pull dispatch refused: ${res.status}`)
  } catch (e) {
    console.error('board-pull dispatch failed', e)
  }
  return 'failed'
}

/** Test hook: forget the last call. */
export function resetDispatchThrottle() { lastSent = 0 }
