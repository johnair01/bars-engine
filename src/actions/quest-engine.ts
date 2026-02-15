'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { completePackQuest } from '@/actions/quest-pack'
import { advanceThread } from '@/actions/quest-thread'
import { getOnboardingStatus, completeOnboardingStep } from '@/actions/onboarding'
import { revalidatePath } from 'next/cache'
import { mintVibulon } from '@/actions/economy'

/**
 * Checks the status of a specific quest for the current player.
 * Useful for the modal to know if it's already done.
 */
export async function checkQuestStatus(questId: string, context?: { packId?: string, threadId?: string }) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // 1. Check if it's in a Pack
    if (context?.packId) {
        const progress = await db.packProgress.findUnique({
            where: { packId_playerId: { packId: context.packId, playerId: player.id } }
        })
        if (progress) {
            const completed = JSON.parse(progress.completed) as string[]
            return {
                status: completed.includes(questId) ? 'completed' : 'active',
                completedAt: progress.completedAt
            }
        }
    }

    // 2. Check standalone assignment (PlayerQuest)
    const assignment = await db.playerQuest.findFirst({
        where: {
            playerId: player.id,
            questId: questId
        }
    })

    if (assignment) {
        return {
            status: assignment.status,
            completedAt: assignment.completedAt
        }
    }

    return { status: 'available' }
}

/**
 * Complete a quest.
 * Handles both Pack context and Standalone context.
 */
type QuestCompletionContext = { packId?: string, threadId?: string }
type QuestCompletionOptions = { skipRevalidate?: boolean }

export async function completeQuest(questId: string, inputs: any, context?: QuestCompletionContext) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    return completeQuestForPlayer(player.id, questId, inputs, context)
}

/**
 * Test-friendly completion path that bypasses auth context.
 * Use from scripts only (never from client code).
 */
export async function completeQuestForPlayer(
    playerId: string,
    questId: string,
    inputs: any,
    context?: QuestCompletionContext,
    options?: QuestCompletionOptions
) {
    if (!playerId) throw new Error('No active player')

    // Fetch the quest to check for Story Clock bonuses
    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })

    if (!quest) throw new Error('Quest not found')

    const storyMeta = parseStoryQuestMeta(quest.completionEffects)
    const isStoryClockQuest = storyMeta.questSource === 'story_clock'
    const isPersonalIChingQuest =
        storyMeta.questSource === 'personal_iching' ||
        (quest.storyPath === 'personal' && quest.type === 'inspiration')

    if (isPersonalIChingQuest && quest.creatorId === playerId) {
        return {
            error: 'You cannot complete your own personal I Ching quest. Offer it to the collective.'
        }
    }

    // CHECK FOR STORY CLOCK BONUS
    let bonusMultiplier = 1
    let isFirstCompleter = false

    if (isStoryClockQuest || (quest.hexagramId && quest.periodGenerated)) {
        const globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })

        // Old period bonus
        if (!isStoryClockQuest && globalState && quest.periodGenerated < globalState.currentPeriod) {
            bonusMultiplier = 1.5 // +50% bonus
        }

        // Check if this is the first completer
        if (!quest.firstCompleterId) {
            isFirstCompleter = true
            // Update quest with first completer
            await db.customBar.update({
                where: { id: questId },
                data: { firstCompleterId: playerId }
            })
        }
    }

    // MARK QUEST AS COMPLETE
    // MARK QUEST AS COMPLETE
    await db.playerQuest.upsert({
        where: {
            playerId_questId: {
                playerId,
                questId
            }
        },
        update: {
            status: 'completed',
            inputs: JSON.stringify(inputs),
            completedAt: new Date(),
        },
        create: {
            playerId,
            questId,
            status: 'completed',
            inputs: JSON.stringify(inputs),
            completedAt: new Date(),
            assignedAt: new Date()
        }
    })

    // GRANT VIBEULONS with bonus
    const baseReward = quest.reward || 1
    let finalReward = Math.floor(baseReward * bonusMultiplier)

    if (isStoryClockQuest) {
        finalReward = isFirstCompleter ? 2 : 1
    }

    if (isPersonalIChingQuest) {
        finalReward = 1
    }

    // REPEATABLE FEEDBACK QUEST LOGIC
    if (questId === 'system-feedback') {
        const feedbackCount = await db.vibulonEvent.count({
            where: {
                playerId,
                questId: 'system-feedback',
                source: 'quest'
            }
        })
        if (feedbackCount >= 5) {
            finalReward = 0
            console.log(`[QuestEngine] Feedback cap reached for ${playerId}. Reward set to 0.`)
        }
    }

    await db.vibulonEvent.create({
        data: {
            playerId,
            source: 'quest',
            amount: finalReward,
            notes: `Quest Completed: ${quest.title}${bonusMultiplier > 1 ? ' (+50% period bonus!)' : ''}${isFirstCompleter ? ' (FIRST!)' : ''}`,
            archetypeMove: 'IGNITE',
            questId: questId,
        }
    })

    // Handle Pack/Thread progression
    if (context?.packId) {
        await completePackQuest(context.packId, questId) // Assuming completePackQuest handles progression
    }

    if (context?.threadId) {
        await advanceThread(context.threadId, questId)
    }

    // CHECK ONBOARDING STATUS
    const obStatus = await getOnboardingStatus(playerId)
    if (!('error' in obStatus) && !obStatus.hasCompletedFirstQuest) {
        await completeOnboardingStep('firstQuest', playerId, { skipRevalidate: options?.skipRevalidate })
    }

    // MINT ACTUAL VIBULON TOKENS (Vibulon model)
    await mintVibulon(playerId, finalReward, {
        source: 'quest',
        id: questId,
        title: quest.title
    }, { skipRevalidate: options?.skipRevalidate })

    // IF FEEDBACK QUEST, REFRESH (Delete the completion record so it appears again)
    if (questId === 'system-feedback') {
        await db.playerQuest.delete({
            where: {
                playerId_questId: {
                    playerId,
                    questId: 'system-feedback'
                }
            }
        })
    }

    if (!options?.skipRevalidate) {
        revalidatePath('/')
        revalidatePath('/story-clock')
        revalidatePath('/wallet')
    }

    // PROCESS COMPLETION EFFECTS
    if (quest.completionEffects) {
        try {
            const effects = JSON.parse(quest.completionEffects) as any

            // Example Effect: Update Player Profile
            if (effects.updatePlayer) {
                await db.player.update({
                    where: { id: playerId },
                    data: effects.updatePlayer
                })
            }

            // Example Effect: Log specialized event
            if (effects.logEvent) {
                await db.auditLog.create({
                    data: {
                        actorAdminId: 'system',
                        action: effects.logEvent.action || 'QUEST_EFFECT',
                        targetType: 'player',
                        targetId: playerId,
                        payloadJson: JSON.stringify(effects.logEvent.payload || {})
                    }
                })
            }
        } catch (e) {
            console.error("Failed to process quest completion effects", e)
        }
    }

    return { success: true, reward: finalReward, isFirstCompleter, bonusApplied: bonusMultiplier > 1 }
}

function parseStoryQuestMeta(raw: string | null) {
    if (!raw) return { questSource: null as string | null }
    try {
        const parsed = JSON.parse(raw)
        return {
            questSource: typeof parsed.questSource === 'string' ? parsed.questSource : null
        }
    } catch {
        return { questSource: null as string | null }
    }
}
/**
 * Fire a trigger to auto-complete matching quests.
 */
export async function fireTrigger(trigger: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // 1. Find all active PlayerQuests for this player
    const activeAssignments = await db.playerQuest.findMany({
        where: {
            playerId: player.id,
            status: 'assigned'
        },
        include: {
            quest: true
        }
    })

    // 2. Also find quests in active Threads
    const activeThreads = await db.threadProgress.findMany({
        where: {
            playerId: player.id,
            completedAt: null
        },
        include: {
            thread: {
                include: {
                    quests: {
                        include: {
                            quest: true
                        }
                    }
                }
            }
        }
    })

    const candidates: { questId: string, threadId?: string }[] = []

    // Collect candidates from standalone assignments
    for (const assignment of activeAssignments) {
        const inputs = JSON.parse(assignment.quest.inputs || '[]') as any[]
        if (inputs.some(input => input.trigger === trigger)) {
            candidates.push({ questId: assignment.questId })
        }
    }

    // Collect candidates from threads (only the CURRENT quest in the thread)
    for (const progress of activeThreads) {
        const currentQuestEntry = progress.thread.quests.find(q => q.position === progress.currentPosition + 1)
        if (currentQuestEntry) {
            const inputs = JSON.parse(currentQuestEntry.quest.inputs || '[]') as any[]
            if (inputs.some(input => input.trigger === trigger)) {
                candidates.push({
                    questId: currentQuestEntry.questId,
                    threadId: progress.threadId
                })
            }
        }
    }

    if (candidates.length === 0) return { success: false, message: 'No matching quests found for trigger' }

    // 3. Complete them
    const results = []
    for (const candidate of candidates) {
        const result = await completeQuest(candidate.questId, { autoTriggered: true, trigger }, { threadId: candidate.threadId })
        results.push(result)
    }

    return { success: true, results }
}

/**
 * Fetch the current player's archetype (playbook) data for handbook display.
 */
export async function getArchetypeHandbookData() {
    const player = await getCurrentPlayer()
    if (!player || !player.playbook) {
        return { error: 'No archetype found' }
    }

    return {
        success: true,
        playbook: player.playbook
    }
}
