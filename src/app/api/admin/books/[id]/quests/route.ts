import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { booksContextAuthError } from '@/lib/books-context-api-auth'

type QuestStatusFilter = 'draft' | 'active' | 'archived' | 'all'

/**
 * GET /api/admin/books/[id]/quests
 * Generated quests from book analysis (CustomBars with completionEffects.library bookId).
 *
 * Query:
 * - status=draft | active | archived | all (default: all)
 * - compact=1 — id, title, status, moveType only
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

  const { id: bookId } = await params
  const statusParam = (request.nextUrl.searchParams.get('status') || 'all').toLowerCase() as QuestStatusFilter
  const compact = request.nextUrl.searchParams.get('compact') === '1'

  const valid: QuestStatusFilter[] = ['draft', 'active', 'archived', 'all']
  if (!valid.includes(statusParam)) {
    return NextResponse.json(
      { error: 'Invalid status. Use draft, active, archived, or all.' },
      { status: 400 }
    )
  }

  try {
    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, slug: true },
    })
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const whereStatus =
      statusParam === 'all'
        ? {}
        : { status: statusParam as 'draft' | 'active' | 'archived' }

    const quests = await db.customBar.findMany({
      where: {
        completionEffects: { contains: `"bookId":"${bookId}"` },
        ...whereStatus,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        moveType: true,
        allyshipDomain: true,
        nation: true,
        archetype: true,
        kotterStage: true,
        lockType: true,
        createdAt: true,
        visibility: true,
        isSystem: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const full = quests.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      status: q.status,
      moveType: q.moveType,
      allyshipDomain: q.allyshipDomain,
      nation: q.nation,
      archetype: q.archetype,
      kotterStage: q.kotterStage,
      lockType: q.lockType,
      visibility: q.visibility,
      isSystem: q.isSystem,
      createdAt: q.createdAt.toISOString(),
    }))

    return NextResponse.json({
      bookId: book.id,
      bookTitle: book.title,
      bookSlug: book.slug,
      quests: compact
        ? full.map((q) => ({
            id: q.id,
            title: q.title,
            status: q.status,
            moveType: q.moveType,
          }))
        : full,
      count: full.length,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load quests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
