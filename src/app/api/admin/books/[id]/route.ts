import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { booksContextAuthError } from '@/lib/books-context-api-auth'

/**
 * GET /api/admin/books/[id]
 * Single book for context. Default: metadata only (no full extracted text).
 *
 * Query:
 * - extractedText=1 — include extractedText (truncated by maxChars, default 80000)
 * - maxChars=80000 — cap extracted text length (token control)
 *
 * Auth: Authorization: Bearer <BOOKS_CONTEXT_API_KEY> or X-Books-Context-Key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = booksContextAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const { id } = await params
  const wantText = request.nextUrl.searchParams.get('extractedText') === '1'
  const maxChars = Math.min(
    500_000,
    Math.max(1, parseInt(request.nextUrl.searchParams.get('maxChars') || '80000', 10) || 80000)
  )
  const startCharRaw = request.nextUrl.searchParams.get('startChar')
  const endCharRaw = request.nextUrl.searchParams.get('endChar')
  const startChar =
    startCharRaw !== null && startCharRaw !== '' ? Math.max(0, parseInt(startCharRaw, 10) || 0) : null
  const endChar =
    endCharRaw !== null && endCharRaw !== '' ? Math.max(0, parseInt(endCharRaw, 10) || 0) : null

  try {
    const book = await db.book.findUnique({
      where: { id },
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
        ...(wantText ? { extractedText: true } : {}),
        thread: { select: { id: true } },
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    let extractedText: string | null = null
    let extractedTextTruncated = false
    if (wantText && 'extractedText' in book && book.extractedText) {
      let raw = book.extractedText
      if (startChar !== null || endChar !== null) {
        const s = startChar ?? 0
        const e = endChar !== null ? endChar : raw.length
        raw = raw.slice(s, Math.min(e, raw.length))
      }
      if (raw.length > maxChars) {
        extractedText = raw.slice(0, maxChars)
        extractedTextTruncated = true
      } else {
        extractedText = raw
      }
    }

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        slug: book.slug,
        sourcePdfUrl: book.sourcePdfUrl,
        status: book.status,
        metadataJson: book.metadataJson,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        threadId: book.thread?.id ?? null,
        ...(wantText
          ? {
              extractedText,
              extractedTextTruncated,
              extractedTextCharCount: extractedText?.length ?? 0,
            }
          : {}),
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load book'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
