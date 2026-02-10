import { db } from '@/lib/db'

const DEFAULT_COOLDOWN_SECONDS = 90

export function getIChingCooldownSeconds(): number {
    const rawValue = process.env.ICHING_CAST_COOLDOWN_SECONDS
    if (!rawValue) return DEFAULT_COOLDOWN_SECONDS

    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed) || parsed < 0) {
        return DEFAULT_COOLDOWN_SECONDS
    }

    return Math.floor(parsed)
}

export async function getIChingCooldownBlock(playerId: string): Promise<{
    remainingSeconds: number
    lastCastAt: Date
} | null> {
    const cooldownSeconds = getIChingCooldownSeconds()
    if (cooldownSeconds <= 0) return null

    const earliestAllowed = new Date(Date.now() - cooldownSeconds * 1000)
    const recentCast = await db.playerBar.findFirst({
        where: {
            playerId,
            source: 'iching',
            acquiredAt: { gte: earliestAllowed },
        },
        orderBy: { acquiredAt: 'desc' },
        select: { acquiredAt: true }
    })

    if (!recentCast) return null

    const nextAllowedAt = recentCast.acquiredAt.getTime() + cooldownSeconds * 1000
    const remainingSeconds = Math.max(1, Math.ceil((nextAllowedAt - Date.now()) / 1000))

    return {
        remainingSeconds,
        lastCastAt: recentCast.acquiredAt,
    }
}
