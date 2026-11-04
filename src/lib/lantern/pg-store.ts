import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { parseIntake, type LanternStore } from './store'
import type { Intake } from './engine'

/**
 * Lantern Hall's Postgres store (brief "Lantern Hall, port 1", step 2). A table belongs to one player; a load or save of
 * someone else's table finds nothing and writes nothing. The intake is stored whole in the reel's `intake/game` shape.
 */
export function postgresStore(playerId: string): LanternStore {
  return {
    async loadIntake(tableId) {
      const row = await db.lanternTable.findFirst({ where: { id: tableId, playerId } })
      return row ? parseIntake(row.intake) : null
    },
    async saveIntake(tableId, intake) {
      const ok = parseIntake(intake)
      if (!ok) throw new Error('intake is not in the intake/game shape')
      const n = await db.lanternTable.updateMany({ where: { id: tableId, playerId }, data: { intake: ok as unknown as Prisma.InputJsonValue } })
      if (!n.count) throw new Error('no such table')
    },
  }
}

/** The player's newest table, or null. */
export async function latestTable(playerId: string): Promise<{ id: string; intake: Intake } | null> {
  const row = await db.lanternTable.findFirst({ where: { playerId }, orderBy: { updatedAt: 'desc' } })
  const intake = row ? parseIntake(row.intake) : null
  return row && intake ? { id: row.id, intake } : null
}

/** Deal a new table from an intake. Returns its id, or null when the intake is not in the `intake/game` shape. */
export async function dealTable(playerId: string, raw: unknown): Promise<string | null> {
  const intake = parseIntake(raw)
  if (!intake) return null
  const row = await db.lanternTable.create({ data: { playerId, intake: intake as unknown as Prisma.InputJsonValue } })
  return row.id
}
