import 'server-only'

/**
 * The packet store (hole H-packet-store): saves one seed packet per player id and lets a game master list them.
 * No route and no screen call this yet. Writes validate with parsePacket and refuse a bad packet by throwing.
 */
import { db } from '@/lib/db'
import { isPlayerId, parsePacket, type PacketRecord } from './packet-record'
import type { Packet } from './seed-packet'

export async function putPacket(playerId: string, packet: unknown): Promise<PacketRecord> {
  if (!isPlayerId(playerId)) throw new Error('putPacket: bad player id')
  const clean = parsePacket(packet)
  if (!clean) throw new Error('putPacket: not a seed packet')
  const row = await db.founderPacket.upsert({
    where: { playerId },
    create: { playerId, packetJson: JSON.stringify(clean) },
    update: { packetJson: JSON.stringify(clean) },
  })
  return { playerId, packet: clean, updatedAt: row.updatedAt }
}

export async function getPacket(playerId: string): Promise<PacketRecord | null> {
  if (!isPlayerId(playerId)) return null
  const row = await db.founderPacket.findUnique({ where: { playerId } })
  return toRecord(row)
}

/** Newest first. A stored row that no longer parses is skipped, never repaired. */
export async function listPackets(limit = 50): Promise<PacketRecord[]> {
  const rows = await db.founderPacket.findMany({ orderBy: { updatedAt: 'desc' }, take: Math.min(Math.max(limit, 1), 200) })
  return rows.map(toRecord).filter((r): r is PacketRecord => r !== null)
}

function toRecord(row: { playerId: string; packetJson: string; updatedAt: Date } | null): PacketRecord | null {
  if (!row) return null
  const packet: Packet | null = parsePacket(row.packetJson)
  return packet ? { playerId: row.playerId, packet, updatedAt: row.updatedAt } : null
}
