'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type MoveProposalSummary = {
  id: string
  key: string
  name: string
  description: string
  tier: string
  origin: string
  sourceBookId?: string
  sourceChunkIndex?: number
  moveType?: string
  bookTitle?: string
  createdAt: Date
}

export type MoveEdits = {
  name?: string
  description?: string
  requirementsSchema?: string
  effectsSchema?: string
}

async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function parseSourceMetadata(raw: string | null): { sourceBookId?: string; sourceChunkIndex?: number; moveType?: string } {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as { sourceBookId?: string; sourceChunkIndex?: number; moveType?: string }
  } catch {
    return {}
  }
}

/**
 * List move proposals for admin review.
 * Default: tier CUSTOM, origin BOOK_EXTRACTED.
 */
export async function listMoveProposals(filters?: {
  tier?: string
  origin?: string
  bookId?: string
}): Promise<MoveProposalSummary[]> {
  await requireAdmin()

  const where: Record<string, unknown> = {
    tier: filters?.tier ?? 'CUSTOM',
    origin: filters?.origin ?? 'BOOK_EXTRACTED',
  }
  if (filters?.bookId) {
    where.sourceMetadata = { contains: filters.bookId }
  }

  const moves = await db.nationMove.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      tier: true,
      origin: true,
      sourceMetadata: true,
      createdAt: true,
    },
  })

  const bookIds = [...new Set(moves.map((m) => parseSourceMetadata(m.sourceMetadata).sourceBookId).filter(Boolean))]
  const books =
    bookIds.length > 0
      ? await db.book.findMany({
          where: { id: { in: bookIds as string[] } },
          select: { id: true, title: true },
        })
      : []
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b.title]))

  return moves
    .filter((m) => {
      if (filters?.bookId) {
        const meta = parseSourceMetadata(m.sourceMetadata)
        return meta.sourceBookId === filters.bookId
      }
      return true
    })
    .map((m) => {
      const meta = parseSourceMetadata(m.sourceMetadata)
      return {
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        tier: m.tier,
        origin: m.origin,
        sourceBookId: meta.sourceBookId,
        sourceChunkIndex: meta.sourceChunkIndex,
        moveType: meta.moveType,
        bookTitle: meta.sourceBookId ? bookMap[meta.sourceBookId] : undefined,
        createdAt: m.createdAt,
      }
    })
}

/**
 * Update a move proposal before promotion.
 */
export async function updateMoveProposal(moveId: string, edits: MoveEdits) {
  await requireAdmin()

  const data: Record<string, unknown> = {}
  if (edits.name != null) data.name = edits.name
  if (edits.description != null) data.description = edits.description
  if (edits.requirementsSchema != null) data.requirementsSchema = edits.requirementsSchema
  if (edits.effectsSchema != null) data.effectsSchema = edits.effectsSchema

  if (Object.keys(data).length === 0) return { success: true }

  await db.nationMove.update({
    where: { id: moveId },
    data,
  })

  revalidatePath('/admin/books')
  revalidatePath('/admin/moves')
  return { success: true }
}

export type AdminMoveSummary = {
  id: string
  key: string
  name: string
  description: string
  tier: string
  origin: string
  nationName: string
  sourceBookId?: string
  sourceChunkIndex?: number
  moveType?: string
  bookTitle?: string
  createdAt: Date
}

/**
 * List all moves for admin view. Filter by tier, moveType (from sourceMetadata), nation.
 */
export async function listAdminMoves(filters?: {
  tier?: string
  moveType?: string
  nationId?: string
}): Promise<AdminMoveSummary[]> {
  await requireAdmin()

  const where: Record<string, unknown> = {}
  if (filters?.tier) where.tier = filters.tier
  if (filters?.nationId) where.nationId = filters.nationId

  const moves = await db.nationMove.findMany({
    where,
    orderBy: [{ tier: 'asc' }, { nationId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      tier: true,
      origin: true,
      nationId: true,
      sourceMetadata: true,
      createdAt: true,
    },
  })

  const nationIds = [...new Set(moves.map((m) => m.nationId))]
  const nations =
    nationIds.length > 0
      ? await db.nation.findMany({
          where: { id: { in: nationIds } },
          select: { id: true, name: true },
        })
      : []
  const nationMap = Object.fromEntries(nations.map((n) => [n.id, n]))

  const bookIds = [...new Set(moves.map((m) => parseSourceMetadata(m.sourceMetadata).sourceBookId).filter(Boolean))]
  const books =
    bookIds.length > 0
      ? await db.book.findMany({
          where: { id: { in: bookIds as string[] } },
          select: { id: true, title: true },
        })
      : []
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b.title]))

  return moves
    .filter((m) => {
      if (filters?.moveType) {
        const meta = parseSourceMetadata(m.sourceMetadata)
        return meta.moveType === filters.moveType
      }
      return true
    })
    .map((m) => {
      const meta = parseSourceMetadata(m.sourceMetadata)
      const nation = nationMap[m.nationId]
      return {
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        tier: m.tier,
        origin: m.origin,
        nationName: nation?.name ?? '?',
        sourceBookId: meta.sourceBookId,
        sourceChunkIndex: meta.sourceChunkIndex,
        moveType: meta.moveType,
        bookTitle: meta.sourceBookId ? bookMap[meta.sourceBookId] : undefined,
        createdAt: m.createdAt,
      }
    })
}

/**
 * List promoted moves (tier CANDIDATE or CANONICAL) for admin move pool picker.
 */
export async function listPromotedMoves(): Promise<{ id: string; key: string; name: string }[]> {
  const moves = await db.nationMove.findMany({
    where: { tier: { in: ['CANDIDATE', 'CANONICAL'] } },
    orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, key: true, name: true },
  })
  return moves
}

/**
 * Promote or reject a move proposal.
 */
export async function promoteMoveProposal(
  moveId: string,
  action: 'promote' | 'reject',
  edits?: MoveEdits
) {
  await requireAdmin()

  const move = await db.nationMove.findUnique({ where: { id: moveId } })
  if (!move) return { error: 'Move not found' }

  if (edits && Object.keys(edits).length > 0) {
    await updateMoveProposal(moveId, edits)
  }

  if (action === 'reject') {
    await db.nationMove.update({
      where: { id: moveId },
      data: { deprecatedAt: new Date(), tier: 'EPHEMERAL' },
    })
    revalidatePath('/admin/books')
    revalidatePath('/admin/moves')
    return { success: true }
  }

  await db.nationMove.update({
    where: { id: moveId },
    data: { tier: 'CANDIDATE' },
  })

  const meta = parseSourceMetadata(move.sourceMetadata)
  if (meta.sourceBookId) revalidatePath(`/admin/books/${meta.sourceBookId}/moves`)
  revalidatePath('/admin/books')
  revalidatePath('/admin/moves')
  return { success: true }
}
