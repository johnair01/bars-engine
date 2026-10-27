/**
 * @route GET /api/council/token-check
 * @entity SYSTEM
 * @description Whether COUNCIL_MENU_TOKEN is set here and whether the caller's key matches it, by fingerprint only
 * @permissions public (shows a length and the first 8 hex of a SHA-256, never the key)
 * @example GET /api/council/token-check  (with Authorization: Bearer <key> to compare)
 * @agentDiscoverable false
 */
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'

export const dynamic = 'force-dynamic'

/**
 * Every council call answered 401 on 2026-10-21 after Wendell rotated the key in Vercel, and nothing on screen said
 * which copy was off. This compares fingerprints: his Mac prints the same one from his clipboard
 * (Six-faces-council docs/token-rotation.md, "Check it works").
 */
function print(value: string | null | undefined) {
  if (!value) return null
  return {
    length: value.length,
    fingerprint: createHash('sha256').update(value).digest('hex').slice(0, 8),
    hasSpaces: /\s/.test(value),
  }
}

function describeHeader(value: string | null) {
  if (value === null) return null
  const space = value.indexOf(' ')
  return { scheme: space > 0 ? value.slice(0, space) : null, length: value.length, valuePrint: print(space > 0 ? value.slice(space + 1) : value) }
}

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const given = givenToken(req)
  return NextResponse.json(
    {
      server: print(secret),
      sent: print(given),
      match: !!secret && tokenMatches(given, secret),
      // How the key arrived, without the key: the egress proxy may send it in another shape than `Bearer <key>`.
      authorization: describeHeader(req.headers.get('authorization')),
      headers: [...req.headers.keys()].filter((k) => /auth|key|token/i.test(k)),
      query: [...req.nextUrl.searchParams.keys()],
      deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
