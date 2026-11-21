import { db } from '@/lib/db'
import { RETENTION_CAPS, type MemoryRow, type MemoryStore, type MemoryType } from './harness'

/** The real store: bars-engine's NpcMemory table. Same contract as InMemoryStore. */
export const prismaMemoryStore: MemoryStore = {
  async list(npcId, playerId) {
    const rows = await db.npcMemory.findMany({
      where: { npcId, OR: [{ isCanon: true }, { playerId }] },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((r): MemoryRow => ({
      id: r.id, npcId: r.npcId, playerId: r.playerId, memoryType: r.memoryType as MemoryType, summary: r.summary, isCanon: r.isCanon,
    }))
  },
  async addPrivate(npcId, playerId, memoryType, summary) {
    await db.npcMemory.create({ data: { npcId, playerId, memoryType, summary, isCanon: false } })
    const mine = await db.npcMemory.findMany({
      where: { npcId, playerId, memoryType, isCanon: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    const over = mine.slice(RETENTION_CAPS[memoryType]).map((m) => m.id)
    if (over.length) await db.npcMemory.deleteMany({ where: { id: { in: over } } })
  },
}
