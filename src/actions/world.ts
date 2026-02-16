'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getHexagramStructure, verifyHexagramIntegrity } from '@/lib/iching-struct'
import { assignCubeGeometry, defaultCubeBiasProvider, formatCubeGeometry, type CubeGeometry } from '@/lib/cube-engine'
import { getStoryCubeRuleFromGeometry } from '@/lib/cube-quest-rules'
import { buildArchetypeMapByTrigram, toTrigramArchetypeNameLookup } from '@/lib/archetype-registry'

const STORY_CLOCK_PERIODS = 8
const HEXAGRAMS_PER_PERIOD = 8
const STORY_CLOCK_MAX = STORY_CLOCK_PERIODS * HEXAGRAMS_PER_PERIOD
const STORY_CLOCK_ROLLOVER_FEATURE_KEY = 'storyClockRolloverPolicy'
type StoryAxisType = 'VISIBILITY' | 'REVELATION'
type StoryAxisState = 'HIDE' | 'SEEK' | 'TRUTH' | 'DARE'

export type StoryClockRolloverPolicy = 'carry_unfinished' | 'archive_unfinished'

function getActFromPeriod(period: number) {
    return period <= 4 ? 1 : 2
}

function resolveStoryClockRolloverPolicy(value: unknown): StoryClockRolloverPolicy {
    if (value === 'archive_unfinished') return 'archive_unfinished'
    return 'carry_unfinished'
}

function parseFeaturesJson(raw: string | null) {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'object' && parsed ? parsed as Record<string, unknown> : {}
    } catch {
        return {}
    }
}

export async function getStoryClockRolloverPolicy(): Promise<StoryClockRolloverPolicy> {
    const appConfig = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { features: true }
    })
    const features = parseFeaturesJson(appConfig?.features || '{}')
    return resolveStoryClockRolloverPolicy(features[STORY_CLOCK_ROLLOVER_FEATURE_KEY])
}

export async function setStoryClockRolloverPolicy(policy: StoryClockRolloverPolicy) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Unauthorized' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = player?.roles.some(r => r.role.key === 'admin' || r.role.key === 'ENGINEER')
    if (!isAdmin) return { error: 'Forbidden: Only Admins can update rollover policy.' }

    const current = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { features: true }
    })
    const features = parseFeaturesJson(current?.features || '{}')
    features[STORY_CLOCK_ROLLOVER_FEATURE_KEY] = resolveStoryClockRolloverPolicy(policy)

    await db.appConfig.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            features: JSON.stringify(features),
            updatedBy: playerId
        },
        update: {
            features: JSON.stringify(features),
            updatedBy: playerId
        }
    })

    revalidatePath('/story-clock')
    revalidatePath('/admin')
    return { success: true, policy: resolveStoryClockRolloverPolicy(policy) }
}

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
    const newClock = Math.min(STORY_CLOCK_MAX, state.storyClock + amount)
    const newPeriod = Math.max(1, Math.ceil(newClock / HEXAGRAMS_PER_PERIOD))
    const newAct = getActFromPeriod(newPeriod)

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

    // When crossing into a new period, generate that period's story quests.
    if (newPeriod !== state.currentPeriod) {
        await ensurePeriodStoryQuests(newPeriod, sequence)
    }

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

    // Archive previous story-clock quests before starting a new run.
    await db.customBar.updateMany({
        where: {
            status: 'active',
            completionEffects: { contains: '"questSource":"story_clock"' }
        },
        data: { status: 'archived' }
    })

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

    await ensurePeriodStoryQuests(1, sequence)

    revalidatePath('/')
    revalidatePath('/story-clock')
    return { success: true, message: 'Story Clock started with new sequence.' }
}

/**
 * ADVANCE STORY PERIOD
 * Move to the next period (8 total), with 2 acts of 4 periods each.
 */
export async function advanceStoryPeriod() {
    // Admin check
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Unauthorized' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin' || r.role.key === 'ENGINEER')
    if (!isAdmin) return { error: 'Forbidden: Only Admins can advance periods.' }

    const state = await getGlobalState()
    const currentPeriod = Math.max(1, Math.min(STORY_CLOCK_PERIODS, state.currentPeriod || 1))
    if (currentPeriod >= STORY_CLOCK_PERIODS) {
        return { error: 'Already at final period (8).' }
    }

    const nextPeriod = currentPeriod + 1
    const nextClock = (nextPeriod - 1) * HEXAGRAMS_PER_PERIOD + 1
    const nextAct = getActFromPeriod(nextPeriod)
    const sequence = JSON.parse(state.hexagramSequence || '[]') as number[]
    const rolloverPolicy = await getStoryClockRolloverPolicy()
    let archivedUnfinished = 0

    if (rolloverPolicy === 'archive_unfinished') {
        const archiveRes = await db.customBar.updateMany({
            where: {
                status: 'active',
                firstCompleterId: null,
                periodGenerated: { lt: nextPeriod },
                completionEffects: { contains: '"questSource":"story_clock"' }
            },
            data: { status: 'archived' }
        })
        archivedUnfinished = archiveRes.count
    }

    await db.globalState.update({
        where: { id: 'singleton' },
        data: {
            currentPeriod: nextPeriod,
            currentAct: nextAct,
            storyClock: nextClock
        }
    })

    await db.storyTick.create({
        data: {
            tickNumber: nextClock,
            actNumber: nextAct,
            trigger: 'manual_admin_period_advance',
            description: `Advanced to Period ${nextPeriod} (Act ${nextAct})`
        }
    })

    await ensurePeriodStoryQuests(nextPeriod, sequence)

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/story-clock')
    return {
        success: true,
        period: nextPeriod,
        act: nextAct,
        clock: nextClock,
        rolloverPolicy,
        archivedUnfinished
    }
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
 * Ensure exactly 8 story-clock quests exist for a period.
 */
async function ensurePeriodStoryQuests(period: number, sequence: number[]) {
    if (period < 1 || period > STORY_CLOCK_PERIODS) return
    const startIndex = (period - 1) * HEXAGRAMS_PER_PERIOD
    const periodHexagrams = sequence.slice(startIndex, startIndex + HEXAGRAMS_PER_PERIOD)
    if (periodHexagrams.length === 0) return

    const runId = buildStoryClockRunId(sequence)
    const creator = await db.player.findFirst({ select: { id: true } })
    if (!creator?.id) return

    const archetypes = await db.playbook.findMany({
        select: { id: true, name: true, description: true }
    })
    const archetypeByTrigram = buildArchetypeMapByTrigram(archetypes)
    const trigramToArchetype = toTrigramArchetypeNameLookup(archetypeByTrigram)

    const integrityTargets = [15, 20, periodHexagrams[0]].filter((hexagram): hexagram is number => typeof hexagram === 'number')
    for (const hexagram of Array.from(new Set(integrityTargets))) {
        const integrity = verifyHexagramIntegrity(hexagram, trigramToArchetype)
        if (!integrity.valid) {
            console.error('[StoryClock][HexagramIntegrity]', integrity)
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(`Hexagram integrity failed for #${hexagram}: ${integrity.errors.join('; ')}`)
            }
        }
    }

    const queuedQuestIds: string[] = []

    for (const hexagramId of periodHexagrams) {
        const structure = getHexagramStructure(hexagramId)
        const upperArchetype = archetypeByTrigram.get(structure.upper.toLowerCase()) || null
        const lowerArchetype = archetypeByTrigram.get(structure.lower.toLowerCase()) || null
        const cubeBias = defaultCubeBiasProvider.getBiasForHexagram(hexagramId)
        const cube = assignCubeGeometry({
            hexagramId,
            bias: cubeBias,
            seed: `${runId}:${hexagramId}`,
        })
        const storyAxis = assignStoryAxis(cube, `${runId}:${hexagramId}`)

        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[CubeEngine] Hexagram #${hexagramId}: ${formatCubeGeometry(cube)} -> ${storyAxis.axisType}:${storyAxis.axisValue}`)
        }

        const questId = await generateGlobalQuest({
            creatorId: creator.id,
            hexagramId,
            period,
            periodIndex: period - 1,
            runId,
            upperArchetype,
            lowerArchetype,
            cube,
            storyAxis,
        })
        if (questId) {
            queuedQuestIds.push(questId)
        }
    }

    const { preGenerateStoryClockQuestText } = await import('@/actions/story-clock')
    for (const questId of queuedQuestIds) {
        const result = await preGenerateStoryClockQuestText(questId)
        if ('error' in result) {
            console.warn(`[StoryClock][Pregenerate] ${questId}: ${result.error}`)
        }
    }
}

/**
 * Generate a deterministic story-clock quest for one period hexagram.
 */
async function generateGlobalQuest(params: {
    creatorId: string
    hexagramId: number
    period: number
    periodIndex: number
    runId: string
    upperArchetype: { id: string, name: string } | null
    lowerArchetype: { id: string, name: string } | null
    cube: CubeGeometry
    storyAxis: { axisType: StoryAxisType; axisValue: StoryAxisState; legacyState: string }
}): Promise<string | null> {
    const { creatorId, hexagramId, period, periodIndex, runId, upperArchetype, lowerArchetype, cube, storyAxis } = params
    try {
        const existingQuest = await db.customBar.findFirst({
            where: {
                status: 'active',
                periodGenerated: period,
                hexagramId,
                completionEffects: {
                    contains: `"storyClockRunId":"${runId}"`
                }
            },
            select: { id: true }
        })
        if (existingQuest) return existingQuest.id

        const hexagram = await db.bar.findFirst({ where: { id: hexagramId } })
        const structure = getHexagramStructure(hexagramId)
        const periodTheme = getPeriodTheme(period)
        const upperArchetypeLabel = upperArchetype?.name || `${structure.upper} archetype`
        const lowerArchetypeLabel = lowerArchetype?.name || `${structure.lower} archetype`
        const cubeRule = getStoryCubeRuleFromGeometry(cube)

        const completionEffects = JSON.stringify({
            questSource: 'story_clock',
            storyClockRunId: runId,
            periodIndex,
            hexagramId,
            mainArchetypeIds: [upperArchetype?.id || null, lowerArchetype?.id || null],
            upperArchetypeId: upperArchetype?.id || null,
            upperArchetypeName: upperArchetype?.name || null,
            lowerArchetypeId: lowerArchetype?.id || null,
            lowerArchetypeName: lowerArchetype?.name || null,
            cube,
            cubeStateMode: 'single_axis_v1',
            cubeAxisType: storyAxis.axisType,
            cubeState: storyAxis.axisValue,
            cubeStateLegacy: storyAxis.legacyState,
            cubeMechanics: {
                version: cubeRule.version,
                moveType: cubeRule.moveType,
                requiresAssist: cubeRule.requiresAssist,
                requiredInputKeys: cubeRule.requiredInputKeys,
                completionFraming: cubeRule.completionFraming,
                assistPrompt: cubeRule.assistPrompt
            }
        })

        const createdQuest = await db.customBar.create({
            data: {
                creatorId,
                title: `P${period} • ${hexagram?.name || `Hexagram ${hexagramId}`}`,
                description: `${periodTheme}. Main characters: ${upperArchetypeLabel} (upper trigram) + ${lowerArchetypeLabel} (lower trigram). ${cubeRule.requiresAssist ? 'Requires at least one Assist Signal before completion.' : 'Solo completion is allowed for eligible archetypes.'}`,
                type: 'story',
                reward: 1,
                moveType: cubeRule.moveType,
                status: 'active',
                storyPath: 'collective',
                visibility: 'public',
                allowedTrigrams: '[]',
                hexagramId,
                periodGenerated: period,
                completionEffects,
                inputs: JSON.stringify(cubeRule.inputs)
            },
            select: { id: true }
        })
        return createdQuest.id
    } catch (e) {
        console.error("Global quest generation error:", e)
        return null
    }
}

function assignStoryAxis(cube: CubeGeometry, seed: string) {
    const hash = seed.split('').reduce((acc, char, idx) => {
        const weight = char.charCodeAt(0) * (idx + 1)
        return (acc + weight) % 1000003
    }, 0)
    const axisType: StoryAxisType = hash % 2 === 0 ? 'VISIBILITY' : 'REVELATION'
    const axisValue: StoryAxisState = axisType === 'VISIBILITY'
        ? cube.visibility as StoryAxisState
        : cube.revelation as StoryAxisState
    return {
        axisType,
        axisValue,
        legacyState: cube.state,
    }
}

function getPeriodTheme(period: number) {
    const periodThemes = [
        '',
        'Awakening - The world stirs with new potential',
        'Challenge - Obstacles emerge to test resolve',
        'Coalition - Building alliances and shared visions',
        'Revelation - Hidden truths come to light',
        'Transformation - The old gives way to the new',
        'Consolidation - Gains are secured and stabilized',
        'Resolution - Loose ends are tied, choices made final',
        'Culmination - The arc completes, the story concludes'
    ]
    return periodThemes[period] || 'Unknown'
}

function buildStoryClockRunId(sequence: number[]) {
    const hash = sequence.reduce((acc, value, idx) => {
        const weighted = value * (idx + 1)
        return (acc + weighted) % 1000003
    }, 0)
    return `story-clock-${hash}`
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
