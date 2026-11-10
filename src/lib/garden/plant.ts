/**
 * Shared "plant a BAR in the Garden" writer — the single seam used by both the
 * in-ritual Tap the Vein plant gesture (`plantTask`) and the standalone
 * Hand/Vault → Garden plant (`plantBarToGarden`). Plain module (no `'use server'`)
 * so both server-action files can import it.
 *
 * Planting: set `gardenId` (membership = planted) + the EA triad (load-bearing
 * for lens/campaign alignment + emotional-alchemy moves), mature the seed out of
 * the holding pen to `context_named` (so it homes in the Garden and leaves the
 * Hand/Vault movable set — `isHandVaultMovable` excludes `context_named`), and
 * free any Hand slot it occupied (a planted seed lives in the Garden, not the Hand).
 */

import { db } from '@/lib/db'
import { personalGardenId } from '@/lib/lenses/ensure'
import { mergeSeedMetabolization, parseSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import type { SeedPlant } from '@/lib/bar-seed-metabolization/types'
import { getInnerGardenEligibilityReason, type InnerGardenBarCandidate } from '@/lib/inner-garden/bridge'
import type { Prisma } from '@prisma/client'
import { elementOf, plant as newPlant, tend as tendRule, cleanMana, harvestOf } from '../../../public/between/seedbed.js'

/** Separator for multiselect EA-triad values stored as a single string (matches garden.ts firstOf). */
export const EA_SEP = ' | '

export async function writePlantTriadToBar(
  playerId: string,
  barId: string,
  triad: { experienceIntent: string; dissatisfaction: string[]; satisfaction: string[] },
): Promise<void> {
  const existing = await db.customBar.findUnique({
    where: { id: barId },
    select: { seedMetabolization: true },
  })
  await db.customBar.update({
    where: { id: barId },
    data: {
      gardenId: personalGardenId(playerId),
      experienceIntent: triad.experienceIntent,
      dissatisfaction: triad.dissatisfaction.join(EA_SEP),
      satisfaction: triad.satisfaction.join(EA_SEP),
      seedMetabolization: mergeSeedMetabolization(existing?.seedMetabolization ?? null, {
        maturity: 'context_named',
      }),
    },
  })
  await db.handSlot.updateMany({
    where: { playerId, barId },
    data: { barId: null, isCarrying: false },
  })
}

/* ---------- the BARs garden, slice 1: the seed bed in the hollow (Six-faces-council bars-garden) ----------
 * One plant per BAR, kept on its seed record (bg2-one-plant-record). Planting goes through writePlantTriadToBar, the
 * one writer, so the seed leaves the holding pen for `context_named`; then the plant record is written beside maturity.
 * Mana is held in the homeroom's pouch beside embers, by element (bgb-mana-and-embers); a tend takes one of the plant's
 * element, once a day, and the rules are the page's own (public/between/seedbed.js). */

export type SeedbedResult =
  | { ok: true; plant: SeedPlant; mana?: Partial<Record<string, number>> }
  | { ok: false; status: number; why: string }

const SEED_SELECT = {
  id: true, title: true, description: true, type: true, creatorId: true, status: true, archivedAt: true,
  seedMetabolization: true, nation: true, intensity: true, campaignRef: true, gameMasterFace: true, hexagramId: true,
  isSystem: true, inviteId: true, mergedIntoId: true, emotionalAlchemyTag: true,
  experienceIntent: true, dissatisfaction: true, satisfaction: true,
} as const

/** Plant a light BAR from the seed bag in the hollow's bed, with the player's line of intent or none. */
export async function plantInHollow(playerId: string, barId: string, intent?: string): Promise<SeedbedResult> {
  const bar = await db.customBar.findUnique({ where: { id: barId }, select: SEED_SELECT })
  if (!bar) return { ok: false, status: 404, why: 'gone' }
  const seed = parseSeedMetabolization(bar.seedMetabolization)
  if (seed.plant) return { ok: false, status: 409, why: 'planted' }
  const not = getInnerGardenEligibilityReason(bar as unknown as InnerGardenBarCandidate, playerId)
  if (not) return { ok: false, status: not === 'not-owned' ? 403 : 400, why: not }
  const r = newPlant(null, { bed: 'hollow', element: elementOf(bar), intent })
  if (r.ok === false) return { ok: false, status: 400, why: r.why }
  const split = (s: string | null) => (s ? s.split(EA_SEP).filter(Boolean) : [])
  await writePlantTriadToBar(playerId, barId, {
    experienceIntent: bar.experienceIntent ?? '',
    dissatisfaction: split(bar.dissatisfaction),
    satisfaction: split(bar.satisfaction),
  })
  const after = await db.customBar.findUnique({ where: { id: barId }, select: { seedMetabolization: true } })
  await db.customBar.update({
    where: { id: barId },
    data: { seedMetabolization: mergeSeedMetabolization(after?.seedMetabolization ?? null, { plant: r.plant as SeedPlant }) },
  })
  return { ok: true, plant: r.plant as SeedPlant }
}

const asDoc = (v: Prisma.JsonValue | null | undefined): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** The homeroom's pouch row, where mana is held (one purse wherever the player walks). */
async function homePouch(tx: Prisma.TransactionClient, playerId: string) {
  const rows = await tx.betweenMember.findMany({ where: { playerId }, include: { garden: true } })
  const home = rows.find(r => asDoc(r.garden.data).kind === 'home')
  if (!home) return null
  const row = await tx.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId: home.gardenId, playerId, key: 'pouch' } } })
  return { gardenId: home.gardenId, doc: asDoc(row?.data) }
}

/** The mana the player holds, by element (none when there is no homeroom yet). */
export async function manaOf(playerId: string): Promise<Partial<Record<string, number>>> {
  const p = await homePouch(db as unknown as Prisma.TransactionClient, playerId)
  return cleanMana(p?.doc.mana)
}

/** Tend a plant: one mana of its element leaves the homeroom's pouch and the plant takes the tend. Refused, changing
    nothing, without mana of that element or when it was tended today. */
export async function tendPlant(playerId: string, barId: string): Promise<SeedbedResult> {
  return db.$transaction(async tx => {
    const bar = await tx.customBar.findUnique({ where: { id: barId }, select: { creatorId: true, seedMetabolization: true } })
    if (!bar) return { ok: false as const, status: 404, why: 'gone' }
    if (bar.creatorId !== playerId) return { ok: false as const, status: 403, why: 'not-owned' }
    const seed = parseSeedMetabolization(bar.seedMetabolization)
    if (!seed.plant) return { ok: false as const, status: 400, why: 'none' }
    const pouch = await homePouch(tx, playerId)
    const r = tendRule(seed.plant, cleanMana(pouch?.doc.mana))
    if (r.ok === false) return { ok: false as const, status: 409, why: r.why }
    await tx.betweenPrivate.update({
      where: { gardenId_playerId_key: { gardenId: pouch!.gardenId, playerId, key: 'pouch' } },
      data: { data: { ...pouch!.doc, mana: r.mana } as Prisma.InputJsonValue },
    })
    await tx.customBar.update({
      where: { id: barId },
      data: { seedMetabolization: mergeSeedMetabolization(bar.seedMetabolization, { plant: r.plant as SeedPlant }) },
    })
    return { ok: true as const, plant: r.plant as SeedPlant, mana: r.mana }
  })
}

/** The harvest's one shape, from either bed (slice 3 harvests; the contract stands now). */
export { harvestOf }
