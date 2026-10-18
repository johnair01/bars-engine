import 'server-only'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { type Doc, type Op, type Target, type Who, invitedView, itemFor, mayWrite, merge } from './rules'

/**
 * The Between's Postgres store (six-faces-council bh-move-to-bars-engine, 2026-10-17). The page polls one snapshot
 * (garden, items, spirits, daemons, shown, my private note, who is here now) and writes one document at a time.
 */

/** The signed-in player, read without the profile joins getCurrentPlayer makes: the page polls every few seconds. */
export async function currentPlayer(): Promise<{ id: string; name: string } | null> {
  const id = (await cookies()).get('bars_player_id')?.value
  if (!id) return null
  return db.player.findUnique({ where: { id }, select: { id: true, name: true } }).catch(() => null)
}

export const newInviteToken = () => randomBytes(18).toString('base64url')

const asDoc = (v: Prisma.JsonValue | null | undefined): Doc => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Doc) : {})
const asJson = (d: Doc) => d as Prisma.InputJsonValue

export async function whoIs(gardenId: string, playerId: string, invite: unknown) {
  const garden = await db.betweenGarden.findUnique({ where: { id: gardenId } })
  if (!garden) return null
  const member = !!(await db.betweenMember.findUnique({ where: { gardenId_playerId: { gardenId, playerId } } }))
  const invited = typeof invite === 'string' && invite.length > 8 && invite === garden.inviteToken
  return { garden, who: { playerId, member, invited } as Who }
}

/** Presence older than this is someone who left (the page polls every 2.5 s while open). */
const HERE_MS = 12_000

export async function snapshot(gardenId: string, who: Who) {
  const g = await db.betweenGarden.findUnique({ where: { id: gardenId } })
  if (!g) return null
  const data = asDoc(g.data)
  const since = new Date(Date.now() - HERE_MS)
  const presence = await db.betweenPresence.findMany({ where: { gardenId, updatedAt: { gte: since } } })
  const peers = presence.filter(p => p.playerId !== who.playerId).map(p => ({ uid: p.playerId, ...asDoc(p.data) }))
  const jr = data.joinRequest && typeof data.joinRequest === 'object' ? (data.joinRequest as Doc).uid : null
  const ids = new Set<string>([...Object.keys(asDoc(data.members as Prisma.JsonValue)), ...peers.map(p => p.uid)])
  if (typeof jr === 'string') ids.add(jr)
  const people = await db.player.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } })
  const names = Object.fromEntries(people.map(p => [p.id, p.name]))
  if (!who.member) return { member: false, garden: invitedView(data), items: {}, spirits: {}, daemons: {}, shown: {}, mine: {}, names, peers }

  const [items, spirits, daemons, shown, mine] = await Promise.all([
    db.betweenItem.findMany({ where: { gardenId } }),
    db.betweenSpirit.findMany({ where: { gardenId } }),
    db.betweenDaemon.findMany({ where: { gardenId } }),
    db.betweenShown.findMany({ where: { gardenId } }),
    db.betweenPrivate.findMany({ where: { gardenId, playerId: who.playerId } }),
  ])
  const byId = <T extends { data: Prisma.JsonValue }>(rows: T[], key: (r: T) => string) =>
    Object.fromEntries(rows.map(r => [key(r), asDoc(r.data)]))
  return {
    member: true, invite: g.inviteToken, garden: data, names, peers,
    items: Object.fromEntries(items.map(r => [r.id, itemFor(who.playerId, asDoc(r.data))])), spirits: byId(spirits, r => r.id), daemons: byId(daemons, r => r.id),
    shown: byId(shown, r => r.playerId), mine: byId(mine, r => r.key),
  }
}

export async function setPresence(gardenId: string, playerId: string, p: Doc) {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null)
  const data: Doc = { x: num(p.x), z: num(p.z), h: num(p.h), w: !!p.w, tx: num(p.tx), tz: num(p.tz), wave: num(p.wave), s: p.s === 0 || p.s === 1 ? p.s : null }
  await db.betweenPresence.upsert({
    where: { gardenId_playerId: { gardenId, playerId } },
    create: { gardenId, playerId, data: asJson(data) },
    update: { data: asJson(data) },
  })
}

async function current(tx: Prisma.TransactionClient, gardenId: string, t: Target): Promise<Doc | null> {
  const pick = (r: { data: Prisma.JsonValue } | null) => (r ? asDoc(r.data) : null)
  switch (t.table) {
    case 'garden': return pick(await tx.betweenGarden.findUnique({ where: { id: gardenId } }))
    case 'items': return pick(await tx.betweenItem.findUnique({ where: { gardenId_id: { gardenId, id: t.id } } }))
    case 'spirits': return pick(await tx.betweenSpirit.findUnique({ where: { gardenId_id: { gardenId, id: t.id } } }))
    case 'daemons': return pick(await tx.betweenDaemon.findUnique({ where: { gardenId_id: { gardenId, id: t.id } } }))
    case 'shown': return pick(await tx.betweenShown.findUnique({ where: { gardenId_playerId: { gardenId, playerId: t.playerId } } }))
    case 'privates': return pick(await tx.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId, playerId: t.playerId, key: t.key } } }))
  }
}

async function put(tx: Prisma.TransactionClient, gardenId: string, t: Target, d: Doc | null) {
  const data = d && asJson(d)
  switch (t.table) {
    case 'garden':
      if (!data) throw new Error('a garden is not deleted')
      await tx.betweenGarden.update({ where: { id: gardenId }, data: { data } })
      return
    case 'items': {
      const where = { gardenId_id: { gardenId, id: t.id } }
      if (!data) { await tx.betweenItem.deleteMany({ where: { gardenId, id: t.id } }); return }
      await tx.betweenItem.upsert({ where, create: { gardenId, id: t.id, byId: String(d!.by), data }, update: { data } })
      return
    }
    case 'spirits': {
      if (!data) { await tx.betweenSpirit.deleteMany({ where: { gardenId, id: t.id } }); return }
      await tx.betweenSpirit.upsert({ where: { gardenId_id: { gardenId, id: t.id } }, create: { gardenId, id: t.id, ownerId: String(d!.owner), data }, update: { data } })
      return
    }
    case 'daemons': {
      if (!data) { await tx.betweenDaemon.deleteMany({ where: { gardenId, id: t.id } }); return }
      await tx.betweenDaemon.upsert({ where: { gardenId_id: { gardenId, id: t.id } }, create: { gardenId, id: t.id, ownerId: String(d!.owner), data }, update: { data } })
      return
    }
    case 'shown': {
      if (!data) { await tx.betweenShown.deleteMany({ where: { gardenId, playerId: t.playerId } }); return }
      await tx.betweenShown.upsert({ where: { gardenId_playerId: { gardenId, playerId: t.playerId } }, create: { gardenId, playerId: t.playerId, data }, update: { data } })
      return
    }
    case 'privates': {
      if (!data) { await tx.betweenPrivate.deleteMany({ where: { gardenId, playerId: t.playerId, key: t.key } }); return }
      const where = { gardenId_playerId_key: { gardenId, playerId: t.playerId, key: t.key } }
      await tx.betweenPrivate.upsert({ where, create: { gardenId, playerId: t.playerId, key: t.key, data }, update: { data } })
      return
    }
  }
}

/** One write from the page, checked against the rules and applied in a transaction so two people's tending merges. */
export async function write(gardenId: string, who: Who, t: Target, op: Op, data: Doc | null) {
  return db.$transaction(async tx => {
    const g = await tx.betweenGarden.findUnique({ where: { id: gardenId } })
    if (!g) return { ok: false as const, status: 404, error: 'There is no garden here.' }
    const garden = asDoc(g.data)
    const cur = t.table === 'garden' ? garden : await current(tx, gardenId, t)
    const verdict = mayWrite(who, garden, t, op, data, cur)
    if (!verdict.ok) return verdict
    const next = op === 'delete' ? null : op === 'set' ? data! : merge(cur ?? {}, data!)
    await put(tx, gardenId, t, next)
    if (t.table === 'garden' && data && data.members && typeof data.members === 'object')
      for (const playerId of Object.keys(data.members as Doc))
        await tx.betweenMember.upsert({ where: { gardenId_playerId: { gardenId, playerId } }, create: { gardenId, playerId }, update: {} })
    return { ok: true as const, doc: next }
  })
}

export async function plant(playerId: string, data: Doc) {
  return db.betweenGarden.create({
    data: { startedById: playerId, inviteToken: newInviteToken(), data: asJson(data), members: { create: { playerId } } },
    select: { id: true },
  })
}

export async function gardensOf(playerId: string) {
  const rows = await db.betweenMember.findMany({ where: { playerId }, include: { garden: true }, orderBy: { joinedAt: 'desc' } })
  return rows.map(r => {
    const d = asDoc(r.garden.data), s = asDoc(d.setup as Prisma.JsonValue)
    return { id: r.gardenId, phase: d.phase ?? null, who: s.who ?? null, kind: s.kind ?? null, updatedAt: r.garden.updatedAt }
  })
}
