import type { Prisma, PrismaClient } from '@prisma/client'
import { asSeeds, asWorld, attachAfter, change, forPlayer, openParcel, revert, type Input, type Outcome, type Seed, type WorldDoc } from './farm-world'

/**
 * The farm-world doc in BetweenPrivate (key "farm-world"), read and written by playerId and homeroom id. The caller
 * resolves the homeroom (`ensureHome`), so this file holds only the document move and a test hands it a small db.
 */
type Db = Pick<PrismaClient, 'betweenPrivate'>
const KEY = 'farm-world'
const where = (gardenId: string, playerId: string) => ({ gardenId_playerId_key: { gardenId, playerId, key: KEY } })

export async function loadWorld(db: Db, gardenId: string, playerId: string): Promise<WorldDoc> {
  const row = await db.betweenPrivate.findUnique({ where: where(gardenId, playerId) })
  return asWorld(row?.data)
}

export async function saveWorld(db: Db, gardenId: string, playerId: string, doc: WorldDoc) {
  const data = doc as unknown as Prisma.InputJsonValue
  await db.betweenPrivate.upsert({ where: where(gardenId, playerId), create: { gardenId, playerId, key: KEY, data }, update: { data } })
}

export async function worldForPlayer(db: Db, gardenId: string, playerId: string) {
  return forPlayer(await loadWorld(db, gardenId, playerId))
}

/** One agent change: apply a data change at once, or keep a rule request as a not-yet. Invalid calls write nothing. */
export async function agentChange(db: Db, gardenId: string, playerId: string, input: Input, now: string): Promise<Outcome> {
  const out = change(await loadWorld(db, gardenId, playerId), input, now)
  if (out.tier !== 'invalid') await saveWorld(db, gardenId, playerId, out.doc)
  return out
}

export async function agentAfter(db: Db, gardenId: string, playerId: string, id: string, after: unknown, now: string) {
  const r = attachAfter(await loadWorld(db, gardenId, playerId), id, after, now)
  if (r.ok) await saveWorld(db, gardenId, playerId, r.doc)
  return r
}

export async function agentRevert(db: Db, gardenId: string, playerId: string, id: string, lane: string, now: string) {
  const r = revert(await loadWorld(db, gardenId, playerId), id, lane, now)
  if (r.ok) await saveWorld(db, gardenId, playerId, r.doc)
  return r
}

/** The satchel (BetweenPrivate key "pouch"): only `seeds` is written here; embers and the hollow stay as they are. */
const POUCH = 'pouch'
const pouchWhere = (gardenId: string, playerId: string) => ({ gardenId_playerId_key: { gardenId, playerId, key: POUCH } })
type Tx = Pick<PrismaClient, 'betweenPrivate'>

export async function loadSeeds(db: Tx, gardenId: string, playerId: string): Promise<Seed[]> {
  const row = await db.betweenPrivate.findUnique({ where: pouchWhere(gardenId, playerId) })
  return asSeeds((row?.data as { seeds?: unknown } | undefined)?.seeds)
}

async function saveSeeds(db: Tx, gardenId: string, playerId: string, seeds: Seed[]) {
  const row = await db.betweenPrivate.findUnique({ where: pouchWhere(gardenId, playerId) })
  const cur = row?.data && typeof row.data === 'object' && !Array.isArray(row.data) ? (row.data as Record<string, unknown>) : {}
  const data = { ...cur, seeds } as unknown as Prisma.InputJsonValue
  await db.betweenPrivate.upsert({ where: pouchWhere(gardenId, playerId), create: { gardenId, playerId, key: POUCH, data }, update: { data } })
}

type Txn = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>

/** Take or compost a parcel in one transaction; a second take of an opened parcel adds nothing. */
export async function parcelAct(txn: Txn, gardenId: string, playerId: string, id: string, act: unknown, now: string) {
  return txn(async tx => {
    const r = openParcel(await loadWorld(tx, gardenId, playerId), await loadSeeds(tx, gardenId, playerId), id, act, now)
    if (r.ok && r.changed) { await saveWorld(tx, gardenId, playerId, r.doc); await saveSeeds(tx, gardenId, playerId, r.seeds) }
    return { ok: r.ok, why: r.why, state: r.state, seeds: r.seeds }
  })
}

export const worldAndSeeds = async (db: Tx, gardenId: string, playerId: string) =>
  ({ world: await worldForPlayer(db, gardenId, playerId), satchelSeeds: (await loadSeeds(db, gardenId, playerId)).map(({ id, label }) => ({ id, label })) })

/**
 * Plant a satchel seed in one transaction. `run` plants it on the farm (the farm's own rule decides, so untilled soil
 * refuses); only when it says ok does the seed leave the satchel, so a refusal leaves everything as it was.
 */
export async function plantSeedAct(
  txn: Txn, gardenId: string, playerId: string, seedId: string,
  run: (tx: Tx, seed: Seed) => Promise<{ ok: boolean; why?: string }>,
) {
  return txn(async tx => {
    const seeds = await loadSeeds(tx, gardenId, playerId)
    const seed = seeds.find(x => x.id === seedId)
    if (!seed) return { ok: false as const, why: 'That seed is not in your satchel' }
    const r = await run(tx, seed)
    if (!r.ok) return { ok: false as const, why: r.why }
    await saveSeeds(tx, gardenId, playerId, seeds.filter(x => x.id !== seedId))
    return { ok: true as const }
  })
}
