/**
 * WorkAdventure sends the Admin API secret as a raw `Authorization` header
 * (`Authorization: <token>`), not as a Bearer token. Accept both shapes so a
 * curl check and the pusher behave the same.
 */
import { timingSafeEqual } from 'node:crypto'
import { WA_ADMIN_API_TOKEN } from './config'

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function adminApiAuthorized(authorizationHeader: string | null): boolean {
  if (!WA_ADMIN_API_TOKEN) return false
  if (!authorizationHeader) return false
  const value = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7).trim()
    : authorizationHeader.trim()
  return safeEqual(value, WA_ADMIN_API_TOKEN)
}

export function adminApiConfigured(): boolean {
  return Boolean(WA_ADMIN_API_TOKEN)
}

export function adminApiErrorResponse(): Response {
  if (!adminApiConfigured()) {
    return Response.json(
      { error: 'WA_ADMIN_API_TOKEN is not set on bars-engine' },
      { status: 503 },
    )
  }
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
