import 'server-only'
import { db } from '@/lib/db'
import { loadActiveLensGoals } from './menu-data'
import { GOLD_TYPE, SCROLL_TYPE, parseMeta } from './council-scroll'
import { toUnchosen, UNCHOSEN_WINDOW_DAYS, type UnchosenLine } from './unchosen'
import type { LivePitch, ReadPlan } from './unchosen-read'
import { toWholeContext, type WholeContext, type WholeYes } from './unchosen-whole'
import { parseSince, toVeinHistory } from './vein-history'

/** Compost records the council's read wrote (contract 3). */
export const COMPOST_OUTCOME = 'unchosen_read'

/** Every unchosen line in the view's window, for the view and the whole-context read (the same lines in both). */
export async function loadPile(playerId: string, today: Date): Promise<UnchosenLine[]> {
  const since = new Date(today.getTime() - UNCHOSEN_WINDOW_DAYS * 86_400_000)
  const rows = await db.tapTheVeinDailySession.findMany({
    where: { playerId, sessionDate: { gte: since, lt: today } },
    select: { sessionDate: true, brainstormCandidates: true, morningMenu: true, tasks: { select: { originalText: true } } },
  })
  return toUnchosen(rows, today.toISOString().slice(0, 10))
}

const dayOf = (d: Date) => d.toISOString().slice(0, 10)

/** Keys an earlier read already handled: gold it kept (the BAR's `itemKey`) and fragments it composted. */
async function handledKeys(playerId: string): Promise<Set<string>> {
  const [gold, ledger] = await Promise.all([
    db.customBar.findMany({ where: { creatorId: playerId, type: GOLD_TYPE }, select: { strandMetadata: true } }),
    db.compostLedger.findMany({ where: { playerId, outcome: COMPOST_OUTCOME }, select: { salvagePayload: true } }),
  ])
  const keys = new Set<string>()
  for (const g of gold) {
    const k = parseMeta(g.strandMetadata).itemKey
    if (typeof k === 'string') keys.add(k)
  }
  for (const l of ledger) {
    const k = parseMeta(l.salvagePayload).itemKey
    if (typeof k === 'string') keys.add(k)
  }
  return keys
}

/** The keys of fragments the read composted: "Not chosen" shows these muted as residue (FR-013). */
export async function loadResidueKeys(playerId: string): Promise<Set<string>> {
  const ledger = await db.compostLedger.findMany({ where: { playerId, outcome: COMPOST_OUTCOME }, select: { salvagePayload: true } })
  const keys = new Set<string>()
  for (const l of ledger) {
    const k = parseMeta(l.salvagePayload).itemKey
    if (typeof k === 'string') keys.add(k)
  }
  return keys
}

/** Weeks of the council's scrolls, newest first. A week read once is read.  */
async function readWeeks(playerId: string): Promise<string[]> {
  const scrolls = await db.customBar.findMany({
    where: { creatorId: playerId, type: SCROLL_TYPE },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { strandMetadata: true },
  })
  return scrolls.flatMap((s) => {
    const w = parseMeta(s.strandMetadata).weekOf
    return typeof w === 'string' ? [w] : []
  })
}

export async function weekRead(playerId: string, week: string): Promise<boolean> {
  return (await readWeeks(playerId)).includes(week)
}

export async function livePitches(playerId: string): Promise<LivePitch[]> {
  const rows = await db.tapTheVeinUnchosenPitch.findMany({
    where: { playerId, status: 'live' }, select: { id: true, word: true, pitch: true, weekOf: true },
  })
  return rows.map((r) => ({ ...r, weekOf: dayOf(r.weekOf) }))
}

/** Offered nuggets he answered Yes whose move the council has not carried into its strand yet. */
async function loadYes(playerId: string): Promise<WholeYes[]> {
  const rows = await db.customBar.findMany({
    where: { creatorId: playerId, type: GOLD_TYPE }, orderBy: { createdAt: 'desc' }, take: 200,
    select: { id: true, title: true, strandMetadata: true },
  })
  return rows.flatMap((r) => {
    const m = parseMeta(r.strandMetadata)
    if (m.fate !== 'offered' || m.answer !== 'yes' || m.carriedAt) return []
    const s = (v: unknown) => (typeof v === 'string' && v ? v : null)
    return [{ goldId: r.id, title: r.title, strand: s(m.strand), strandTitle: s(m.strandTitle), move: s(m.move) ?? '', answeredAt: s(m.answeredAt) }]
  })
}

/** The council carried these nuggets' steps into their strands' callsheets: write `carriedAt` once each (FR-005). */
export async function markCarried(playerId: string, ids: string[]): Promise<number> {
  const rows = await db.customBar.findMany({
    where: { id: { in: ids }, creatorId: playerId, type: GOLD_TYPE }, select: { id: true, strandMetadata: true },
  })
  const now = new Date().toISOString()
  let n = 0
  for (const r of rows) {
    const m = parseMeta(r.strandMetadata)
    if (m.carriedAt || m.fate === 'kept') continue
    await db.customBar.update({ where: { id: r.id }, data: { strandMetadata: JSON.stringify({ ...m, carriedAt: now }) } })
    n++
  }
  return n
}

/**
 * Everything the council reads in one go (FR-001, contract 1): free writes, unchosen lines, seeds, the old pitches and
 * his Lens goals, over `since` (the view's 60-day window by default), leaving out what an earlier read handled.
 */
export async function loadWholeContext(playerId: string, today: Date, sinceParam: string | null): Promise<WholeContext> {
  const fallback = dayOf(new Date(today.getTime() - UNCHOSEN_WINDOW_DAYS * 86_400_000))
  const since = parseSince(sinceParam ?? fallback, today) ?? parseSince(fallback, today)!
  const sessions = await db.tapTheVeinDailySession.findMany({
    where: { playerId, sessionDate: { gte: since } },
    orderBy: { sessionDate: 'asc' },
    select: {
      sessionDate: true, status: true, sealedAt: true, rawEntry: true, wordCount: true, lensCategory: true,
      brainstormCandidates: true, morningMenu: true,
      tasks: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, originalText: true, status: true, lensGoalId: true, barId: true, questId: true, chargeLevel: true,
          blockedAt: true, carryCount: true, completedAt: true, compostReason: true,
        },
      },
    },
  })
  const day = dayOf(today)
  const [handled, live, goals, weeks, yes] = await Promise.all([
    handledKeys(playerId), livePitches(playerId), loadActiveLensGoals(playerId), readWeeks(playerId), loadYes(playerId),
  ])
  return toWholeContext({
    pile: toUnchosen(sessions, day),
    history: toVeinHistory(sessions, [], since, today),
    pitches: live,
    lensGoals: goals.map((g) => ({ id: g.id, title: g.title })),
    today: day,
    lastRead: weeks.sort().reverse()[0] ?? null,
    handled,
    yes,
  })
}

/**
 * Write a checked read in one transaction (FR-003, FR-008, FR-012): the `council_scroll` BAR, one `unchosen_gold` BAR
 * per nugget, a `CompostLedger` row per composted fragment, and the old read's live pitches composted. Returns ids.
 */
export async function writeGoldRead(
  playerId: string,
  plan: ReadPlan,
): Promise<{ scrollId: string; goldIds: string[]; composted: number }> {
  return db.$transaction(async (tx) => {
    const scroll = await tx.customBar.create({
      data: {
        creatorId: playerId,
        title: 'The council’s scroll',
        description: 'The council’s weekly read of his writing.',
        type: SCROLL_TYPE,
        visibility: 'private',
        strandMetadata: JSON.stringify({ source: 'unchosen-gold', weekOf: plan.weekOf, goldIds: [], compostLine: plan.compostLine, openedAt: null }),
      },
      select: { id: true },
    })
    const goldIds: string[] = []
    for (const g of plan.gold) {
      const bar = await tx.customBar.create({
        data: {
          creatorId: playerId,
          title: g.title,
          description: g.quote,
          type: GOLD_TYPE,
          visibility: 'private',
          gmFace: g.face,
          ...(g.lensGoalId ? { lensGoalId: g.lensGoalId } : {}),
          strandMetadata: JSON.stringify({
            source: 'unchosen-gold', scrollId: scroll.id, day: g.day, from: g.from, itemKey: g.itemKey, kind: g.kind,
            reason: g.reason, fate: g.fate, strand: g.strand, ...(g.strandTitle ? { strandTitle: g.strandTitle } : {}),
            move: g.move ?? null, answer: null, answeredAt: null, carriedAt: null,
          }),
        },
        select: { id: true },
      })
      goldIds.push(bar.id)
    }
    await tx.customBar.update({
      where: { id: scroll.id },
      data: { strandMetadata: JSON.stringify({ source: 'unchosen-gold', weekOf: plan.weekOf, goldIds, compostLine: plan.compostLine, openedAt: null }) },
    })
    for (const c of plan.compost) {
      await tx.compostLedger.create({
        data: {
          playerId,
          sourceIdsJson: '[]',
          outcome: COMPOST_OUTCOME,
          salvagePayload: JSON.stringify({ itemKey: c.itemKey, salvageLines: c.salvage, tags: [c.feeds], releaseNote: c.lesson, scrollId: scroll.id }),
        },
      })
    }
    if (plan.pitchIds.length) {
      await tx.tapTheVeinUnchosenPitch.updateMany({
        where: { id: { in: plan.pitchIds }, playerId, status: 'live' },
        data: { status: 'composted', compostedAt: new Date() },
      })
    }
    return { scrollId: scroll.id, goldIds, composted: plan.compost.length }
  })
}
