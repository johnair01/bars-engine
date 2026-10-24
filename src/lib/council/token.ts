import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

/**
 * COUNCIL_MENU_TOKEN as the council sends it: `Authorization: Bearer <token>`, `Authorization: <token>` or
 * `?token=<token>`. The query form is Wendell's ruling (board, `mm-menu-transport`, 2026-10-09). The bare header is
 * how the cloud environment's network secret sends it: from 2026-10-21 every council call answered 401 because the
 * proxy sent the right key without the `Bearer ` word (found with /api/council/token-check).
 */
export function givenToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length)
  if (header && !header.includes(' ')) return header
  return req.nextUrl.searchParams.get('token')
}

export function tokenMatches(token: string | null, secret: string): boolean {
  if (!token) return false
  const given = Buffer.from(token)
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
