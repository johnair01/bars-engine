/**
 * Auth for /api/admin/books — ChatGPT / external tools (no cookie session).
 * Set BOOKS_CONTEXT_API_KEY in env; send Authorization: Bearer <key> or X-Books-Context-Key.
 */
import { NextRequest } from 'next/server'

export function booksContextAuthError(request: NextRequest): { status: 401 | 503; body: { error: string } } | null {
  const expected = process.env.BOOKS_CONTEXT_API_KEY
  if (!expected || expected.trim() === '') {
    return {
      status: 503,
      body: {
        error:
          'BOOKS_CONTEXT_API_KEY is not set on the server. Add it to .env.local and Vercel. See docs/BOOKS_CONTEXT_API.md',
      },
    }
  }

  const auth = request.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  const headerKey = request.headers.get('x-books-context-key')?.trim()
  const token = bearer || headerKey

  if (!token || token !== expected) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  return null
}
