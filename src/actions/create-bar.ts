'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logLifecycleEvent } from '@/lib/lifecycle-events'

export async function createCustomBar(prevState: any, formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const inputType = formData.get('inputType') as string || 'text'
    const inputLabel = formData.get('inputLabel') as string || 'Response'
    const visibility = formData.get('visibility') as string || 'public' // 'public' or 'private'
    const targetPlayerId = formData.get('targetPlayerId') as string || null
    const moveType = formData.get('moveType') as string || null // wakeUp, cleanUp, growUp, showUp
    const storyContent = formData.get('storyContent') as string || null
    const storyMood = formData.get('storyMood') as string || null

    if (!title) {
        return { error: 'Title is required' }
    }

    try {
        // Create simple vibe bar with one input
        const inputs = JSON.stringify([
            { key: 'response', label: inputLabel, type: inputType, placeholder: '' }
        ])

        // If a specific player is assigned:
        // - For private quests: goes directly to their claimed hand
        // - For public quests: quest is claimable but "for" that player
        const claimedById = targetPlayerId && visibility === 'private'
            ? targetPlayerId  // Private assigned quests go to claimed
            : null            // Public assigned quests stay available but show as "for you"

        // TRANSACTION: If public, burn token. Then create bar.
        const result = await db.$transaction(async (tx) => {
            if (visibility === 'public') {
                // Check balance defined by available vibeulons
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    orderBy: { createdAt: 'asc' },
                    take: 1
                })

                if (wallet.length < 1) {
                    throw new Error('Need 1 Vibeulon to stake a Public Quest')
                }

                const tokenToBurn = wallet[0]

                // Burn the token
                await tx.vibulon.delete({
                    where: { id: tokenToBurn.id }
                })

                // Log the burn
                await tx.vibulonEvent.create({
                    data: {
                        playerId,
                        source: 'quest_creation_stake',
                        amount: -1,
                        notes: `Staked on public quest: ${title}`,
                        archetypeMove: 'INITIATE' // General move for starting something
                    }
                })
            }

            // Create the Bar
            const newBar = await tx.customBar.create({
                data: {
                    creatorId: playerId,
                    title,
                    description,
                    type: 'vibe',
                    reward: visibility === 'private' ? 0 : 1, // Private quests are BAR-like (no mint)
                    inputs,
                    visibility,
                    claimedById,
                    moveType: moveType || null,
                    storyPath: 'collective',
                    storyContent: storyContent || null,
                    storyMood: storyMood || null,
                    rootId: 'temp' // Placeholder, updated below
                }
            })

            // Update rootId
            await tx.customBar.update({
                where: { id: newBar.id },
                data: { rootId: newBar.id }
            })

            return newBar
        })

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Create bar failed:", e?.message)
        // Return explicit error message if it was our balance check
        if (e.message.includes('Need 1 Vibeulon')) {
            return { error: e.message }
        }
        return { error: 'Failed to create bar' }
    }
}

export async function getCustomBars() {
    return db.customBar.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getActivePlayers() {
    return db.player.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' }
    })
}

export async function logPersonalBar(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { success: false, error: 'Not logged in' }
    }

    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const source = String(formData.get('source') || 'life').trim()

    if (!title) {
        return { success: false, error: 'Title is required' }
    }

    try {
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description: description || 'A personal BAR signal waiting for the right moment.',
                type: 'inspiration',
                reward: 0,
                visibility: 'private',
                status: 'active',
                storyPath: 'personal',
                inputs: '[]',
                rootId: 'temp',
                storyContent: `Logged from: ${source}`
            }
        })

        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        await logLifecycleEvent(playerId, 'BAR_LOGGED', {
            questId: newBar.id,
            metadata: { source }
        })

        revalidatePath('/')
        revalidatePath('/hand')
        return { success: true, barId: newBar.id }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return { success: false, error: message || 'Failed to log BAR' }
    }
}

export async function promoteBarToQuest(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { success: false, error: 'Not logged in' }
    }

    const barId = String(formData.get('barId') || '').trim()
    if (!barId) {
        return { success: false, error: 'BAR ID is required' }
    }

    try {
        const [bar, player, globalState] = await Promise.all([
            db.customBar.findUnique({ where: { id: barId } }),
            db.player.findUnique({
                where: { id: playerId },
                include: { playbook: true }
            }),
            db.globalState.findUnique({
                where: { id: 'singleton' },
                select: { currentAct: true, currentPeriod: true, storyClock: true }
            })
        ])

        if (!bar) {
            return { success: false, error: 'BAR not found' }
        }

        if (bar.creatorId !== playerId) {
            return { success: false, error: 'You can only promote your own BARs' }
        }

        if (bar.type !== 'inspiration') {
            return { success: false, error: 'This BAR is already a quest' }
        }

        if (!player) {
            return { success: false, error: 'Player not found' }
        }

        const storyContext = globalState
            ? `Act ${globalState.currentAct}, Period ${globalState.currentPeriod}, Clock ${globalState.storyClock}/64`
            : 'Story context unavailable'
        const archetype = player.playbook?.name || 'Unbound'

        const storyLines = [
            bar.storyContent || '',
            '',
            'Promoted from personal BAR.',
            `Story Context: ${storyContext}`,
            `Archetype Lens: ${archetype}`,
        ].filter(Boolean)

        await db.$transaction(async (tx) => {
            await tx.customBar.update({
                where: { id: barId },
                data: {
                    type: 'story',
                    visibility: 'private',
                    reward: 0,
                    status: 'active',
                    storyPath: 'personal',
                    claimedById: playerId,
                    storyContent: storyLines.join('\n')
                }
            })

            await tx.playerQuest.upsert({
                where: {
                    playerId_questId: {
                        playerId,
                        questId: barId
                    }
                },
                update: {
                    status: 'assigned',
                    assignedAt: new Date(),
                    completedAt: null
                },
                create: {
                    playerId,
                    questId: barId,
                    status: 'assigned',
                    assignedAt: new Date()
                }
            })
        })

        await logLifecycleEvent(playerId, 'BAR_PROMOTED_TO_QUEST', {
            questId: barId,
            metadata: { storyContext, archetype }
        })

        revalidatePath('/')
        revalidatePath('/hand')
        return { success: true, questId: barId }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        await logLifecycleEvent(playerId, 'BAR_PROMOTION_FAILED', {
            metadata: { barId, reason: message }
        })
        return { success: false, error: message || 'Failed to promote BAR' }
    }
}

type QuestInputType = 'text' | 'textarea' | 'select' | 'multiselect'
type QuestInputDef = {
    key: string
    label: string
    type: QuestInputType
    placeholder?: string
    options?: string[]
    trigger?: string
}

function parseQuestInputs(inputsJson: string): QuestInputDef[] {
    try {
        const parsed = JSON.parse(inputsJson)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((input: unknown): input is QuestInputDef => {
            if (!input || typeof input !== 'object') return false
            const candidate = input as { key?: unknown, label?: unknown, type?: unknown }
            return (
                typeof candidate.key === 'string' &&
                typeof candidate.label === 'string' &&
                typeof candidate.type === 'string'
            )
        })
    } catch {
        return []
    }
}

export async function applyBarModifier(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { success: false, error: 'Not logged in' }
    }

    const barId = String(formData.get('barId') || '').trim()
    const targetQuestId = String(formData.get('targetQuestId') || '').trim()

    if (!barId || !targetQuestId) {
        return { success: false, error: 'BAR and target quest are required' }
    }

    if (barId === targetQuestId) {
        return { success: false, error: 'A BAR cannot modify itself' }
    }

    try {
        const [modifierBar, assignment] = await Promise.all([
            db.customBar.findUnique({
                where: { id: barId }
            }),
            db.playerQuest.findFirst({
                where: {
                    playerId,
                    questId: targetQuestId,
                    status: 'assigned'
                },
                include: { quest: true }
            })
        ])

        if (!modifierBar) {
            return { success: false, error: 'BAR not found' }
        }
        if (modifierBar.creatorId !== playerId) {
            return { success: false, error: 'You can only use your own BAR as a modifier' }
        }
        if (modifierBar.type !== 'inspiration' || modifierBar.visibility !== 'private' || modifierBar.status !== 'active') {
            return { success: false, error: 'Only active private inspiration BARs can modify quests' }
        }

        if (!assignment?.quest) {
            return { success: false, error: 'Target quest is not active for you' }
        }

        const targetQuest = assignment.quest
        if (targetQuest.visibility !== 'private') {
            return { success: false, error: 'BAR modifiers currently support private active quests only' }
        }

        const existingInputs = parseQuestInputs(targetQuest.inputs || '[]')
        const modifierKey = `modifier_echo_${barId.slice(-8)}`
        if (existingInputs.some(input => input.key === modifierKey)) {
            return { success: false, error: 'This BAR modifier has already been applied' }
        }

        const echoPrompt = modifierBar.description?.trim() || `Let "${modifierBar.title}" shift how you complete this quest.`
        const modifierInput: QuestInputDef = {
            key: modifierKey,
            label: `Modifier Echo — ${modifierBar.title}`,
            type: 'textarea',
            placeholder: echoPrompt
        }

        const updatedInputs = [...existingInputs, modifierInput]
        const existingStory = targetQuest.storyContent?.trim() || ''
        const modifierStamp = [
            `[BAR-MOD:${barId}]`,
            `BAR Modifier Applied: ${modifierBar.title}`,
            `Effect: Added a required "Modifier Echo" reflection input.`,
            `Prompt: ${echoPrompt}`
        ].join('\n')
        const updatedStoryContent = existingStory
            ? `${existingStory}\n\n${modifierStamp}`
            : modifierStamp

        await db.$transaction(async (tx) => {
            await tx.customBar.update({
                where: { id: targetQuestId },
                data: {
                    inputs: JSON.stringify(updatedInputs),
                    storyContent: updatedStoryContent
                }
            })

            await tx.customBar.update({
                where: { id: barId },
                data: {
                    status: 'archived',
                    parentId: targetQuestId,
                    storyPath: 'modifier',
                    storyContent: `Consumed as modifier for quest ${targetQuestId} at ${new Date().toISOString()}`
                }
            })
        })

        await logLifecycleEvent(playerId, 'BAR_MODIFIER_APPLIED', {
            questId: targetQuestId,
            metadata: { barId, modifierKey }
        })

        revalidatePath('/')
        revalidatePath('/hand')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        await logLifecycleEvent(playerId, 'BAR_MODIFIER_FAILED', {
            metadata: { barId, targetQuestId, reason: message }
        })
        return { success: false, error: message || 'Failed to apply BAR modifier' }
    }
}

export async function createQuestFromWizard(data: any) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        const {
            title, description, category, visibility,
            reward, inputs, lifecycleFraming, approach
        } = data

        // Validation
        if (!title) return { error: 'Missing title' }

        // Logic for Public Quests (Cost to Create)
        if (visibility === 'public') {
            await db.$transaction(async (tx) => {
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    take: 1
                })

                if (wallet.length < 1) {
                    throw new Error('Need 1 Vibeulon to stake a Public Quest')
                }

                await tx.vibulon.delete({ where: { id: wallet[0].id } })
                await tx.vibulonEvent.create({
                    data: {
                        playerId,
                        source: 'quest_creation_stake',
                        amount: -1,
                        notes: `Staked on public quest: ${title}`,
                        archetypeMove: 'INITIATE'
                    }
                })
            })
        }

        // Create the Bar
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
                type: category || 'custom',
                reward: visibility === 'private' ? 0 : (Number(reward) || 1),
                inputs: JSON.stringify(inputs || []),
                visibility: visibility || 'public',
                status: 'active',
                moveType: lifecycleFraming || null,
                storyPath: 'collective',
                rootId: 'temp',
                storyContent: approach ? `Approach: ${approach}` : null
            }
        })

        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        // Track "First Quest Created" for onboarding
        const player = await db.player.findUnique({ where: { id: playerId } })
        if (player && !player.hasCreatedFirstQuest) {
            const { completeOnboardingStep } = await import('@/actions/onboarding')
            await completeOnboardingStep('firstCreate')
        }

        revalidatePath('/')
        return { success: true, questId: newBar.id }

    } catch (e: any) {
        console.error("Wizard create failed:", e)
        return { error: e.message || 'Failed to create quest' }
    }
}
