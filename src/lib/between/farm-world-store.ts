import type { Prisma, PrismaClient } from '@prisma/client'
import { asWorld, attachAfter, change, forPlayer, revert, type Input, type Outcome, type WorldDoc } from './farm-world'

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
