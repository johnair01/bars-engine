'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import type { CyoaArtifactLedgerEntry, CyoaHexagramState } from '@/lib/cyoa/types'

function parseState(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Append a BAR id to the CYOA artifact ledger for this adventure run.
 */
export async function appendCyoaArtifactBar(
  adventureId: string,
  entry: Pick<CyoaArtifactLedgerEntry, 'barId' | 'passageNodeId' | 'source'> & {
    blueprintKey?: string
  }
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const full: CyoaArtifactLedgerEntry = {
    kind: 'bar',
    barId: entry.barId,
    passageNodeId: entry.passageNodeId,
    blueprintKey: entry.blueprintKey,
    source: entry.source,
    createdAt: new Date().toISOString(),
  }

  const row = await db.playerAdventureProgress.findUnique({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
  })

  const prev = parseState(row?.stateData ?? null)
  const ledger = Array.isArray(prev.cyoaArtifactLedger)
    ? ([...prev.cyoaArtifactLedger] as unknown[])
    : []
  ledger.push(full)

  await db.playerAdventureProgress.upsert({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
    create: {
      playerId: player.id,
      adventureId,
      currentNodeId: row?.currentNodeId ?? null,
      stateData: JSON.stringify({ ...prev, cyoaArtifactLedger: ledger }),
    },
    update: {
      stateData: JSON.stringify({ ...prev, cyoaArtifactLedger: ledger }),
    },
  })

  return { success: true }
}

/**
 * Persist last I Ching cast for this adventure run (cyoaState.hexagram).
 */
export async function saveCyoaHexagramSnapshot(
  adventureId: string,
  hex: Omit<CyoaHexagramState, 'savedAt'>
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const row = await db.playerAdventureProgress.findUnique({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
  })
  const prev = parseState(row?.stateData ?? null)
  const cyoaHexagramState: CyoaHexagramState = {
    ...hex,
    savedAt: new Date().toISOString(),
  }

  await db.playerAdventureProgress.upsert({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
    create: {
      playerId: player.id,
      adventureId,
      currentNodeId: row?.currentNodeId ?? null,
      stateData: JSON.stringify({ ...prev, cyoaHexagramState }),
    },
    update: {
      stateData: JSON.stringify({ ...prev, cyoaHexagramState }),
    },
  })

  return { success: true }
}
