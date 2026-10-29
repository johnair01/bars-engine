'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { emptyConstellation } from '@/lib/dojo-practice/constellation'
import { barContext, cleanArrival, makeEmber, returnOutcome, type ExitId } from '@/lib/dojo-practice/lifecycle'
import { sanitizeConstellation } from '@/lib/dojo-practice/validate'
import { ELEMENTS, MAX_TEXT_LENGTH, OUTCOME_KINDS, type Constellation, type Element, type OutcomeKind, type PracticeContext } from '@/lib/dojo-practice/types'

/**
 * Dojo practice persistence. Every read and write is scoped to the signed-in player; the raw Thought String never
 * leaves that scope. The tutorial has no actions here on purpose: it runs in the browser and writes nothing.
 * Spec: .specify/specs/dojo-entry-practice-seeds/spec.md
 */

type PracticeKind = 'seed' | 'incipient_bar' | 'bar'
type Err = { error: string }

async function playerId(): Promise<string | null> {
  const fromCookie = (await cookies()).get('bars_player_id')?.value
  if (fromCookie) return fromCookie
  if (process.env.NODE_ENV === 'development' && process.env.DEV_PLAYER_ID) return process.env.DEV_PLAYER_ID
  return null
}

const json = (v: unknown) => v as Prisma.InputJsonValue
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export type PracticeView = {
  id: string
  kind: PracticeKind
  context: PracticeContext
  status: string
  title: string | null
  intention: string | null
  platform: string[]
  spiritId: string | null
  barId: string | null
  bar?: { id: string; title: string; element?: Element }
  constellation: Constellation
  outcomes: Array<{ kind: OutcomeKind; summary: string; createdAt: string }>
}

function contextFor(row: { id: string; kind: string; barId: string | null }): PracticeContext {
  if (row.kind === 'bar' && row.barId) return { kind: 'bar', barId: row.barId }
  if (row.kind === 'incipient_bar') return { kind: 'incipient_bar', draftId: row.id }
  return { kind: 'seed', seedId: row.id }
}

async function view(row: NonNullable<Awaited<ReturnType<typeof db.dojoPractice.findFirst>>>): Promise<PracticeView> {
  const bar = row.barId
    ? await db.customBar.findFirst({ where: { id: row.barId, creatorId: row.playerId }, select: { id: true, title: true, emotionalAlchemyTag: true } })
    : null
  return {
    id: row.id, kind: row.kind as PracticeKind, context: contextFor(row), status: row.status, title: row.title, intention: row.intention,
    platform: asStrings(row.platform), spiritId: row.spiritId, barId: row.barId,
    ...(bar ? { bar: barContext(bar) } : {}),
    constellation: sanitizeConstellation(row.constellation) ?? emptyConstellation(),
    outcomes: (Array.isArray(row.outcomes) ? row.outcomes : []) as PracticeView['outcomes'],
  }
}

/** What the dojo entry screen needs: BAR titles (never their text), the player's open practices, spirits, embers. */
export async function loadDojoHome() {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' } as Err
  const [bars, practices, spirits, emberCount] = await Promise.all([
    db.customBar.findMany({
      where: { creatorId: pid, archivedAt: null, status: 'active', type: { in: ['bar', 'vibe'] } },
      orderBy: { createdAt: 'desc' }, take: 40, select: { id: true, title: true, emotionalAlchemyTag: true },
    }),
    db.dojoPractice.findMany({
      where: { playerId: pid, kind: { in: ['seed', 'incipient_bar'] }, status: { in: ['active', 'settled'] } },
      orderBy: { updatedAt: 'desc' }, take: 20, select: { id: true, kind: true, title: true, intention: true, status: true, updatedAt: true },
    }),
    db.betweenSpirit.findMany({ where: { ownerId: pid }, take: 20, select: { id: true, data: true } }),
    db.dojoEmber.count({ where: { playerId: pid, status: 'held' } }),
  ])
  return {
    bars: bars.map(barContext),
    practices: practices.map(p => ({ id: p.id, kind: p.kind as 'seed' | 'incipient_bar', title: p.title, intention: p.intention, status: p.status, updatedAt: p.updatedAt.toISOString() })),
    spirits: [...new Map(spirits.map(s => {
      const name = s.data && typeof s.data === 'object' && !Array.isArray(s.data) ? (s.data as Record<string, unknown>).name : undefined
      return [s.id, { id: s.id, name: typeof name === 'string' && name.trim() ? name.trim() : 'A spirit' }] as const
    })).values()],
    emberCount,
  }
}

export async function startPractice(input: {
  kind: PracticeKind; barId?: string; title?: string; intention?: string; platform?: string[]; spiritId?: string
}): Promise<{ practice: PracticeView } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  if (!['seed', 'incipient_bar', 'bar'].includes(input.kind)) return { error: 'Unknown practice kind' }
  if (input.kind === 'bar') {
    const own = input.barId && (await db.customBar.findFirst({ where: { id: input.barId, creatorId: pid }, select: { id: true } }))
    if (!own) return { error: 'Choose one of your own BARs' }
  }
  const arrival = cleanArrival({ intention: input.intention, platform: input.platform, spiritId: input.spiritId })
  if (arrival.spiritId) {
    const mine = await db.betweenSpirit.findFirst({ where: { id: arrival.spiritId, ownerId: pid }, select: { id: true } })
    if (!mine) delete arrival.spiritId
  }
  const row = await db.dojoPractice.create({
    data: {
      playerId: pid, kind: input.kind, barId: input.kind === 'bar' ? input.barId : null,
      title: input.title?.trim().slice(0, 120) || null, intention: arrival.intention ?? null, platform: json(arrival.platform ?? []),
      spiritId: arrival.spiritId ?? null, constellation: json(emptyConstellation()),
    },
  })
  return { practice: await view(row) }
}

export async function loadPractice(id: string): Promise<{ practice: PracticeView } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  const row = await db.dojoPractice.findFirst({ where: { id, playerId: pid, status: { in: ['active', 'settled'] } } })
  return row ? { practice: await view(row) } : { error: 'That practice is not here any more' }
}

/** Autosave. The constellation is rebuilt through the validator, so a bad client cannot store a shape the grammar refuses. */
export async function savePractice(id: string, constellation: unknown, intention?: string): Promise<{ ok: true } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  const clean = sanitizeConstellation(constellation)
  if (!clean) return { error: 'Could not read that constellation' }
  const res = await db.dojoPractice.updateMany({
    where: { id, playerId: pid, status: { in: ['active', 'settled'] } },
    data: { constellation: json(clean), status: 'active', ...(intention !== undefined ? { intention: intention.trim().slice(0, MAX_TEXT_LENGTH) || null } : {}) },
  })
  return res.count ? { ok: true } : { error: 'That practice is not here any more' }
}

/** Exits. `restart`, `make_mine`, `return_nook` and `return_bar` leave without changing anything here. */
export async function exitPractice(id: string, exit: ExitId, constellation?: unknown): Promise<{ status: string; barId?: string } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  const row = await db.dojoPractice.findFirst({ where: { id, playerId: pid, status: { in: ['active', 'settled'] } } })
  if (!row) return { error: 'That practice is not here any more' }
  const clean = constellation === undefined ? null : sanitizeConstellation(constellation)
  const keep = clean ? { constellation: json(clean) } : {}

  if (exit === 'discard') {
    // A discard removes the player's words; nothing of the practice remains.
    await db.dojoPractice.update({ where: { id }, data: { status: 'discarded', constellation: json(emptyConstellation(row.id)), outcomes: json([]), intention: null, title: null } })
    return { status: 'discarded' }
  }
  if (exit === 'settle') {
    await db.dojoPractice.update({ where: { id }, data: { status: 'settled', ...keep } })
    return { status: 'settled' }
  }
  if (exit === 'plant_bar') {
    const stored = clean ?? sanitizeConstellation(row.constellation)
    const title = (row.title?.trim() || row.intention?.trim() || stored?.words[0]?.label || 'Planted from the dojo').slice(0, 80)
    const description = (row.intention?.trim() || row.title?.trim() || title).slice(0, 2000)
    const bar = await db.customBar.create({
      data: { creatorId: pid, title, description, type: 'bar', reward: 0, visibility: 'private', status: 'active', inputs: '[]', rootId: 'temp' },
    })
    await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
    await db.dojoPractice.update({ where: { id }, data: { status: 'planted', plantedBarId: bar.id, ...keep } })
    revalidatePath('/bars')
    return { status: 'planted', barId: bar.id }
  }
  // keep_drafting, return_bar, return_nook: keep what is there.
  if (clean) await db.dojoPractice.update({ where: { id }, data: { ...keep } })
  return { status: row.status }
}

/** Returns one selected outcome to the BAR this practice is linked to. */
export async function returnOutcomeToBar(id: string, kind: OutcomeKind, summary: string): Promise<{ ok: true } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  if (!OUTCOME_KINDS.includes(kind)) return { error: 'Unknown outcome' }
  const row = await db.dojoPractice.findFirst({ where: { id, playerId: pid, kind: 'bar', status: { in: ['active', 'settled'] } } })
  if (!row?.barId) return { error: 'This practice is not linked to a BAR' }
  try {
    const link = returnOutcome({ barId: row.barId, constellationId: sanitizeConstellation(row.constellation)?.id ?? row.id, selectedOutcomes: (Array.isArray(row.outcomes) ? row.outcomes : []) as never }, kind, summary)
    await db.dojoPractice.update({ where: { id }, data: { outcomes: json(link.selectedOutcomes) } })
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not return that outcome' }
  }
}

/** The outcomes the owner has returned to one BAR. Owner only. */
export async function getBarPracticeOutcomes(barId: string) {
  const pid = await playerId()
  if (!pid) return []
  const rows = await db.dojoPractice.findMany({ where: { playerId: pid, barId, kind: 'bar' }, select: { outcomes: true } })
  return rows.flatMap(r => (Array.isArray(r.outcomes) ? r.outcomes : [])) as PracticeView['outcomes']
}

/** A held ember, made only after an explicit settle (status settled) or return. Held in the satchel; no spirit needed. */
export async function createEmber(id: string, opts: { intensity?: number; element?: Element; ingredients?: string[] }): Promise<{ ok: true; emberId: string } | Err> {
  const pid = await playerId()
  if (!pid) return { error: 'Not logged in' }
  const row = await db.dojoPractice.findFirst({ where: { id, playerId: pid } })
  if (!row || row.status === 'discarded') return { error: 'That practice is not here any more' }
  const constellation = sanitizeConstellation(row.constellation)
  // Ingredients are words the player has on their own wall.
  const onWall = new Set(constellation?.words.map(w => w.label) ?? [])
  const ingredients = (opts.ingredients ?? []).filter(l => onWall.has(l))
  try {
    const ember = makeEmber({
      ctx: contextFor(row), sourceId: row.kind === 'bar' && row.barId ? row.barId : row.id, settled: row.status === 'settled' || row.status === 'planted',
      intensity: opts.intensity, element: opts.element && ELEMENTS.includes(opts.element) ? opts.element : undefined, ingredients,
    })
    await db.dojoEmber.create({
      data: { id: ember.id, playerId: pid, sourceKind: ember.sourceKind, sourceId: ember.sourceId, element: ember.element ?? null, intensity: ember.intensity, selectedIngredients: json(ember.selectedIngredients), status: 'held' },
    })
    return { ok: true, emberId: ember.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not make an ember' }
  }
}
