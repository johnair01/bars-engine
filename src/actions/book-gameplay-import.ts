'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import type { GameplayImportKind, ImportPreviewRow } from '@/lib/book-gameplay-import-types'

async function requireAdminPlayerId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function parseMoveSourceBook(raw: string | null): string | undefined {
  if (!raw) return undefined
  try {
    const o = JSON.parse(raw) as { sourceBookId?: string }
    return typeof o.sourceBookId === 'string' ? o.sourceBookId : undefined
  } catch {
    return undefined
  }
}

export async function previewImportBookGameplay(input: {
  targetBookId: string
  sourceBookId: string
  kinds: GameplayImportKind[]
}) {
  try {
    await requireAdminPlayerId()
    const kinds = input.kinds?.length ? input.kinds : (['quest', 'move', 'bar'] as const)

    const target = await db.book.findUnique({ where: { id: input.targetBookId }, select: { id: true } })
    const source = await db.book.findUnique({ where: { id: input.sourceBookId }, select: { id: true } })
    if (!target || !source) return { error: 'Target or source book not found' as const }

    const items: ImportPreviewRow[] = []

    if (kinds.includes('quest')) {
      const thread = await db.questThread.findUnique({
        where: { bookId: input.sourceBookId },
        include: {
          quests: {
            orderBy: { position: 'asc' },
            include: { quest: { select: { id: true, title: true, type: true } } },
          },
        },
      })
      for (const tq of thread?.quests ?? []) {
        items.push({
          kind: 'quest',
          id: tq.questId,
          title: tq.quest.title,
          detail: tq.quest.type,
        })
      }
    }

    if (kinds.includes('move')) {
      const moves = await db.nationMove.findMany({
        where: { sourceMetadata: { contains: input.sourceBookId } },
        select: { id: true, name: true, key: true, sourceMetadata: true, tier: true },
        take: 200,
      })
      for (const m of moves) {
        if (parseMoveSourceBook(m.sourceMetadata) !== input.sourceBookId) continue
        items.push({
          kind: 'move',
          id: m.id,
          title: m.name,
          detail: `${m.key} · ${m.tier}`,
        })
      }
    }

    if (kinds.includes('bar')) {
      const links = await db.sectionBARLink.findMany({
        where: { section: { bookId: input.sourceBookId } },
        select: {
          barId: true,
          bar: { select: { id: true, title: true, type: true } },
        },
      })
      const seen = new Set<string>()
      for (const l of links) {
        if (seen.has(l.barId)) continue
        seen.add(l.barId)
        items.push({
          kind: 'bar',
          id: l.barId,
          title: l.bar.title,
          detail: l.bar.type,
        })
      }
    }

    return { success: true as const, items }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Preview failed' }
  }
}

function parseRef(kind: GameplayImportKind, raw: string): { kind: GameplayImportKind; id: string } | null {
  const prefix = `${kind}:`
  if (!raw.startsWith(prefix)) return null
  const id = raw.slice(prefix.length).trim()
  return id ? { kind, id } : null
}

export async function commitImportBookGameplay(input: {
  targetBookId: string
  sourceBookId: string
  selectedIds: string[]
  mode: 'clone' | 'link'
  /** When importing bars, attach links to this section (required for bar rows). */
  targetSectionId?: string | null
}) {
  try {
    await requireAdminPlayerId()
    const target = await db.book.findUnique({
      where: { id: input.targetBookId },
      select: { id: true, title: true },
    })
    const source = await db.book.findUnique({ where: { id: input.sourceBookId }, select: { id: true } })
    if (!target || !source) return { error: 'Target or source book not found' as const }

    if (!input.selectedIds.length) return { error: 'No rows selected' as const }

    const parsed = input.selectedIds
      .map((raw) => {
        for (const k of ['quest', 'move', 'bar'] as const) {
          const p = parseRef(k, raw)
          if (p) return p
        }
        return null
      })
      .filter(Boolean) as { kind: GameplayImportKind; id: string }[]

    if (!parsed.length) return { error: 'selectedIds must use quest:id, move:id, or bar:id prefixes' as const }

    let imported = 0

    const quests = parsed.filter((p) => p.kind === 'quest')
    const moves = parsed.filter((p) => p.kind === 'move')
    const bars = parsed.filter((p) => p.kind === 'bar')

    if (moves.length) {
      return {
        error:
          'NationMove import is not automated in v1 — duplicate in admin moves or re-run extraction on the fork.' as const,
      }
    }

    if (bars.length) {
      if (!input.targetSectionId?.trim()) {
        return { error: 'targetSectionId is required when importing BAR links' as const }
      }
      const section = await db.bookSection.findUnique({
        where: { id: input.targetSectionId.trim() },
        select: { id: true, bookId: true },
      })
      if (!section || section.bookId !== input.targetBookId) {
        return { error: 'targetSectionId must belong to the target book' as const }
      }
      for (const b of bars) {
        const exists = await db.customBar.findUnique({ where: { id: b.id }, select: { id: true } })
        if (!exists) continue
        const role = 'source'
        await db.sectionBARLink.upsert({
          where: {
            sectionId_barId_role: { sectionId: section.id, barId: b.id, role },
          },
          create: { sectionId: section.id, barId: b.id, role },
          update: {},
        })
        imported += 1
      }
    }

    if (quests.length) {
      const sourceThread = await db.questThread.findUnique({
        where: { bookId: input.sourceBookId },
        include: { quests: true },
      })
      if (!sourceThread) return { error: 'Source book has no quest thread to import from' as const }

      const allowed = new Set(sourceThread.quests.map((q) => q.questId))
      const toLink = quests.map((q) => q.id).filter((id) => allowed.has(id))
      if (!toLink.length) return { error: 'No selected quests exist on the source thread' as const }

      if (input.mode === 'clone') {
        return {
          error:
            'Quest clone (duplicate CustomBar) is not implemented in v1 — use link mode to reference existing quests on the target thread.' as const,
        }
      }

      let thread = await db.questThread.findUnique({ where: { bookId: input.targetBookId } })
      if (!thread) {
        thread = await db.questThread.create({
          data: {
            title: target.title,
            description: `Imported from book thread (${input.sourceBookId}).`,
            threadType: 'standard',
            creatorType: 'library',
            bookId: input.targetBookId,
            status: 'active',
          },
        })
      }

      const maxPos = await db.threadQuest.aggregate({
        where: { threadId: thread.id },
        _max: { position: true },
      })
      let pos = (maxPos._max.position ?? 0) + 1
      for (const questId of toLink) {
        const clash = await db.threadQuest.findUnique({
          where: { threadId_questId: { threadId: thread.id, questId } },
        })
        if (clash) continue
        await db.threadQuest.create({
          data: { threadId: thread.id, questId, position: pos },
        })
        pos += 1
        imported += 1
      }
    }

    const threadForHub = await db.questThread.findUnique({
      where: { bookId: input.targetBookId },
      select: { id: true },
    })

    revalidatePath('/admin/books')
    revalidatePath(`/admin/books/${input.targetBookId}`)
    revalidatePath(`/admin/books/${input.targetBookId}/sections`)
    if (input.targetSectionId?.trim()) {
      revalidatePath(`/admin/books/${input.targetBookId}/sections/${input.targetSectionId.trim()}`)
    }
    if (threadForHub) revalidatePath(`/admin/journeys/thread/${threadForHub.id}`)
    return { success: true as const, imported }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Import failed' }
  }
}
