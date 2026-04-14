'use server'

/**
 * Player HUD data — slim server action for the persistent in-world overlay.
 *
 * Returns just enough to render the top-right HUD: avatar, name, hand size,
 * vault size, today's charge count. Lighter than `loadVaultCoreData` because
 * the HUD only needs counts, not the full BAR rows.
 */

import { dbBase } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { resolveAvatarConfigForPlayer, parseAvatarConfig, getAvatarHue } from '@/lib/avatar-utils'
import {
    genericPrivateDraftWhere,
    unplacedPersonalQuestWhere,
} from '@/lib/vault-queries'

export type PlayerHudData = {
    success: true
    playerId: string
    name: string | null
    avatarConfig: string | null
    avatarHue: number
    nationName: string | null
    archetypeName: string | null
    /** Active items the player is currently working with (drafts + unplaced quests). */
    handCount: number
    /** Total active BARs the player owns. */
    vaultCount: number
    /** Today's charge captures. */
    chargeCount: number
} | { error: string }

export async function getPlayerHudData(): Promise<PlayerHudData> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const [draftCount, unplacedQuestCount, chargeCount, vaultCount] = await Promise.all([
        dbBase.customBar.count({ where: genericPrivateDraftWhere(player.id) }),
        dbBase.customBar.count({ where: unplacedPersonalQuestWhere(player.id) }),
        dbBase.customBar.count({
            where: { creatorId: player.id, type: 'charge_capture', status: 'active' },
        }),
        dbBase.customBar.count({
            where: { creatorId: player.id, status: 'active' },
        }),
    ])

    const avatarConfig = resolveAvatarConfigForPlayer(player)
    const parsedConfig = parseAvatarConfig(avatarConfig)
    const avatarHue = getAvatarHue(parsedConfig)

    return {
        success: true,
        playerId: player.id,
        name: player.name ?? null,
        avatarConfig,
        avatarHue,
        nationName: player.nation?.name ?? null,
        archetypeName: player.archetype?.name ?? null,
        handCount: draftCount + unplacedQuestCount,
        vaultCount,
        chargeCount,
    }
}
