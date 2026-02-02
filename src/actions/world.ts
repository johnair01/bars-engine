'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { getHexagramStructure } from '@/lib/iching-struct'

/**
 * Get the singleton global state (with auto-seeding)
 */
export async function getGlobalState() {
    let state = await db.globalState.findUnique({ where: { id: 'singleton' } })

    // Seed if missing or sequence empty
    if (!state || !state.hexagramSequence || state.hexagramSequence === '[]') {
        const sequence = shuffle(Array.from({ length: 64 }, (_, i) => i + 1))

        if (!state) {
            state = await db.globalState.create({
                data: {
                    id: 'singleton',
                    storyClock: 1,
                    currentAct: 1,
                    hexagramSequence: JSON.stringify(sequence)
                }
            })
        } else {
            state = await db.globalState.update({
                where: { id: 'singleton' },
                data: { hexagramSequence: JSON.stringify(sequence) }
            })
        }
    }

    return state
}

/**
 * Advance the story clock by a specific amount (usually 1)
 */
export async function advanceClock(amount: number = 1) {
    const state = await getGlobalState()
    const sequence = JSON.parse(state.hexagramSequence) as number[]

    // Calculate new clock
    const newClock = Math.min(64, state.storyClock + amount)
    const newAct = Math.ceil(newClock / 8)

    // Get the Hexagram ID from the shuffled sequence (using internal 0-index)
    // Clock 1 = Index 0
    const hexagramId = sequence[newClock - 1] || 1

    // Update DB
    await db.globalState.update({
        where: { id: 'singleton' },
        data: {
            storyClock: newClock,
            currentAct: newAct
        }
    })

    // Log Tick
    await db.storyTick.create({
        data: {
            tickNumber: newClock,
            actNumber: newAct,
            trigger: 'manual_admin',
            description: `Clock advanced to ${newClock} (Hexagram #${hexagramId})`
        }
    })

    // Generate Global Quest for this Hexagram
    await generateGlobalQuest(hexagramId)

    revalidatePath('/')
    return { success: true, clock: newClock, act: newAct }
}

/**
 * Generate a Collective Quest based on a Hexagram with Trigram Gating
 */
async function generateGlobalQuest(hexagramId: number) {
    try {
        // 1. Fetch Hexagram Data
        const hexagram = await db.bar.findFirst({
            where: { id: hexagramId }
        })

        // 2. Get Structure (Trigrams)
        const structure = getHexagramStructure(hexagramId)
        const allowedTrigrams = [structure.upper, structure.lower] // Visible to playbooks matching either

        // 3. AI Generation
        const systemPrompt = `You are the Voice of the Conclave.
        The World Clock has ticked to ${hexagramId}.
        Hexagram: ${hexagram?.name || 'Mystery'} (${hexagram?.tone || 'Unknown'}).
        Meaning: ${hexagram?.text || 'The mists swirl...'}.
        Trigrams: ${structure.upper} over ${structure.lower}.
        
        Generate a Global Community Quest for playbooks aligned with: ${allowedTrigrams.join(', ')}.
        This quest should reflect the themes of this hexagram and specifically appeal to these elemental natures.
        `

        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: z.object({
                title: z.string(),
                description: z.string(),
            }),
            system: systemPrompt,
            prompt: "Generate Global Quest"
        })

        // 4. Create CustomBar
        await db.customBar.create({
            data: {
                creatorId: (await db.player.findFirst())?.id || 'unknown',

                title: object.title,
                description: object.description,
                type: 'story',
                reward: 5,
                status: 'active',
                storyPath: 'collective',
                allowedTrigrams: JSON.stringify(allowedTrigrams), // Gating Check

                inputs: JSON.stringify([
                    { key: 'contribution', label: 'Contribution', type: 'textarea' }
                ])
            }
        })

    } catch (e) {
        console.error("Global quest generation error:", e)
    }
}

// Fisher-Yates Shuffle
function shuffle(array: number[]) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
