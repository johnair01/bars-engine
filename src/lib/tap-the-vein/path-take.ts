import { db } from '@/lib/db'
import { nextHistoricalPriorityRank } from './commit-policy'
import { ttvNextDay } from './day'
import { pathFor, type TtvPath } from './paths'

export type PathTakeRecord =
  | { kind: 'free-write'; sessionId: string }
  | { kind: 'task'; taskId: string; sessionId: string; source: string; day: string }

const MAX_LINE = 1000

/** The line a Take stores: the path's stamp, then what he wrote. */
export function takeText(path: TtvPath, raw: string): string {
  return `${path.stamp}${raw.trim()}`.slice(0, MAX_LINE)
}

/**
 * Write what a path's Take writes. `today` is the sitting's day (a UTC-midnight Date, from the 4 AM helper).
 * Server only: it takes a playerId, so it is never a server action.
 */
export async function writePathTake(playerId: string, face: string, raw: string, today: Date): Promise<PathTakeRecord | { error: string }> {
  const path = pathFor(face)
  if (!path) return { error: 'No such path' }
  const text = (raw ?? '').trim()
  if (!text) return { error: 'Write a line first' }
  if (text.length > MAX_LINE) return { error: 'That line is too long' }

  if (path.take.kind === 'free-write') {
    const session = await db.tapTheVeinDailySession.findUnique({
      where: { playerId_sessionDate: { playerId, sessionDate: today } },
      select: { id: true, rawEntry: true },
    })
    if (!session) return { error: 'Open the book first' }
    const rawEntry = session.rawEntry ? `${session.rawEntry}\n${text}` : text
    await db.tapTheVeinDailySession.update({
      where: { id: session.id },
      data: { rawEntry, wordCount: rawEntry.trim().split(/\s+/).filter(Boolean).length },
    })
    return { kind: 'free-write', sessionId: session.id }
  }

  const { source, day } = path.take
  const sessionDate = day === 'tomorrow' ? ttvNextDay(today) : today
  const session = await db.tapTheVeinDailySession.upsert({
    where: { playerId_sessionDate: { playerId, sessionDate } },
    update: {},
    create: { playerId, sessionDate, rawEntry: '', wordCount: 0 },
    select: { id: true },
  })
  const max = await db.tapTheVeinTask.aggregate({ where: { dailySessionId: session.id }, _max: { priorityRank: true } })
  const task = await db.tapTheVeinTask.create({
    data: {
      playerId,
      dailySessionId: session.id,
      originalText: takeText(path, text),
      source,
      lensFaceKey: path.face,
      priorityRank: nextHistoricalPriorityRank(max._max.priorityRank),
    },
    select: { id: true },
  })
  return { kind: 'task', taskId: task.id, sessionId: session.id, source, day: sessionDate.toISOString().slice(0, 10) }
}
