'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { completeQuest, fireTrigger } from '@/actions/quest-engine'

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

async function tryCompleteOrientationQuestFromCast(playerId: string, hexagramId: number, generatedQuestId?: string) {
    try {
        const threadQuest = await db.threadQuest.findFirst({
            where: { questId: 'orientation-quest-3' }
        })

        if (!threadQuest) return

        const progress = await db.threadProgress.findUnique({
            where: {
                threadId_playerId: {
                    threadId: threadQuest.threadId,
                    playerId
                }
            }
        })

        if (!progress) return

        await completeQuest(threadQuest.questId, {
            hexagramId,
            generatedQuestId: generatedQuestId || null
        }, { threadId: threadQuest.threadId })
    } catch (e: unknown) {
        // Keep quest generation successful even if orientation post-processing fails.
        console.warn('[IChing] Orientation completion check failed:', toErrorMessage(e))
    }
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

    const result = await runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })

    if (!result.success) {
        return result
    }

    // Trigger listeners (legacy + future trigger-based flows)
    await fireTrigger('ICHING_CAST')

    // Hard guard for current orientation flow until trigger metadata is fully migrated.
    await tryCompleteOrientationQuestFromCast(playerId, hexagramId, result.questId)

    revalidatePath('/')
    revalidatePath('/iching')

    return {
        ...result,
        message: 'The Oracle has spoken. A quest has been added to your board.'
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

    const hexagramId = Math.floor(Math.random() * 64) + 1
    const result = await runIChingQuestGeneration(playerId, hexagramId, { recordReading: true })

    if (!result.success) {
        return result
    }

    await fireTrigger('ICHING_CAST')
    await tryCompleteOrientationQuestFromCast(playerId, hexagramId, result.questId)

    revalidatePath('/')
    revalidatePath('/iching')

    return {
        ...result,
        message: 'The Oracle has spoken. A quest has been added to your board.'
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

        // 3. Prepare AI Prompt
        const moves = JSON.parse(player.playbook.moves || '[]')

        const systemPrompt = `You are the Oracle of the Conclave. 
        You interpret the I Ching Hexagrams to guide the Collective.
        Your goal is to create a "Bar" (a quest/task) for the community based on the hexagram and the player's playbook moves.
        
        The Hexagram is: #${hexagram.id} ${hexagram.name} - ${hexagram.tone}
        Meaning: ${hexagram.text}
        
        The Player's Playbook is: ${player.playbook.name}
        Available Moves: ${JSON.stringify(moves)}
        
        Task:
        Select ONE relevant move from the playbook that aligns with the Hexagram's meaning.
        Create a quest title and description.
        The description should feel like a call to action for the collective, incorporating the vibe of the hexagram and the mechanics of the chosen move.
        The Tone should be: ${hexagram.tone}.
        `

        // 4. Call AI
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

        // 5. Create CustomBar (Inspiration)
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title: object.title,
                description: object.description,
                type: 'inspiration', // MARK AS INSPIRATION (Raw Bar)
                reward: 2,
                status: 'active',
                storyPath: 'personal',
                visibility: 'private',
                inputs: JSON.stringify([
                    { key: 'reflection', label: 'Response', type: 'textarea', placeholder: `Use the move: ${object.selectedMove}` }
                ])
            }
        })

        // Auto-assign to creator so it shows in "Active Quests"
        await db.playerQuest.create({
            data: {
                playerId,
                questId: newBar.id,
                status: 'assigned',
                assignedAt: new Date()
            }
        })

        // Initialize rootId to self for new root quests
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
