'use server'

/**
 * Player Hand contents — server action for the in-world HandModal.
 *
 * Returns the bounded set of active BARs the player is "carrying" in the
 * spatial world. This is the "hand" — limited inventory accessible without
 * leaving the play space. The Vault (legacy /hand page) is the unbounded
 * storage accessed by leaving play.
 *
 * Hand contents (current heuristic):
 *   - Drafts (genericPrivateDraftWhere)
 *   - Unplaced personal quests
 *
 * Future work (after backlog 1.34 PDH lands): hand becomes a structured set
 * managed by ActorDeckState rather than derived from query filters.
 */

import { dbBase } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
    genericPrivateDraftWhere,
    unplacedPersonalQuestWhere,
} from '@/lib/vault-queries'

export type HandBar = {
    id: string
    title: string
    description: string | null
    type: string
    moveType: string | null
    createdAt: string
}

export type HandContents =
    | {
          success: true
          bars: HandBar[]
      }
    | { error: string }

export async function getPlayerHandContents(): Promise<HandContents> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    try {
        // Pull drafts and unplaced quests, sorted by recency. Cap at 20 (the
        // modal renders the first 6 as the bounded hand and shows an "over
        // capacity" warning if more exist).
        const [drafts, unplacedQuests] = await Promise.all([
            dbBase.customBar.findMany({
                where: genericPrivateDraftWhere(player.id),
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    moveType: true,
                    createdAt: true,
                },
            }),
            dbBase.customBar.findMany({
                where: unplacedPersonalQuestWhere(player.id),
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    moveType: true,
                    createdAt: true,
                },
            }),
        ])

        // Merge + dedupe + sort by recency
        const all = [...drafts, ...unplacedQuests]
        const seen = new Set<string>()
        const unique = all.filter((b) => {
            if (seen.has(b.id)) return false
            seen.add(b.id)
            return true
        })
        unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        return {
            success: true,
            bars: unique.map((b) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                type: b.type,
                moveType: b.moveType,
                createdAt: b.createdAt.toISOString(),
            })),
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load hand'
        return { error: msg }
    }
}
