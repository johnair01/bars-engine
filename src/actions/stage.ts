'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * The 8 Kotter Stages mapped to archetype moves.
 * When a player with the matching playbook makes a move,
 * they can advance the quest to the next stage.
 */
export const KOTTER_STAGES = {
    1: { name: 'Urgency', move: 'THUNDERCLAP', trigram: 'Thunder', emoji: '⚡' },
    2: { name: 'Coalition', move: 'NURTURE', trigram: 'Earth', emoji: '🤝' },
    3: { name: 'Vision', move: 'COMMAND', trigram: 'Heaven', emoji: '👁' },
    4: { name: 'Communicate', move: 'EXPRESS', trigram: 'Lake', emoji: '🎭' },
    5: { name: 'Obstacles', move: 'INFILTRATE', trigram: 'Water', emoji: '💧' },
    6: { name: 'Wins', move: 'IGNITE', trigram: 'Fire', emoji: '🔥' },
    7: { name: 'Build On', move: 'PERMEATE', trigram: 'Wind', emoji: '🌬' },
    8: { name: 'Anchor', move: 'IMMOVABLE', trigram: 'Mountain', emoji: '⛰' },
} as const

export type KotterStage = keyof typeof KOTTER_STAGES

/**
 * Get the current stage info for a quest
 */
export async function getQuestStage(questId: string) {
    const quest = await db.customBar.findUnique({
        where: { id: questId },
        select: { kotterStage: true, title: true }
    })

    if (!quest) return null

    const stage = quest.kotterStage as KotterStage
    return {
        ...KOTTER_STAGES[stage],
        stage,
        questTitle: quest.title
    }
}

/**
 * Check if a player's playbook matches the current stage's optimal trigram
 */
export async function checkAffinityMatch(playerId: string, questId: string) {
    const [player, quest] = await Promise.all([
        db.player.findUnique({
            where: { id: playerId },
            include: { playbook: true }
        }),
        db.customBar.findUnique({
            where: { id: questId },
            select: { kotterStage: true }
        })
    ])

    if (!player?.playbook || !quest) return { match: false }

    const stage = quest.kotterStage as KotterStage
    const stageInfo = KOTTER_STAGES[stage]

    // Extract trigram name from playbook (e.g., "Heaven (Qian)" -> "Heaven")
    const playbookTrigram = player.playbook.name.split(' ')[0]

    return {
        match: playbookTrigram === stageInfo.trigram,
        playerTrigram: playbookTrigram,
        optimalTrigram: stageInfo.trigram,
        stage: stageInfo
    }
}

/**
 * Advance a quest to the next Kotter stage.
 * Awards bonus Vibeulons if the player's playbook matches the stage.
 */
export async function advanceQuestStage(questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const quest = await db.customBar.findUnique({
        where: { id: questId },
        select: { kotterStage: true, title: true, creatorId: true, claimedById: true }
    })

    if (!quest) return { error: 'Quest not found' }

    // Only creator or claimer can advance
    if (quest.creatorId !== player.id && quest.claimedById !== player.id) {
        return { error: 'Not authorized to advance this quest' }
    }

    const currentStage = quest.kotterStage as KotterStage

    // Can't advance past stage 8
    if (currentStage >= 8) {
        return { error: 'Quest already at final stage', stage: currentStage }
    }

    const nextStage = (currentStage + 1) as KotterStage
    const stageInfo = KOTTER_STAGES[currentStage]

    // Check affinity for bonus
    const affinity = await checkAffinityMatch(player.id, questId)
    const bonusAmount = affinity.match ? 1 : 0

    // Update quest stage
    await db.customBar.update({
        where: { id: questId },
        data: { kotterStage: nextStage }
    })

    // Log the move
    await db.vibulonEvent.create({
        data: {
            playerId: player.id,
            source: 'stage_advance',
            amount: bonusAmount,
            notes: `Advanced "${quest.title}" from Stage ${currentStage} to ${nextStage}`,
            archetypeMove: stageInfo.move,
            questId: questId
        }
    })

    // Award bonus Vibeulon if affinity match
    if (bonusAmount > 0) {
        await db.vibulon.create({
            data: {
                ownerId: player.id,
                originSource: 'stage_bonus',
                originId: questId,
                originTitle: `Affinity Bonus: ${quest.title}`
            }
        })
    }

    revalidatePath('/')
    revalidatePath('/bars/available')

    return {
        success: true,
        previousStage: currentStage,
        newStage: nextStage,
        move: stageInfo.move,
        affinityBonus: bonusAmount > 0
    }
}

/**
 * Get all quests at a specific stage (useful for filtering)
 */
export async function getQuestsAtStage(stage: KotterStage) {
    return db.customBar.findMany({
        where: {
            kotterStage: stage,
            status: 'active',
            visibility: 'public'
        },
        orderBy: { createdAt: 'desc' }
    })
}
