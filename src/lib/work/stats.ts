import type { PrismaClient } from '@prisma/client'
import { LANES } from './lanes'

/**
 * What each environment has done, and how hard it found the work.
 *
 * Two lanes can run the same model and still differ as environments, so the queue measures them the same way rather
 * than by impression: how much each lane finished, how many tries it took, how long a ticket took from queue to done,
 * and how often "done" carries a link a person can open. `attempts` counts claims, so a median of 1 means the lane
 * took the ticket and finished it, and a median of 4 means it was handed back or abandoned three times first.
 *
 * The judgement stays with Wendell: these are the numbers a quality note argues from, not a score.
 */
export interface LaneStats {
  lane: string
  ready: number
  claimed: number
  held: number
  /** Done inside the window. */
  done: number
  attemptsMedian: number | null
  attemptsMax: number | null
  /** Hours from the ticket being queued to it being done. */
  hoursMedian: number | null
  /** The share of done tickets whose result carries a URL (a pull request), 0-1. */
  linkedShare: number | null
  lastDoneAt: string | null
}

export interface DoneTicket {
  lane: string
  attempts: number
  createdAt: Date
  doneAt: Date | null
  result: string | null
}

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const round = (n: number | null, dp = 1) => (n === null ? null : Math.round(n * 10 ** dp) / 10 ** dp)

/** Pure: the arithmetic, so it can be checked without a database. */
export function summarise(counts: { lane: string; state: string; n: number }[], done: DoneTicket[],
                          lanes: readonly string[] = LANES): LaneStats[] {
  const n = (lane: string, state: string) => counts.find(c => c.lane === lane && c.state === state)?.n ?? 0
  return lanes.map(lane => {
    const mine = done.filter(t => t.lane === lane)
    const hours = mine.filter(t => t.doneAt).map(t => (t.doneAt!.getTime() - t.createdAt.getTime()) / 3_600_000)
    const linked = mine.filter(t => t.result && /https?:\/\//.test(t.result)).length
    const last = mine.reduce<Date | null>((a, t) => (t.doneAt && (!a || t.doneAt > a) ? t.doneAt : a), null)
    return {
      lane,
      ready: n(lane, 'ready'), claimed: n(lane, 'claimed'), held: n(lane, 'held'), done: mine.length,
      attemptsMedian: median(mine.map(t => t.attempts)),
      attemptsMax: mine.length ? Math.max(...mine.map(t => t.attempts)) : null,
      hoursMedian: round(median(hours)),
      linkedShare: mine.length ? round(linked / mine.length, 2) : null,
      lastDoneAt: last ? last.toISOString() : null,
    }
  })
}

export async function laneStats(db: PrismaClient, days = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 86_400_000)
  const grouped = await db.workTicket.groupBy({ by: ['lane', 'state'], _count: { _all: true } })
  const done = await db.workTicket.findMany({ where: { state: 'done', doneAt: { gte: since } },
    select: { lane: true, attempts: true, createdAt: true, doneAt: true, result: true } })
  return {
    asOf: now.toISOString(),
    days,
    lanes: summarise(grouped.map(g => ({ lane: g.lane, state: g.state, n: g._count._all })), done),
  }
}
