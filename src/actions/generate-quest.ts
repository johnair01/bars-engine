'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'
import { isFeatureEnabled } from '@/lib/features'
import { getIChingCooldownBlock } from '@/lib/iching-cooldown'
import { logLifecycleEvent } from '@/lib/lifecycle-events'

type QuestDraft = {
    title: string
    description: string
    selectedMove: string
}

type ActionError = {
    success: false
    error: string
}

type QuestCoreSuccess = {
    success: true
    quest: QuestDraft
    questId: string
}

type HexagramSummary = {
    id: number
    name: string
    tone: string
    text: string
}

type IChingQuestSuccess = QuestCoreSuccess & {
    hexagram: HexagramSummary
}

function toErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message
    return String(e)
}

async function ensureIChingEnabled(): Promise<ActionError | null> {
    const enabled = await isFeatureEnabled('iching', true)
    if (enabled) return null
    return { success: false, error: 'I Ching is currently disabled.' }
}

async function ensureIChingCooldown(playerId: string): Promise<ActionError | null> {
    const cooldown = await getIChingCooldownBlock(playerId)
    if (!cooldown) return null

    return {
        success: false,
        error: `The oracle is still settling. Please wait ${cooldown.remainingSeconds}s before casting again.`,
    }
}

function normalizeHexagram(hexagram: { id: number, name: string, tone: string, text: string }): HexagramSummary {
    return {
        id: hexagram.id,
        name: hexagram.name,
        tone: hexagram.tone,
        text: hexagram.text,
    }
}

async function getHexagramById(hexagramId: number) {
    return db.bar.findUnique({
        where: { id: hexagramId }
    })
}

async function recordIChingReadingHistory(playerId: string, hexagramId: number) {
    await db.playerBar.create({
        data: {
            playerId,
            barId: hexagramId,
            source: 'iching',
            notes: `Cast on ${new Date().toLocaleDateString()}`
        }
    })
}

type GenerationOptions = {
    recordReading?: boolean
}

async function runIChingQuestGeneration(playerId: string, hexagramId: number, options: GenerationOptions = {}) {
    const recordReading = options.recordReading !== false

    const hexagram = await getHexagramById(hexagramId)
    if (!hexagram) {
        return { success: false, error: 'Hexagram not found' } satisfies ActionError
    }

    const result = await generateQuestCore(playerId, hexagramId)
    if (!result.success) {
        return result
    }

    if (recordReading) {
        await recordIChingReadingHistory(playerId, hexagramId)
    }

    return {
        success: true as const,
        quest: result.quest,
        questId: result.questId,
        hexagram: normalizeHexagram(hexagram)
    } satisfies IChingQuestSuccess
}

export async function generateQuestFromReading(hexagramId: number) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { success: false, error: 'Not logged in' } satisfies ActionError
    }

    await logLifecycleEvent(playerId, 'ICHING_CAST_ATTEMPT', {
        metadata: { path: 'generateQuestFromReading', hexagramId }
    })

    const featureError = await ensureIChingEnabled()
    if (featureError) {
        await logLifecycleEvent(playerId, 'ICHING_CAST_FAILED', {
            metadata: { reason: featureError.error, path: 'generateQuestFromReading' }
        })
        return featureError
    }

    const cooldownError = await ensureIChingCooldown(playerId)
    if (cooldownError) {
        await logLifecycleEvent(playerId, 'ICHING_CAST_COOLDOWN_BLOCKED', {
            metadata: { path: 'generateQuestFromReading', hexagramId }
        })
        return cooldownError
    }

    try {
        const result = await runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })

        if (!result.success) {
            await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATION_FAILED', {
                metadata: { reason: result.error, hexagramId, path: 'generateQuestFromReading' }
            })
            return result
        }

        // Trigger listeners (legacy + future trigger-based flows)
        await fireTrigger('ICHING_CAST')

        revalidatePath('/')
        revalidatePath('/iching')

        await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATED', {
            questId: result.questId,
            metadata: {
                hexagramId: result.hexagram.id,
                hexagramName: result.hexagram.name,
                path: 'generateQuestFromReading'
            }
        })

        return {
            ...result,
            message: 'The Oracle has spoken. A quest has been added to your board.'
        }
    } catch (error: unknown) {
        const message = toErrorMessage(error)
        await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATION_FAILED', {
            metadata: { reason: message, hexagramId, path: 'generateQuestFromReading' }
        })
        return { success: false, error: message } satisfies ActionError
    }
}

/**
 * Unified one-call path for Phase 1:
 * cast -> generate quest -> assign -> record reading -> fire trigger.
 */
export async function castAndGenerateQuest() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { success: false, error: 'Not logged in' } satisfies ActionError
    }

    await logLifecycleEvent(playerId, 'ICHING_CAST_ATTEMPT', {
        metadata: { path: 'castAndGenerateQuest' }
    })

    const featureError = await ensureIChingEnabled()
    if (featureError) {
        await logLifecycleEvent(playerId, 'ICHING_CAST_FAILED', {
            metadata: { reason: featureError.error, path: 'castAndGenerateQuest' }
        })
        return featureError
    }

    const cooldownError = await ensureIChingCooldown(playerId)
    if (cooldownError) {
        await logLifecycleEvent(playerId, 'ICHING_CAST_COOLDOWN_BLOCKED', {
            metadata: { path: 'castAndGenerateQuest' }
        })
        return cooldownError
    }

    try {
        const hexagramId = Math.floor(Math.random() * 64) + 1
        const result = await runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })

        if (!result.success) {
            await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATION_FAILED', {
                metadata: { reason: result.error, hexagramId, path: 'castAndGenerateQuest' }
            })
            return result
        }

        await fireTrigger('ICHING_CAST')
        revalidatePath('/')
        revalidatePath('/iching')

        await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATED', {
            questId: result.questId,
            metadata: {
                hexagramId: result.hexagram.id,
                hexagramName: result.hexagram.name,
                path: 'castAndGenerateQuest'
            }
        })

        return {
            ...result,
            message: 'The Oracle has spoken. A quest has been added to your board.'
        }
    } catch (error: unknown) {
        const message = toErrorMessage(error)
        await logLifecycleEvent(playerId, 'ICHING_QUEST_GENERATION_FAILED', {
            metadata: { reason: message, path: 'castAndGenerateQuest' }
        })
        return { success: false, error: message } satisfies ActionError
    }
}

/**
 * Script-friendly helper (no cookies/context required).
 */
export async function castAndGenerateQuestForPlayer(playerId: string) {
    const hexagramId = Math.floor(Math.random() * 64) + 1
    return runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })
}

/**
 * Script-friendly helper (no cookies/context required).
 */
export async function generateQuestFromReadingForPlayer(playerId: string, hexagramId: number) {
    return runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })
}

export async function generateQuestCore(playerId: string, hexagramId: number) {
    try {
        // 1. Fetch Player and Playbook
        const player = await db.player.findUnique({
            where: { id: playerId },
            include: { playbook: true }
        })

        if (!player || !player.playbook) {
            return { success: false, error: 'Player or playbook not found' } satisfies ActionError
        }

        // 2. Fetch Hexagram
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { success: false, error: 'Hexagram not found' } satisfies ActionError
        }

        // 3. Gather current story context (world state)
        const globalState = await db.globalState.findUnique({
            where: { id: 'singleton' },
            select: {
                currentAct: true,
                currentPeriod: true,
                storyClock: true,
            }
        })

        // 4. Prepare AI Prompt
        const moves = JSON.parse(player.playbook.moves || '[]')
        const storyContext = globalState
            ? `Current Story Context: Act ${globalState.currentAct}, Period ${globalState.currentPeriod}, Clock ${globalState.storyClock}/64.`
            : 'Current Story Context: Unknown (treat as early emergence).'

        const systemPrompt = `You are the Oracle of the Conclave. 
        You interpret the I Ching Hexagrams to guide the Collective.
        Your goal is to create a private story quest based on the hexagram and the player's playbook moves.
        
        The Hexagram is: #${hexagram.id} ${hexagram.name} - ${hexagram.tone}
        Meaning: ${hexagram.text}
        ${storyContext}
        
        The Player's Playbook is: ${player.playbook.name}
        Available Moves: ${JSON.stringify(moves)}
        
        Task:
        Select ONE relevant move from the playbook that aligns with the Hexagram's meaning.
        Create a quest title and description.
        The description should feel like a call to action that reflects both the hexagram and current story context.
        The Tone should be: ${hexagram.tone}.
        `

        // 5. Call AI
        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: z.object({
                title: z.string().describe("The poetic title of the quest"),
                description: z.string().describe("The quest instructions/narrative"),
                selectedMove: z.string().describe("The name of the move selected"),
            }),
            system: systemPrompt,
            prompt: "Generate a Collective Quest."
        })

        // 6. Create hexagram-transformed private story quest
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title: object.title,
                description: object.description,
                type: 'story',
                barState: 'promoted',
                reward: 2,
                status: 'active',
                visibility: 'private',
                hexagramId: hexagramId,
                inputs: JSON.stringify([
                    { key: 'reflection', label: 'Response', type: 'textarea', placeholder: `Use the move: ${object.selectedMove}` }
                ])
            }
        })

        // 7. Auto-assign to creator so it appears in active quests
        await db.playerQuest.create({
            data: {
                playerId,
                questId: newBar.id,
                status: 'assigned',
                assignedAt: new Date()
            }
        })

        // 8. Initialize rootId to self for new root quests
        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        // revalidatePath('/') // Moved to wrapper

        return { success: true, quest: object, questId: newBar.id } satisfies QuestCoreSuccess

    } catch (e: unknown) {
        console.error("Generate quest failed:", toErrorMessage(e))
        // Log stack for deep debugging
        if (e instanceof Error && e.stack) console.error(e.stack)

        return { success: false, error: toErrorMessage(e) || 'Failed to generate quest' } satisfies ActionError
    }
}
