/**
 * Starter Quest Generator — domain-biased quest selection for post-onboarding.
 * Uses CustomBar pool with allyshipDomain; no new tables.
 *
 * See: .specify/specs/starter-quest-generator/spec.md
 */

import { db } from '@/lib/db'
import { resolveMoveForContext } from '@/lib/quest-grammar'
import type { CustomBar } from '@prisma/client'

const VALID_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const

const LENS_TO_DOMAIN: Record<string, string> = {
    allyship: 'RAISE_AWARENESS',
    creative: 'GATHERING_RESOURCES',
    strategic: 'SKILLFUL_ORGANIZING',
    community: 'DIRECT_ACTION',
}

export interface StarterQuestsResult {
    primary: CustomBar & { resolvedMove?: { id: string; name: string; primaryWaveStage?: string } | null }
    optional: (CustomBar & { resolvedMove?: { id: string; name: string; primaryWaveStage?: string } | null })[]
}

/**
 * Resolve player's allyship domain from campaignDomainPreference or lens in storyProgress.
 */
async function resolvePlayerDomain(playerId: string): Promise<string | null> {
    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { campaignDomainPreference: true, storyProgress: true },
    })
    if (!player) return null

    // campaignDomainPreference: JSON array or string
    const pref = player.campaignDomainPreference
    if (pref) {
        try {
            const parsed = JSON.parse(pref) as unknown
            if (Array.isArray(parsed)) {
                const first = parsed.find((x): x is string => typeof x === 'string')
                if (first && VALID_DOMAINS.includes(first as (typeof VALID_DOMAINS)[number])) return first
            }
            if (typeof parsed === 'string' && VALID_DOMAINS.includes(parsed as (typeof VALID_DOMAINS)[number])) {
                return parsed
            }
        } catch {
            if (typeof pref === 'string' && VALID_DOMAINS.includes(pref as (typeof VALID_DOMAINS)[number])) {
                return pref
            }
        }
    }

    // Fallback: lens from storyProgress
    const sp = player.storyProgress
    if (sp) {
        try {
            const parsed = JSON.parse(sp) as { state?: { lens?: string } }
            const lens = parsed?.state?.lens
            if (typeof lens === 'string') {
                const domain = LENS_TO_DOMAIN[lens.toLowerCase()]
                if (domain) return domain
            }
        } catch {
            // ignore
        }
    }

    return null
}

/**
 * Get domain-biased starter quests for a player.
 * Returns 1 primary (domain match) + up to 2 optional (other domains).
 */
export async function getStarterQuestsForPlayer(
    playerId: string,
    campaignRef: string = 'bruised-banana'
): Promise<StarterQuestsResult> {
    const domain = await resolvePlayerDomain(playerId)

    const pool = await db.customBar.findMany({
        where: {
            campaignRef,
            type: 'onboarding',
            status: 'active',
            allyshipDomain: { not: null },
            isSystem: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    const withDomain = pool.filter((q) => q.allyshipDomain != null)
    const primaryQuest =
        domain && withDomain.length > 0
            ? withDomain.find((q) => q.allyshipDomain === domain) ?? withDomain[0]
            : withDomain[0] ?? pool[0]

    if (!primaryQuest) {
        return { primary: {} as StarterQuestsResult['primary'], optional: [] }
    }

    const otherDomains = withDomain.filter((q) => q.id !== primaryQuest.id)
    const optional = otherDomains.slice(0, 2)

    // Resolve move for primary (and optional) when domain + lens available
    const lens = await getLensFromPlayer(playerId)
    const attachResolvedMove = (quest: CustomBar) => {
        const move = resolveMoveForContext({
            allyshipDomain: quest.allyshipDomain ?? '',
            lens,
        })
        return {
            ...quest,
            resolvedMove: move ? { id: move.id, name: move.name, primaryWaveStage: move.primaryWaveStage } : null,
        }
    }

    return {
        primary: attachResolvedMove(primaryQuest),
        optional: optional.map(attachResolvedMove),
    }
}

async function getLensFromPlayer(playerId: string): Promise<string | undefined> {
    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { storyProgress: true },
    })
    if (!player?.storyProgress) return undefined
    try {
        const parsed = JSON.parse(player.storyProgress) as { state?: { lens?: string } }
        return parsed?.state?.lens
    } catch {
        return undefined
    }
}
