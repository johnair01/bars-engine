import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { booksContextAuthError } from '@/lib/books-context-api-auth'

/**
 * GET /api/admin/books
 * Token-efficient catalog for ChatGPT / scripts (same fields as admin UI listBooks; no extractedText).
 *
 * Auth: Authorization: Bearer <BOOKS_CONTEXT_API_KEY> or X-Books-Context-Key
 */
export async function GET(request: NextRequest) {
  const authErr = booksContextAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  try {
    const books = await db.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        slug: true,
        sourcePdfUrl: true,
        status: true,
        metadataJson: true,
        createdAt: true,
        updatedAt: true,
        thread: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const compact = request.nextUrl.searchParams.get('compact') === '1'
    if (compact) {
      return NextResponse.json({
        books: books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          slug: b.slug,
          status: b.status,
          threadId: b.thread?.id ?? null,
        })),
        count: books.length,
      })
    }

    return NextResponse.json({
      books: books.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        slug: b.slug,
        sourcePdfUrl: b.sourcePdfUrl,
        status: b.status,
        metadataJson: b.metadataJson,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        threadId: b.thread?.id ?? null,
      })),
      count: books.length,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list books'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
