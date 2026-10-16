/**
 * The Council Board's seal writes each item to bars-engine as a task (`ttv-one-store`, pass ttv-loop 1,
 * six-faces-council council/passes/6FACE_PASS_ttv-loop1_2026-10-16.md).
 *
 * Before this, an item sealed on the board lived only in the board's store and got an alignment line in the council
 * repo; it never reached bars-engine, so one commitment could become six records with no shared id (Challenger).
 * Now the save of `morning/menu` on board=council creates one TapTheVeinTask per item, with `source: "board"`, and
 * writes each task's id back into the saved menu as `taskId`. The board read, the menu export and any thread then
 * carry the same id.
 *
 * Rules:
 * - Only the sealed menu is read. The free write never comes here (`mm-raw`; the save route already refuses a menu
 *   carrying `rawEntry`), and a session created for the day is seeded with an empty rawEntry.
 * - Safe to save twice: an item whose text already has a board task on that day reuses it.
 * - No quest is minted and no BAR is linked: a task links to a BAR only when he keeps it as one (Challenger), so
 *   `barId` starts empty.
 * - Board tasks do not count against the five-commitment cap of a Tap the Vein day: the board's list is everything
 *   he can do today, not the moves he commits to (src/actions/tap-the-vein.ts, commitTask).
 */

import type { Prisma } from '@prisma/client'
import { normalizeLineKey } from './menu'

export const BOARD_TASK_SOURCE = 'board'

export type BoardSealItem = {
  key: string
  text: string
  source?: string
  taskId?: string | null
  barId?: string | null
  [extra: string]: unknown
}

export type BoardSealMenu = {
  sessionDate: string
  items: BoardSealItem[]
  [extra: string]: unknown
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_TEXT = 2000

/** The board's sealed menu JSON, or null when it is not one this module can write. */
export function parseBoardSeal(menu: string): BoardSealMenu | null {
  let m: unknown
  try { m = JSON.parse(menu) } catch { return null }
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  if (typeof o.sessionDate !== 'string' || !DATE.test(o.sessionDate) || !Array.isArray(o.items)) return null
  const items = o.items.filter((i): i is BoardSealItem =>
    !!i && typeof i === 'object' && typeof (i as BoardSealItem).key === 'string' && typeof (i as BoardSealItem).text === 'string'
    && (i as BoardSealItem).text.trim().length > 0)
  return { ...o, sessionDate: o.sessionDate, items } as BoardSealMenu
}

/** The texts that still need a task: one per distinct line, in order, skipping ones that already have a task. */
export function textsToCreate(items: BoardSealItem[], existing: Map<string, unknown>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const k = normalizeLineKey(item.text)
    if (!k || seen.has(k) || existing.has(k)) continue
    seen.add(k)
    out.push(item.text.trim().slice(0, MAX_TEXT))
  }
  return out
}

/** The menu with each item's `taskId` and `barId` filled from the day's board tasks, keyed by normalized text. */
export function withTaskIds(menu: BoardSealMenu, tasks: Map<string, { id: string; barId: string | null }>): BoardSealMenu {
  return {
    ...menu,
    items: menu.items.map((item) => {
      const t = tasks.get(normalizeLineKey(item.text))
      return t ? { ...item, taskId: t.id, barId: t.barId } : item
    }),
  }
}

type Tx = Prisma.TransactionClient

/**
 * Create the day's board tasks for a sealed menu and return the menu JSON carrying their ids. Runs in one
 * transaction; the caller saves the returned string as the board doc.
 */
export async function writeBoardSeal(tx: Tx, playerId: string, menuJson: string): Promise<string> {
  const menu = parseBoardSeal(menuJson)
  if (!menu || menu.items.length === 0) return menuJson
  const sessionDate = new Date(`${menu.sessionDate}T00:00:00.000Z`)
  const session = await tx.tapTheVeinDailySession.upsert({
    where: { playerId_sessionDate: { playerId, sessionDate } },
    create: { playerId, sessionDate, rawEntry: '', wordCount: 0 },
    update: {},
    select: { id: true },
  })
  const prior = await tx.tapTheVeinTask.findMany({
    where: { dailySessionId: session.id, source: BOARD_TASK_SOURCE },
    select: { id: true, originalText: true, barId: true },
  })
  const byText = new Map(prior.map((t) => [normalizeLineKey(t.originalText), { id: t.id, barId: t.barId }]))
  const texts = textsToCreate(menu.items, byText)
  if (texts.length) {
    const max = await tx.tapTheVeinTask.aggregate({ where: { dailySessionId: session.id }, _max: { priorityRank: true } })
    let rank = max._max.priorityRank ?? 0
    for (const text of texts) {
      rank += 1
      const t = await tx.tapTheVeinTask.create({
        data: { playerId, dailySessionId: session.id, originalText: text, source: BOARD_TASK_SOURCE, priorityRank: rank },
        select: { id: true, originalText: true, barId: true },
      })
      byText.set(normalizeLineKey(t.originalText), { id: t.id, barId: t.barId })
    }
  }
  return JSON.stringify(withTaskIds(menu, byText))
}
