'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { isCampaignQuest } from '@/lib/quest-scope'
import { completePackQuest } from '@/actions/quest-pack'
import { advanceThread } from '@/actions/quest-thread'
import { getOnboardingStatus, completeOnboardingStep, assignGatedThreads } from '@/actions/onboarding'
import { revalidatePath } from 'next/cache'
import { mintVibulon } from '@/actions/economy'
import { deriveAvatarConfig } from '@/lib/avatar-utils'

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
 * Campaign quests can only be completed when source is 'gameboard'.
 */
export type QuestCompletionSource = 'dashboard' | 'quest_wallet' | 'twine_end' | 'adventure_passage' | 'gameboard'
type QuestCompletionContext = {
  packId?: string
  threadId?: string
  source?: QuestCompletionSource
  instanceId?: string
  kotterStage?: number
}
type QuestCompletionOptions = { skipRevalidate?: boolean }

export async function completeQuest(questId: string, inputs: any, context?: QuestCompletionContext, options?: QuestCompletionOptions) {
    try {
        const player = await getCurrentPlayer()
        if (!player) return { error: 'Not logged in' }

        console.log(`[QuestEngine] Completing quest ${questId} for player ${player.id}`)
        return await completeQuestForPlayer(player.id, questId, inputs, context, options)
    } catch (err: any) {
        console.error(`[QuestEngine] Fatal error in completeQuest:`, err)
        return { error: err.message || 'A technical error occurred while completing the quest.' }
    }
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

    if (quest.status === 'blocked') {
        return {
            error: 'This quest is blocked. Complete the key subquest to unlock it.',
        }
    }

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

    const isBounty = quest.questSource === 'bounty' || (quest.stakedPool ?? 0) > 0
    if (isBounty && quest.creatorId === playerId) {
        return {
            error: 'You cannot complete your own bounty. Others must complete it to earn your staked vibeulons.'
        }
    }

    if (isBounty) {
        const completedCount = await db.playerQuest.count({
            where: { questId, status: 'completed' },
        })
        if (completedCount >= (quest.maxAssignments ?? 1)) {
            return {
                error: 'This bounty has reached its maximum number of completions.',
            }
        }
        const poolRemaining = quest.stakedPool ?? 0
        const rewardAmount = quest.reward ?? 1
        if (poolRemaining < rewardAmount) {
            return {
                error: 'This bounty has insufficient staked vibeulons remaining.',
            }
        }
    }

    // Campaign quests can only be completed on the gameboard
    const isCampaign = await isCampaignQuest(questId)
    if (isCampaign && context?.source !== 'gameboard') {
        return {
            error: 'Campaign quests can only be completed on the gameboard.'
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
    const result = await db.$transaction(async (tx) => {
        // CHECK IF ALREADY COMPLETED (for reward bypass)
        const existingCompletion = await tx.playerQuest.findUnique({
            where: {
                playerId_questId: { playerId, questId }
            }
        })

        const isRepeat = existingCompletion?.status === 'completed'
        const isOnboarding = quest.type === 'onboarding'

        const playerQuest = await tx.playerQuest.upsert({
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

        // GRANT VIBEULONS with bonus (BYPASS IF REPEAT ONBOARDING)
        const baseReward = quest.reward || 1
        let finalReward = Math.floor(baseReward * bonusMultiplier)

        if (isOnboarding && isRepeat) {
            finalReward = 0
            console.log(`[QuestEngine] Bypass rewards for repeated onboarding quest ${questId} for player ${playerId}`)
        }

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

        // Bounty: pay from escrow (transfer); otherwise mint new tokens
        const isBountyInTx = quest.questSource === 'bounty' || (quest.stakedPool ?? 0) > 0
        if (isBountyInTx && finalReward > 0) {
            const stakes = await tx.bountyStake.findMany({
                where: { barId: questId },
                take: finalReward,
            })
            for (const stake of stakes) {
                await tx.vibulon.update({
                    where: { id: stake.vibulonId },
                    data: { ownerId: playerId },
                })
                await tx.bountyStake.delete({ where: { id: stake.id } })
            }
            await tx.customBar.update({
                where: { id: questId },
                data: { stakedPool: { decrement: finalReward } },
            })
        } else if (finalReward > 0) {
            const creatorId =
                quest.creatorId && !quest.isSystem ? quest.creatorId : null
            const tokenData = []
            for (let i = 0; i < finalReward; i++) {
                tokenData.push({
                    ownerId: playerId,
                    creatorId,
                    originSource: 'quest',
                    originId: questId,
                    originTitle: quest.title
                })
            }
            await tx.vibulon.createMany({ data: tokenData })
        }

        // BAR CREATOR MINT: Public BARs appended to this quest (parentId = questId) get 1 vibeulon per creator
        const appendedBars = await tx.customBar.findMany({
            where: {
                parentId: questId,
                visibility: 'public',
                creatorId: { not: playerId },
            },
            select: { id: true, creatorId: true, title: true },
        })
        for (const bar of appendedBars) {
            await tx.vibulonEvent.create({
                data: {
                    playerId: bar.creatorId,
                    source: 'bar_creator_quest_completion',
                    amount: 1,
                    notes: `BAR creator: ${bar.title} used in quest: ${quest.title}`,
                    archetypeMove: 'IGNITE',
                    questId: questId,
                },
            })
            await tx.vibulon.create({
                data: {
                    ownerId: bar.creatorId,
                    creatorId: bar.creatorId,
                    originSource: 'bar_creator_quest_completion',
                    originId: questId,
                    originTitle: quest.title,
                },
            })
        }

        // PROCESS COMPLETION EFFECTS (e.g. setNation, setPlaybook from onboarding quests)
        await processCompletionEffects(tx, playerId, quest, inputs)

        // Daemons: unlock stage talisman when completing campaign quest on gameboard
        if (
          context?.source === 'gameboard' &&
          context?.instanceId &&
          context?.kotterStage != null
        ) {
          const existing = await tx.blessedObjectEarned.findFirst({
            where: {
              playerId,
              source: 'stage_talisman',
              instanceId: context.instanceId,
              kotterStage: context.kotterStage,
            },
          })
          if (!existing) {
            await tx.blessedObjectEarned.create({
              data: {
                playerId,
                source: 'stage_talisman',
                instanceId: context.instanceId,
                kotterStage: context.kotterStage,
                questId,
              },
            })
          }
        }

        // MOVES LIBRARY: unlock move if quest grants one (idempotent)
        if (quest.grantsMoveId) {
            const moveExists = await tx.nationMove.findUnique({
                where: { id: quest.grantsMoveId },
                select: { id: true },
            })
            if (moveExists) {
                await tx.playerNationMoveUnlock.upsert({
                    where: { playerId_moveId: { playerId, moveId: quest.grantsMoveId } },
                    create: { playerId, moveId: quest.grantsMoveId },
                    update: {},
                })
            }
        }

        // K-Space Librarian: DocQuest completion → DocEvidenceLink
        if (quest.type === 'doc' && quest.docQuestMetadata) {
            try {
                const meta = JSON.parse(quest.docQuestMetadata) as { targetDocNodeId?: string }
                const docNodeId = meta.targetDocNodeId
                const evidenceKind = (inputs?.evidenceKind as string) || 'observation'
                const validKinds = ['observation', 'instruction', 'canon_statement']
                const kind = validKinds.includes(evidenceKind) ? evidenceKind : 'observation'
                if (docNodeId) {
                    await tx.docEvidenceLink.create({
                        data: {
                            docNodeId,
                            questId: questId,
                            playerQuestId: playerQuest.id,
                            kind,
                            weight: 1.0,
                            confidence: 0.8
                        }
                    })
                }
            } catch (e) {
                console.warn('[QuestEngine] DocQuest DocEvidenceLink creation failed:', e)
            }
        }

        // Handle Pack/Thread progression - PASSING TX for atomicity
        if (context?.packId) {
            const { completePackQuestForPlayer } = await import('@/actions/quest-pack')
            await (completePackQuestForPlayer as any)(playerId, context.packId, questId, tx)
        }

        let threadType: string | null = null
        if (context?.threadId) {
            const { advanceThreadForPlayer } = await import('@/actions/quest-thread')
            const advanceResult = await advanceThreadForPlayer(playerId, context.threadId, questId, tx) as any
            if ('threadType' in advanceResult) {
                threadType = advanceResult.threadType
            }
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

        return {
            success: true,
            reward: finalReward,
            isFirstCompleter,
            bonusApplied: bonusMultiplier > 1,
            threadType
        }
    }, {
        timeout: 10000 // Increase timeout to 10s for intensive operations
    })

    // Tetris: on key completion, cascade unblock root + siblings
    if (result && !('error' in result) && quest.isKeyUnblocker) {
        const rootId = quest.rootId || quest.id
        await db.customBar.updateMany({
            where: {
                OR: [{ id: rootId }, { rootId }],
                status: 'blocked',
            },
            data: { status: 'active' },
        })
    }

    // 321 metabolizability: update questCompletedAt when quest was created from 321
    if (result && !('error' in result)) {
        await db.shadow321Session.updateMany({
            where: { linkedQuestId: questId },
            data: { questCompletedAt: new Date() },
        })
    }

    // LEGACY CHECK: Moved OUTSIDE transaction to avoid bloat
    try {
        const obStatus = await getOnboardingStatus(playerId)
        if (!('error' in obStatus) && !obStatus.hasCompletedFirstQuest) {
            await completeOnboardingStep('firstQuest', playerId, { skipRevalidate: true })
        }
    } catch (e) {
        console.warn(`[QuestEngine] Non-critical onboarding update failed:`, e)
    }

    // Auto-assign any gated threads that the player now qualifies for
    // (e.g. if they just set their nation/archetype via completion effects)
    await assignGatedThreads(playerId)

    if (!options?.skipRevalidate) {
        revalidatePath('/')
    }

    return result
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
    type: 'setNation' | 'setPlaybook' | 'markOnboardingComplete' | 'grantVibeulons' | 'setPlayerName' | 'deriveAvatarFromExisting' | 'strengthenResidency'
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
    quest: { id: string; completionEffects: string | null; title: string; creatorId?: string | null; isSystem?: boolean },
    inputs: Record<string, any>
) {
    if (!quest.completionEffects) return

    let parsed: { effects?: CompletionEffect[]; barTypeOnCompletion?: 'insight' | 'vibe' }
    try {
        parsed = JSON.parse(quest.completionEffects)
    } catch {
        return // Not valid JSON or legacy format — skip silently
    }

    // Handle barTypeOnCompletion: spawn BAR for completer when quest completes
    const barType = parsed.barTypeOnCompletion
    if (barType === 'insight' || barType === 'vibe') {
        const reflection = typeof inputs.reflection === 'string' ? inputs.reflection : JSON.stringify(inputs)
        const bar = await tx.customBar.create({
            data: {
                creatorId: playerId,
                title: `${barType === 'insight' ? 'Insight' : 'Vibe'} from: ${quest.title}`,
                description: reflection?.slice(0, 2000) || `${quest.title} completed.`,
                type: barType,
                reward: 0,
                visibility: 'private',
                status: 'active',
                inputs: '[]',
                rootId: 'temp',
            }
        })
        await tx.customBar.update({
            where: { id: bar.id },
            data: { rootId: bar.id }
        })
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
                    const archetypeId = effect.fromInput
                        ? inputs[effect.fromInput]
                        : effect.value
                    if (archetypeId) {
                        await tx.player.update({
                            where: { id: playerId },
                            data: { archetypeId }
                        })
                        console.log(`[CompletionEffects] Set archetype=${archetypeId} for player ${playerId}`)
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
                case 'setPlayerName': {
                    const name = effect.fromInput
                        ? inputs[effect.fromInput]
                        : effect.value
                    if (name) {
                        await tx.player.update({
                            where: { id: playerId },
                            data: { name }
                        })
                        console.log(`[CompletionEffects] Set name=${name} for player ${playerId}`)
                    }
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
                        const creatorId =
                            quest.creatorId && !quest.isSystem ? quest.creatorId : null
                        const bonusTokens = Array.from({ length: amount }, () => ({
                            ownerId: playerId,
                            creatorId,
                            originSource: 'completion_effect',
                            originId: quest.id,
                            originTitle: quest.title
                        }))
                        await tx.vibulon.createMany({ data: bonusTokens })
                        console.log(`[CompletionEffects] Granted ${amount} bonus vibeulons to player ${playerId}`)
                    }
                    break
                }
                case 'deriveAvatarFromExisting': {
                    const player = await tx.player.findUnique({
                        where: { id: playerId },
                        select: { nationId: true, archetypeId: true, campaignDomainPreference: true, pronouns: true }
                    })
                    if (!player?.nationId || !player?.archetypeId) break
                    const [nation, playbook] = await Promise.all([
                        tx.nation.findUnique({ where: { id: player.nationId }, select: { name: true } }),
                        tx.archetype.findUnique({ where: { id: player.archetypeId }, select: { name: true } })
                    ])
                    const avatarConfig = deriveAvatarConfig(
                        player.nationId,
                        player.archetypeId,
                        player.campaignDomainPreference,
                        { nationName: nation?.name, archetypeName: playbook?.name, pronouns: player.pronouns }
                    )
                    if (avatarConfig) {
                        await tx.player.update({
                            where: { id: playerId },
                            data: { avatarConfig }
                        })
                        console.log(`[CompletionEffects] Derived avatarConfig for player ${playerId}`)
                    }
                    break
                }
                case 'strengthenResidency': {
                    const completionType = effect.fromInput ? inputs[effect.fromInput] : null
                    if (!completionType || typeof completionType !== 'string') break
                    const type = completionType.toLowerCase()
                    // Log visible system effects (donation_received, invite_sent, feedback_submitted, campaign_shared)
                    if (type === 'donate') {
                        // Vibeulon already minted by Twine completion. Optionally increment Instance funding.
                        const instance = await tx.instance.findFirst({ where: { isEventMode: true }, select: { id: true, currentAmountCents: true } })
                        if (instance) {
                            await tx.instance.update({
                                where: { id: instance.id },
                                data: { currentAmountCents: { increment: 100 } } // +$1.00 symbolic
                            })
                            console.log(`[CompletionEffects] Strengthen donate: incremented instance funding for player ${playerId}`)
                        }
                    } else if (type === 'invite' || type === 'feedback' || type === 'share') {
                        // Log for observability; extend to DB/analytics as needed
                        console.log(`[CompletionEffects] Strengthen ${type}: player ${playerId} completed via ${type}`)
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
 * Run completion effects for a quest (used when completing via Twine auto-complete).
 * Fetches the quest, parses completionEffects, and runs processCompletionEffects with db.
 */
export async function runCompletionEffectsForQuest(
    playerId: string,
    questId: string,
    inputs: Record<string, any>
) {
    const quest = await db.customBar.findUnique({
        where: { id: questId },
        select: { id: true, completionEffects: true, title: true, creatorId: true, isSystem: true }
    })
    if (!quest?.completionEffects) return
    await processCompletionEffects(db as any, playerId, quest, inputs)
}

/**
 * Fire a trigger to auto-complete matching quests.
 */
export async function fireTrigger(trigger: string, options?: { skipRevalidate?: boolean }) {
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
        const currentQuestEntry = progress.thread.quests.find(q => q.position === progress.currentPosition)
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
    console.log(`[QuestEngine] fireTrigger(${trigger}) found ${candidates.length} candidates for player ${player.id}`)
    const results = []
    for (const candidate of candidates) {
        console.log(`[QuestEngine] fireTrigger executing completion for quest ${candidate.questId} (thread: ${candidate.threadId || 'none'})`)
        const result = await completeQuest(candidate.questId, { autoTriggered: true, trigger }, { threadId: candidate.threadId, source: 'gameboard' }, options)
        console.log(`[QuestEngine] fireTrigger result for ${candidate.questId}:`, JSON.stringify(result))
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
    if (!player || !player.archetype) {
        return { error: 'No archetype found' }
    }

    return {
        success: true,
        archetype: player.archetype
    }
}
