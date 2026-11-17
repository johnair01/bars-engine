import { AsyncLocalStorage } from 'node:async_hooks'
import { cookies } from 'next/headers'
import { parseTzOffset, ttvDayKey, ttvSessionDate, TTV_TZ_COOKIE } from './day'

const tzScope = new AsyncLocalStorage<number>()

/** Run `fn` with this offset as the zone, for the request that sent it (the cookie only arrives on the next one). */
export function withTzOffset<T>(offsetMin: number, fn: () => Promise<T>): Promise<T> {
  return tzScope.run(offsetMin, fn)
}

/** The player's zone offset (minutes): the request's own `tz`, else the cookie the sitting route sets, else UTC. */
export async function ttvTzOffset(): Promise<number> {
  const scoped = tzScope.getStore()
  if (scoped !== undefined) return scoped
  try {
    const store = await cookies()
    return parseTzOffset(store.get(TTV_TZ_COOKIE)?.value)
  } catch {
    return 0
  }
}

/** Today's sessionDate for server actions: the sitting's day turns at 4 AM in the player's zone. */
export async function todayStart(now = new Date()): Promise<Date> {
  return ttvSessionDate(now, await ttvTzOffset())
}

export async function todayKey(now = new Date()): Promise<string> {
  return ttvDayKey(now, await ttvTzOffset())
}
