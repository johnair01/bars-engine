'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type RecordDrawResult = { success: true; entryId: string } | { error: string }

/**
 * Record a card draw in the player's journal.
 * Fire-and-forget safe — the client does not block reveal on this.
 * Non-authed draws are silently ignored.
 */
export async function recordDraw(input: { cardId: string }): Promise<RecordDrawResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const entry = await db.deckJournalEntry.create({
      data: {
        playerId: player.id,
        cardId: input.cardId,
        vibeulons: 1,
      },
    })
    revalidatePath('/deck')
    return { success: true, entryId: entry.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to record draw' }
  }
}

export interface JournalEntry {
  id: string
  cardId: string
  drawnAt: Date
  vibeulons: number
}

export interface DeckStats {
  totalDrawn: number
  streak: number
  vibeulons: number
  entries: JournalEntry[]
}

/**
 * Compute streak as consecutive calendar days (UTC) on which ≥1 card was drawn,
 * counting back from today. A draw today keeps the streak; yesterday's draw starts it.
 */
function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0

  const days = new Set(
    entries.map((e) => {
      const d = new Date(e.drawnAt)
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
    }),
  )

  const today = new Date()
  let streak = 0
  let cursor = new Date(today)

  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`
    if (days.has(key)) {
      streak++
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/** Fetch the player's full draw journal + computed stats (first 100 entries). */
export async function getDeckStats(): Promise<DeckStats | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const rows = await db.deckJournalEntry.findMany({
    where: { playerId: player.id },
    orderBy: { drawnAt: 'desc' },
    take: 100,
    select: { id: true, cardId: true, drawnAt: true, vibeulons: true },
  })

  const entries: JournalEntry[] = rows.map((r: { id: string; cardId: string; drawnAt: Date; vibeulons: number }) => ({
    id: r.id,
    cardId: r.cardId,
    drawnAt: r.drawnAt,
    vibeulons: r.vibeulons,
  }))

  return {
    totalDrawn: entries.length,
    streak: computeStreak(entries),
    vibeulons: entries.reduce((sum, e) => sum + e.vibeulons, 0),
    entries,
  }
}
