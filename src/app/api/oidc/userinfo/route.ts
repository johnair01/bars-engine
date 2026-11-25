/**
 * OIDC userinfo. WorkAdventure calls this with the access token and copies the
 * claims into its own room token; `tags` becomes `WA.player.tags`.
 */
import type { NextRequest } from 'next/server'
import { readAccessToken } from '@/lib/wa/oidc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

function userinfo(request: NextRequest) {
  const token = bearer(request)
  if (!token) {
    return Response.json({ error: 'invalid_token' }, { status: 401 })
  }
  const result = readAccessToken(token)
  if (!result.ok) {
    return Response.json({ error: 'invalid_token', error_description: result.error }, { status: 401 })
  }
  return Response.json(result.claims, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: NextRequest) {
  return userinfo(request)
}

export async function POST(request: NextRequest) {
  return userinfo(request)
}
