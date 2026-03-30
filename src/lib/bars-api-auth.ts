/**
 * Auth for BAR Forge API — Custom GPT / scripts (no cookie session).
 * Set BARS_API_KEY in env; send Authorization: Bearer <key>.
 */
import { NextRequest } from 'next/server'

export function barsApiAuthError(request: NextRequest): { status: 401 | 503; body: { error: string } } | null {
  const expected = process.env.BARS_API_KEY
  if (!expected || expected.trim() === '') {
    return {
      status: 503,
      body: {
        error: 'BARS_API_KEY is not set on the server. Add it to .env.local and Vercel. See docs/BAR_FORGE_API.md',
      },
    }
  }

  const auth = request.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  if (!bearer || bearer !== expected) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  return null
}
