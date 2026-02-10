'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { completeQuest } from '@/actions/quest-engine'
import { getLatestFirstAidQuestLensForPlayer } from '@/actions/emotional-first-aid'

export async function generateQuestFromReading(hexagramId: number, useFirstAidLens: boolean = false) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const result = await generateQuestCore(playerId, hexagramId, useFirstAidLens)

    if (result.success) {
        // CHECK FOR QUEST COMPLETION (orientation-quest-3)
        // Check for thread participation instead of assignment
        const threadQuest = await db.threadQuest.findFirst({
            where: { questId: 'orientation-quest-3' }
        })

        if (threadQuest) {
            const progress = await db.threadProgress.findUnique({
                where: {
                    threadId_playerId: {
                        threadId: threadQuest.threadId,
                        playerId
                    }
                }
            })

            if (progress) {
                await completeQuest(threadQuest.questId, {
                    hexagramId,
                    generatedQuestId: result.quest?.title
                }, { threadId: threadQuest.threadId })
            }
        }

        revalidatePath('/')
    }

    return result
}

export async function generateQuestCore(playerId: string, hexagramId: number, useFirstAidLens: boolean = false) {
    try {
        // 1. Fetch Player and Playbook
        const player = await db.player.findUnique({
            where: { id: playerId },
            include: { playbook: true }
        })

        if (!player || !player.playbook) {
            return { error: 'Player or playbook not found' }
        }

        // 2. Fetch Hexagram
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        // 3. Prepare AI Prompt
        const moves = JSON.parse(player.playbook.moves || '[]')
        const firstAidLens = useFirstAidLens
            ? await getLatestFirstAidQuestLensForPlayer(playerId)
            : null

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
        ${firstAidLens ? `
        Additional emotional first-aid context (player opted in):
        ${firstAidLens.prompt}
        Prefer clean-up style framing when it remains aligned to the hexagram.
        ` : ''}
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
                description: firstAidLens
                    ? `${object.description}\n\nFirst Aid Lens: ${firstAidLens.publicHint}`
                    : object.description,
                type: 'inspiration', // MARK AS INSPIRATION (Raw Bar)
                reward: 2,
                status: 'active',
                storyPath: 'personal',
                visibility: 'private',
                moveType: firstAidLens?.preferredMoveType || null,
                inputs: JSON.stringify([
                    {
                        key: 'reflection',
                        label: 'Response',
                        type: 'textarea',
                        placeholder: firstAidLens
                            ? `Use the move: ${object.selectedMove}. Lens: ${firstAidLens.publicHint}`
                            : `Use the move: ${object.selectedMove}`
                    }
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

        return { success: true, quest: object }

    } catch (e: any) {
        console.error("Generate quest failed:", e?.message)
        // Log stack for deep debugging
        if (e.stack) console.error(e.stack)

        return { error: e?.message || 'Failed to generate quest' }
    }
}
