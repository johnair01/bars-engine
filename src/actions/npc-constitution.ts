'use server'

import { db } from '@/lib/db'

export async function createNpcConstitution(data: {
  name: string
  archetypalRole: string
  tier?: number
  identity: object
  values: object
  function: object
  limits: object
  memoryPolicy: object
  reflectionPolicy: object
}) {
  const npc = await db.npcConstitution.create({
    data: {
      name: data.name,
      archetypalRole: data.archetypalRole,
      tier: data.tier ?? 1,
      identity: JSON.stringify(data.identity),
      values: JSON.stringify(data.values),
      function: JSON.stringify(data.function),
      limits: JSON.stringify(data.limits),
      memoryPolicy: JSON.stringify(data.memoryPolicy),
      reflectionPolicy: JSON.stringify(data.reflectionPolicy),
      status: 'draft',
    },
  })

  await db.npcConstitutionVersion.create({
    data: {
      npcId: npc.id,
      version: '1.0',
      snapshot: JSON.stringify(npc),
      changedBy: 'admin',
    },
  })

  return npc
}

export async function getNpcConstitution(npcId: string) {
  return db.npcConstitution.findUnique({
    where: { id: npcId },
    include: {
      versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      reflections: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}

export async function listNpcConstitutions(filter?: { status?: string; tier?: number }) {
  return db.npcConstitution.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.tier !== undefined ? { tier: filter.tier } : {}),
    },
    orderBy: [{ tier: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function requestConstitutionUpdate(
  npcId: string,
  proposedChanges: Record<string, unknown>
) {
  const npc = await db.npcConstitution.findUnique({ where: { id: npcId } })
  if (!npc) return { error: 'NPC not found' }
  if (npc.governedBy !== 'regent_game_master') {
    return { error: 'Constitution is not governed by Regent — cannot request update' }
  }

  const [major, minor] = npc.constitutionVersion.split('.')
  const nextVersion = `${major}.${parseInt(minor ?? '0') + 1}`

  const version = await db.npcConstitutionVersion.create({
    data: {
      npcId,
      version: nextVersion,
      snapshot: JSON.stringify({ ...npc, ...proposedChanges }),
      changedBy: 'pending_regent_review',
    },
  })

  return { version, pendingVersion: nextVersion }
}
