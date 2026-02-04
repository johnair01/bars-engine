'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function generateQuestFromReading(hexagramId: number) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

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

        // 5. Create CustomBar (Collective)
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title: object.title,
                description: object.description,
                type: 'vibe',
                reward: 2, // Slightly higher reward for oracle quests
                status: 'active',
                storyPath: 'collective', // Available to everyone
                inputs: JSON.stringify([
                    { key: 'reflection', label: 'Response', type: 'textarea', placeholder: `Use the move: ${object.selectedMove}` }
                ])
            }
        })

        // Initialize rootId to self for new root quests
        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        revalidatePath('/')

        return { success: true, quest: object }

    } catch (e: any) {
        console.error("Generate quest failed:", e?.message)
        return { error: e?.message || 'Failed to generate quest' }
    }
}
