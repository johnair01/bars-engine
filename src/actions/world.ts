'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
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

    if (state.isPaused) {
        return { error: 'Story Clock is paused' }
    }

    const sequence = JSON.parse(state.hexagramSequence) as number[]

    // Calculate new clock and period
    const newClock = Math.min(64, state.storyClock + amount)
    const newPeriod = Math.ceil(newClock / 8)
    const newAct = Math.ceil(newClock / 8)

    // Get the Hexagram ID from the shuffled sequence (using internal 0-index)
    // Clock 1 = Index 0
    const hexagramId = sequence[newClock - 1] || 1

    // Update DB
    await db.globalState.update({
        where: { id: 'singleton' },
        data: {
            storyClock: newClock,
            currentAct: newAct,
            currentPeriod: newPeriod
        }
    })

    // Log Tick
    await db.storyTick.create({
        data: {
            tickNumber: newClock,
            actNumber: newAct,
            trigger: 'manual_admin',
            description: `Clock advanced to ${newClock} (Period ${newPeriod}, Hexagram #${hexagramId})`
        }
    })

    // Generate Global Quest for this Hexagram
    await generateGlobalQuest(hexagramId, newPeriod)

    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true, clock: newClock, act: newAct, period: newPeriod }
}

/**
 * TRIGGER THE TILT (Fiasco)
 * Transitions the world from Act 1 to Act 2.
 * This is a one-way door.
 */
export async function triggerTilt() {
    // 0. Verify Admin
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Unauthorized' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin' || r.role.key === 'ENGINEER')
    if (!isAdmin) return { error: 'Forbidden: Only Admins can tilt the world.' }

    const state = await getGlobalState()

    if (state.currentAct >= 2) {
        return { error: 'The Tilt has already occurred.' }
    }

    // 1. Update Global State
    await db.globalState.update({
        where: { id: 'singleton' },
        data: { currentAct: 2 }
    })

    // 2. Log the Meaningful Event
    await db.storyTick.create({
        data: {
            tickNumber: state.storyClock,
            actNumber: 2,
            trigger: 'THE_TILT',
            description: 'The Tilt has occurred. The world has shifted. Equilibrium is broken.'
        }
    })

    // 3. (Optional) In the future, this would inject "Tilt" elements into the custom_bars table

    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true, message: 'The Tilt has been triggered.' }
}

/**
 * START STORY CLOCK
 * Initialize or reset the hexagram sequence and generate initial quests
 */
export async function startStoryClock() {
    // Admin check
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Unauthorized' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin' || r.role.key === 'ENGINEER')
    if (!isAdmin) return { error: 'Forbidden: Only Admins can start the Story Clock.' }

    // Generate new shuffled sequence
    const sequence = shuffle(Array.from({ length: 64 }, (_, i) => i + 1))

    // Reset global state
    await db.globalState.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            storyClock: 1,
            currentAct: 1,
            currentPeriod: 1,
            isPaused: false,
            hexagramSequence: JSON.stringify(sequence)
        },
        update: {
            storyClock: 1,
            currentAct: 1,
            currentPeriod: 1,
            isPaused: false,
            hexagramSequence: JSON.stringify(sequence)
        }
    })

    // Generate initial 8 quests for Period 1
    for (let i = 0; i < 8; i++) {
        await generateGlobalQuest(sequence[i], 1)
    }

    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true, message: 'Story Clock started with new sequence.' }
}

/**
 * PAUSE STORY CLOCK
 */
export async function pauseStoryClock() {
    await db.globalState.update({
        where: { id: 'singleton' },
        data: { isPaused: true }
    })
    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true }
}

/**
 * RESUME STORY CLOCK
 */
export async function resumeStoryClock() {
    await db.globalState.update({
        where: { id: 'singleton' },
        data: { isPaused: false }
    })
    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true }
}

/**
 * RESET STORY CLOCK
 * Archive all existing story quests and start fresh
 */
export async function resetStoryClock() {
    // Admin check
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Unauthorized' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin' || r.role.key === 'ENGINEER')
    if (!isAdmin) return { error: 'Forbidden: Only Admins can reset the Story Clock.' }

    // Archive all story quests (quests with hexagramId)
    await db.customBar.updateMany({
        where: {
            hexagramId: { not: null },
            status: 'active'
        },
        data: { status: 'archived' }
    })

    // Start fresh
    return await startStoryClock()
}

/**
 * Generate a Collective Quest based on a Hexagram with Trigram Gating
 */
async function generateGlobalQuest(hexagramId: number, period: number) {
    try {
        // 1. Fetch Hexagram Data
        const hexagram = await db.bar.findFirst({
            where: { id: hexagramId }
        })

        // 2. Get Structure (Trigrams)
        const structure = getHexagramStructure(hexagramId)
        const allowedTrigrams = [structure.upper, structure.lower] // Visible to playbooks matching either

        // 3. Period theme
        const periodThemes = [
            '',  // 0 (unused)
            'Awakening - The world stirs with new potential',
            'Challenge - Obstacles emerge to test resolve',
            'Coalition - Building alliances and shared visions',
            'Revelation - Hidden truths come to light',
            'Transformation - The old gives way to the new',
            'Consolidation - Gains are secured and stabilized',
            'Resolution - Loose ends are tied, choices made final',
            'Culmination - The arc completes, the story concludes'
        ]

        const periodTheme = periodThemes[period] || 'Unknown'

        // 4. AI Generation
        const systemPrompt = `You are the Voice of the Conclave.
        The World Clock has ticked to Position ${hexagramId} in Period ${period}.
        Period Theme: ${periodTheme}
        Hexagram: ${hexagram?.name || 'Mystery'} (${hexagram?.tone || 'Unknown'}).
        Meaning: ${hexagram?.text || 'The mists swirl...'}.
        Trigrams: ${structure.upper} over ${structure.lower}.
        
        Generate a Global Community Quest for playbooks aligned with: ${allowedTrigrams.join(', ')}.
        This quest should reflect the themes of this hexagram AND the current period.
        The quest should feel aligned with "${periodTheme}".
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

        // 5. Create CustomBar with proper tracking
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

                // Story Clock Tracking
                hexagramId: hexagramId,
                periodGenerated: period,

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
