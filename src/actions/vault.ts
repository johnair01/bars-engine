'use server'

/**
 * Vault inventory read-model (QLA Phase 1).
 *
 * The canonical "All BARs" room: every owned, active CustomBar the player holds —
 * captured seeds (`bar` / `charge_capture`) AND quests — in one list. This is the
 * single home the old `/bars` "Inspirations" page folds into; it deliberately
 * INCLUDES quests (which `listMyBars` omits) so TTV output is reachable in the Vault.
 *
 * Additive: the Vault's five move-rooms (`vault-queries.ts`) are untouched.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { effectiveMaturity, parseSeedMetabolization } from '@/lib/bar-seed-metabolization'

/** Owned inventory kinds surfaced in the All-BARs room. */
const INVENTORY_TYPES = ['bar', 'charge_capture', 'quest'] as const

/** Defensive ceiling so the room never issues an unbounded payload. `hasMore`
 * signals truncation to the UI — never a silent cap. Cursor paging is a follow-up. */
const HARD_CAP = 500

export type VaultItemDTO = {
  id: string
  title: string
  description: string
  type: string
  element: string | null
  maturity: string | null
  createdAt: string
  shareCount: number
  storyContent: string | null
  assets: { id: string; url: string; mimeType: string | null; metadataJson: string | null }[]
}

export type VaultInventory = {
  items: VaultItemDTO[]
  total: number
  hasMore: boolean
}

export async function getVaultInventory(): Promise<VaultInventory | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const where = {
    creatorId: player.id,
    status: 'active' as const,
    archivedAt: null,
    type: { in: [...INVENTORY_TYPES] },
  }

  try {
    const [rows, total] = await Promise.all([
      db.customBar.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: HARD_CAP,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          nation: true,
          seedMetabolization: true,
          storyContent: true,
          createdAt: true,
          _count: { select: { shares: true } },
          assets: {
            where: { type: 'bar_attachment' as const },
            orderBy: { createdAt: 'asc' as const },
            take: 2,
            select: { id: true, url: true, mimeType: true, metadataJson: true },
          },
        },
      }),
      db.customBar.count({ where }),
    ])

    const items: VaultItemDTO[] = rows.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      type: b.type,
      element: b.nation ?? null,
      maturity: effectiveMaturity(parseSeedMetabolization(b.seedMetabolization)) ?? null,
      createdAt: b.createdAt.toISOString(),
      shareCount: b._count.shares,
      storyContent: b.storyContent ?? null,
      assets: b.assets,
    }))

    return { items, total, hasMore: total > items.length }
  } catch (e) {
    console.error('[vault:getVaultInventory]', e)
    return { error: 'Failed to load inventory' }
  }
}
