'use server'

import { db } from '@/lib/db'

const RETENTION_CAPS = {
  scene: 10,
  relationship: 5,
  campaign: 3,
} as const

type MemoryType = keyof typeof RETENTION_CAPS

export async function addNpcMemory(
  npcId: string,
  playerId: string | null,
  summary: string,
  memoryType: MemoryType,
  tags: string[] = []
) {
  const memory = await db.npcMemory.create({
    data: {
      npcId,
      playerId,
      memoryType,
      summary,
      tags: JSON.stringify(tags),
    },
  })

  // Prune after adding to stay within retention caps
  await pruneNpcMemories(npcId, playerId ?? undefined, memoryType)

  return memory
}

export async function getNpcMemories(
  npcId: string,
  playerId?: string,
  memoryType?: MemoryType
) {
  return db.npcMemory.findMany({
    where: {
      npcId,
      ...(playerId ? { playerId } : {}),
      ...(memoryType ? { memoryType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Applies retention_rules caps from the NPC constitution.
 * Default caps: 10 scene, 5 relationship, 3 campaign memories per NPC per player.
 * Canon memories are never pruned.
 */
export async function pruneNpcMemories(
  npcId: string,
  playerId?: string,
  memoryType?: MemoryType
) {
  const types: MemoryType[] = memoryType ? [memoryType] : ['scene', 'relationship', 'campaign']

  for (const type of types) {
    const cap = RETENTION_CAPS[type]

    const memories = await db.npcMemory.findMany({
      where: {
        npcId,
        ...(playerId ? { playerId } : {}),
        memoryType: type,
        isCanon: false,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (memories.length > cap) {
      const toDelete = memories.slice(cap).map((m) => m.id)
      await db.npcMemory.deleteMany({ where: { id: { in: toDelete } } })
    }
  }
}

/**
 * Marks a memory as canon — Regent authority only.
 * Canon memories are exempt from pruning.
 */
export async function markMemoryCanon(memoryId: string) {
  return db.npcMemory.update({
    where: { id: memoryId },
    data: { isCanon: true },
  })
}
