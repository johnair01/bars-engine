/**
 * Daemon records grown from a BAR (`Daemon` model — legacy name "daemon seed" in UI).
 */
import { db } from '@/lib/db'

export type CreateFromBarParams = {
  barId: string
  playerId: string
  name: string
  description?: string
  chargeSignature?: string
  shadowFunction?: string
  giftPotential?: string
}

export async function createFromBar(params: CreateFromBarParams) {
  return db.daemon.create({
    data: {
      playerId: params.playerId,
      name: params.name.trim() || 'Daemon',
      source: 'bar',
      sourceBarId: params.barId,
      voice: params.chargeSignature ?? params.description ?? undefined,
      shadow: params.shadowFunction ?? undefined,
      desire: params.giftPotential ?? undefined,
    },
  })
}

export async function getById(id: string) {
  return db.daemon.findUnique({
    where: { id },
    include: {
      sourceBar: { select: { id: true, title: true, description: true } },
      player: { select: { id: true, name: true } },
    },
  })
}

export async function listByPlayer(playerId: string) {
  return db.daemon.findMany({
    where: { playerId, sourceBarId: { not: null } },
    orderBy: { discoveredAt: 'desc' },
    include: {
      sourceBar: { select: { id: true, title: true } },
    },
  })
}
