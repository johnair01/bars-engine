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
        if (!isStoryClockQuest && globalState && quest.periodGenerated != null && quest.periodGenerated < globalState.currentPeriod) {
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

    // MARK QUEST AS COMPLETE AND GRANT REWARDS IN TRANSACTION
    return await db.$transaction(async (tx) => {
        await tx.playerQuest.upsert({
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
            const feedbackCount = await tx.vibulonEvent.count({
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

        await tx.vibulonEvent.create({
            data: {
                playerId,
                source: 'quest',
                amount: finalReward,
                notes: `Quest Completed: ${quest.title}${bonusMultiplier > 1 ? ' (+50% period bonus!)' : ''}${isFirstCompleter ? ' (FIRST!)' : ''}`,
                archetypeMove: 'IGNITE',
                questId: questId,
            }
        })

        // MINT ACTUAL VIBULON TOKENS (Vibulon model)
        const tokenData = []
        for (let i = 0; i < finalReward; i++) {
            tokenData.push({
                ownerId: playerId,
                originSource: 'quest',
                originId: questId,
                originTitle: quest.title
            })
        }
        if (tokenData.length > 0) {
            await tx.vibulon.createMany({ data: tokenData })
        }

        // PROCESS COMPLETION EFFECTS (e.g. setNation, setPlaybook from onboarding quests)
        await processCompletionEffects(tx, playerId, quest, inputs)

        // Handle Pack/Thread progression
        if (context?.packId) {
            const { completePackQuestForPlayer } = await import('@/actions/quest-pack')
            await completePackQuestForPlayer(playerId, context.packId, questId)
        }

        if (context?.threadId) {
            const { advanceThreadForPlayer } = await import('@/actions/quest-thread')
            await advanceThreadForPlayer(playerId, context.threadId, questId)
        }

        // CHECK ONBOARDING STATUS
        const obStatus = await getOnboardingStatus(playerId)
        if (!('error' in obStatus) && !obStatus.hasCompletedFirstQuest) {
            await completeOnboardingStep('firstQuest', playerId, { skipRevalidate: true })
        }

        // IF FEEDBACK QUEST, REFRESH (Delete the completion record so it appears again)
        if (questId === 'system-feedback') {
            await tx.playerQuest.delete({
                where: {
                    playerId_questId: {
                        playerId,
                        questId: 'system-feedback'
                    }
                }
            })
        }

        return { success: true, reward: finalReward, isFirstCompleter, bonusApplied: bonusMultiplier > 1 }
    })
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

// ============================================================
// COMPLETION EFFECTS ENGINE
// ============================================================

interface CompletionEffect {
    type: 'setNation' | 'setPlaybook' | 'markOnboardingComplete' | 'grantVibeulons'
    value?: string   // nationId, playbookId, etc.
    amount?: number  // for grantVibeulons
    fromInput?: string // key in quest inputs to read the value from
}

/**
 * Parse and execute structured completion effects from a quest's completionEffects JSON.
 * Effects can set player nation/playbook, mark onboarding complete, or grant bonus vibeulons.
 *
 * The `completionEffects` JSON can contain:
 * - `effects`: an array of CompletionEffect objects
 * - Legacy fields like `questSource` are ignored (handled by parseStoryQuestMeta)
 *
 * Example completionEffects JSON:
 * {
 *   "questSource": "onboarding",
 *   "effects": [
 *     { "type": "setNation", "fromInput": "nationId" },
 *     { "type": "markOnboardingComplete" }
 *   ]
 * }
 */
async function processCompletionEffects(
    tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
    playerId: string,
    quest: { id: string; completionEffects: string | null; title: string },
    inputs: Record<string, any>
) {
    if (!quest.completionEffects) return

    let parsed: { effects?: CompletionEffect[] }
    try {
        parsed = JSON.parse(quest.completionEffects)
    } catch {
        return // Not valid JSON or legacy format — skip silently
    }

    const effects = parsed.effects
    if (!Array.isArray(effects) || effects.length === 0) return

    for (const effect of effects) {
        try {
            switch (effect.type) {
                case 'setNation': {
                    const nationId = effect.fromInput
                        ? inputs[effect.fromInput]
                        : effect.value
                    if (nationId) {
                        await tx.player.update({
                            where: { id: playerId },
                            data: { nationId }
                        })
                        console.log(`[CompletionEffects] Set nation=${nationId} for player ${playerId}`)
                    }
                    break
                }
                case 'setPlaybook': {
                    const playbookId = effect.fromInput
                        ? inputs[effect.fromInput]
                        : effect.value
                    if (playbookId) {
                        await tx.player.update({
                            where: { id: playerId },
                            data: { playbookId }
                        })
                        console.log(`[CompletionEffects] Set playbook=${playbookId} for player ${playerId}`)
                    }
                    break
                }
                case 'markOnboardingComplete': {
                    await tx.player.update({
                        where: { id: playerId },
                        data: {
                            onboardingComplete: true,
                            onboardingCompletedAt: new Date()
                        }
                    })
                    console.log(`[CompletionEffects] Marked onboarding complete for player ${playerId}`)
                    break
                }
                case 'grantVibeulons': {
                    const amount = effect.amount || 0
                    if (amount > 0) {
                        await tx.vibulonEvent.create({
                            data: {
                                playerId,
                                source: 'completion_effect',
                                amount,
                                notes: `Bonus from quest: ${quest.title}`,
                                archetypeMove: 'IGNITE',
                                questId: quest.id,
                            }
                        })
                        const bonusTokens = Array.from({ length: amount }, () => ({
                            ownerId: playerId,
                            originSource: 'completion_effect',
                            originId: quest.id,
                            originTitle: quest.title
                        }))
                        await tx.vibulon.createMany({ data: bonusTokens })
                        console.log(`[CompletionEffects] Granted ${amount} bonus vibeulons to player ${playerId}`)
                    }
                    break
                }
                default:
                    console.warn(`[CompletionEffects] Unknown effect type: ${(effect as any).type}`)
            }
        } catch (err) {
            console.error(`[CompletionEffects] Failed to process effect ${effect.type}:`, err)
            // Don't throw — process remaining effects
        }
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
 * Delete a BAR/Quest.
 * Admin: Any BAR.
 * Player: Own private BAR if not yet accepted as a quest or updated by another.
 */
export async function deleteBar(barId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        include: {
            assignments: { take: 1 },
            children: { take: 1 }
        }
    })

    if (!bar) return { error: 'BAR not found' }

    const isAdmin = player.roles.some(r => r.role.key === 'ADMIN')

    if (!isAdmin) {
        if (bar.creatorId !== player.id) return { error: 'Unauthorized' }
        if (bar.assignments.length > 0) return { error: 'Cannot delete a BAR that has been accepted as a quest' }
        if (bar.children.length > 0) return { error: 'Cannot delete a BAR that has been updated or forked' }
    }

    await db.customBar.delete({
        where: { id: barId }
    })

    revalidatePath('/')
    revalidatePath('/bars/available')
    return { success: true }
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
