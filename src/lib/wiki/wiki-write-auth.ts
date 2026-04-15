/**
 * Auth for /api/wiki/content/* — Custom GPT / automation (Bearer), separate from BOOKS_CONTEXT_API_KEY.
 * Set WIKI_WRITE_API_KEY in env; never commit.
 */
import { NextRequest } from 'next/server'

export function wikiWriteAuthError(request: NextRequest): { status: 401 | 503; body: { error: string } } | null {
  const expected = process.env.WIKI_WRITE_API_KEY
  if (!expected || expected.trim() === '') {
    return {
      status: 503,
      body: {
        error:
          'WIKI_WRITE_API_KEY is not set on the server. Add it to .env.local and Vercel. See docs/WIKI_WRITE_API.md',
      },
    }
  }

  const auth = request.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  const headerKey = request.headers.get('x-wiki-write-key')?.trim()
  const token = bearer || headerKey

  if (!token || token !== expected) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  return null
}
