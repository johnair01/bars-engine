/**
 * Shared move context derivation for Now / Vault / Play.
 *
 * Pure function — no DB calls. Accepts pre-loaded player data and returns a
 * single `PlayerMoveContext` object that all three tab pages can consume.
 *
 * Spec: .specify/specs/player-main-tabs-move-oriented-ia (G17)
 */

export type MoveType = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

export const MOVE_LABELS: Record<MoveType, string> = {
    wakeUp: 'Wake Up',
    cleanUp: 'Clean Up',
    growUp: 'Grow Up',
    showUp: 'Show Up',
}

export const MOVE_COLORS: Record<MoveType, { border: string; text: string; bg: string; badge: string }> = {
    wakeUp: { border: 'border-emerald-800/50', text: 'text-emerald-400', bg: 'bg-emerald-950/30', badge: 'bg-emerald-950/50 text-emerald-500' },
    cleanUp: { border: 'border-sky-800/50', text: 'text-sky-400', bg: 'bg-sky-950/30', badge: 'bg-sky-950/50 text-sky-500' },
    growUp: { border: 'border-violet-800/50', text: 'text-violet-400', bg: 'bg-violet-950/30', badge: 'bg-violet-950/50 text-violet-500' },
    showUp: { border: 'border-amber-800/50', text: 'text-amber-400', bg: 'bg-amber-950/30', badge: 'bg-amber-950/50 text-amber-500' },
}

export type PlayerMoveContext = {
    recommendedMoveType: MoveType
    hasChargeToday: boolean
    completedMoveTypes: string[]
    activeQuestCount: number
    isSetupIncomplete: boolean
    isFirstSession: boolean
}

export function derivePlayerMoveContext(input: {
    quests: Array<{ status: string; quest: { moveType?: string | null } }>
    hasChargeToday: boolean
    activeQuestCount: number
    nationId: string | null | undefined
    archetypeId: string | null | undefined
}): PlayerMoveContext {
    const { quests, hasChargeToday, activeQuestCount, nationId, archetypeId } = input

    const completedMoveTypes = Array.from(
        new Set(
            quests
                .filter((q) => q.status === 'completed' && q.quest.moveType)
                .map((q) => q.quest.moveType as string)
        )
    )

    const isSetupIncomplete = !nationId || !archetypeId
    const isFirstSession = quests.length === 0

    const recommendedMoveType = ((): MoveType => {
        if (isSetupIncomplete || isFirstSession) return 'wakeUp'
        if (hasChargeToday && !completedMoveTypes.includes('cleanUp')) return 'cleanUp'
        if (completedMoveTypes.includes('cleanUp') && !completedMoveTypes.includes('growUp')) return 'growUp'
        if (activeQuestCount > 0) return 'showUp'
        return 'wakeUp'
    })()

    return {
        recommendedMoveType,
        hasChargeToday,
        completedMoveTypes,
        activeQuestCount,
        isSetupIncomplete,
        isFirstSession,
    }
}
