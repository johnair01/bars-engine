'use server'

import { db } from '@/lib/db'
import { getHexagramStructure } from '@/lib/iching-struct'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

type StoryClockRolloverPolicy = 'carry_unfinished' | 'archive_unfinished'

type StoryClockSeed = {
    hexagram_id: number | null
    upper_trigram: string
    lower_trigram: string
    eligible_archetypes: string[]
    nation_tone_primary: string
    nation_tone_secondary: string
    cube_state: string
    face_context: string
}

function resolveRolloverPolicy(value: unknown): StoryClockRolloverPolicy {
    if (value === 'archive_unfinished') return 'archive_unfinished'
    return 'carry_unfinished'
}

function parseFeaturesJson(raw: string | null): Record<string, unknown> {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'object' && parsed ? parsed as Record<string, unknown> : {}
    } catch {
        return {}
    }
}

function parseJsonObject(raw: string | null): Record<string, unknown> {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'object' && parsed ? parsed as Record<string, unknown> : {}
    } catch {
        return {}
    }
}

function splitTone(tone: string | null | undefined) {
    if (!tone || typeof tone !== 'string') {
        return { primary: 'balanced', secondary: 'unfolding' }
    }
    const cleaned = tone.trim()
    if (!cleaned) {
        return { primary: 'balanced', secondary: 'unfolding' }
    }
    const parts = cleaned.split(/[\/,;|]/).map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) return { primary: parts[0], secondary: parts[1] }
    return { primary: cleaned, secondary: `${cleaned} undercurrent` }
}

function buildFallbackStoryText(seed: StoryClockSeed) {
    const archetypes = seed.eligible_archetypes.length > 0
        ? seed.eligible_archetypes.join(' + ')
        : 'Any archetype'
    return [
        `Title: Hexagram ${seed.hexagram_id ?? '?'} - ${seed.cube_state}`,
        '',
        `The collective stands between ${seed.upper_trigram} above and ${seed.lower_trigram} below. Face context: ${seed.face_context}.`,
        `Primary tone: ${seed.nation_tone_primary}. Secondary tone: ${seed.nation_tone_secondary}. This quest should favor ${archetypes}.`,
        '',
        '- Move 1: Name one concrete action for this period.',
        '- Move 2: Identify one ally contribution that can unblock progress.',
        '- Move 3: Define one observable signal of completion.',
        '',
        `Omen: ${seed.cube_state} marks the pressure line for this turn.`,
    ].join('\n')
}

function formatGeneratedStoryBody(object: {
    title: string
    paragraphs: string[]
    moves: string[]
    omen: string
}) {
    return [
        `Title: ${object.title.trim()}`,
        '',
        ...object.paragraphs.map((paragraph) => paragraph.trim()),
        '',
        ...object.moves.map((move) => `- ${move.trim()}`),
        '',
        `Omen: ${object.omen.trim()}`,
    ].join('\n')
}

async function buildStoryClockSeed(
    quest: {
        hexagramId: number | null
        description: string
        completionEffects: string | null
    },
    meta: ReturnType<typeof parseStoryClockMeta>
): Promise<StoryClockSeed> {
    const structure = quest.hexagramId ? getHexagramStructure(quest.hexagramId) : null
    const hexagram = quest.hexagramId
        ? await db.bar.findUnique({
            where: { id: quest.hexagramId },
            select: { id: true, tone: true }
        })
        : null
    const split = splitTone(hexagram?.tone)
    const eligible = [meta.upperArchetypeName, meta.lowerArchetypeName]
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    return {
        hexagram_id: quest.hexagramId,
        upper_trigram: meta.upperTrigram || structure?.upper || 'unknown',
        lower_trigram: meta.lowerTrigram || structure?.lower || 'unknown',
        eligible_archetypes: eligible,
        nation_tone_primary: meta.nationTonePrimary || split.primary,
        nation_tone_secondary: meta.nationToneSecondary || split.secondary,
        cube_state: meta.cubeState || 'UNKNOWN',
        face_context: meta.faceContext || quest.description || 'No face context provided.',
    }
}

/**
 * Get Story Clock data including current period, quests by period, and completion tracking
 */
export async function getStoryClockData() {
    const globalState = await db.globalState.findUnique({
        where: { id: 'singleton' }
    })

    if (!globalState) {
        return {
            currentPeriod: 1,
            storyClock: 0,
            isPaused: false,
            hexagramSequence: [],
            questsByPeriod: {},
            rolloverPolicy: 'carry_unfinished' as StoryClockRolloverPolicy
        }
    }

    const sequence = JSON.parse(globalState.hexagramSequence) as number[]
    const appConfig = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { features: true }
    })
    const features = parseFeaturesJson(appConfig?.features || '{}')
    const rolloverPolicy = resolveRolloverPolicy(features.storyClockRolloverPolicy)

    // Canonical trigram -> archetype mapping (via playbook element metadata)
    const playbooks = await db.playbook.findMany({
        select: { id: true, name: true, description: true }
    })
    const playbookByElement = new Map(
        playbooks
            .map(playbook => {
                const match = playbook.description?.match(/Element:\s*([A-Za-z]+)/i)
                return match?.[1]
                    ? [match[1].toLowerCase(), { id: playbook.id, name: playbook.name }] as const
                    : null
            })
            .filter((entry): entry is readonly [string, { id: string, name: string }] => !!entry)
    )

    // Fetch all story quests (quests with hexagramId)
    const storyQuests = await db.customBar.findMany({
        where: {
            hexagramId: { not: null },
            status: 'active'
        },
        include: {
            assignments: {
                where: { status: 'completed' },
                take: 1,
                orderBy: { completedAt: 'asc' },
                include: {
                    player: {
                        select: { id: true, name: true }
                    }
                }
            }
        },
        orderBy: { periodGenerated: 'asc' }
    })

    // Group quests by period
    const questsByPeriod: Record<number, any[]> = {}
    storyQuests.forEach(quest => {
        const period = quest.periodGenerated || 1
        if (!questsByPeriod[period]) {
            questsByPeriod[period] = []
        }

        const firstCompleter = quest.assignments[0]?.player
        const meta = parseStoryClockMeta(quest.completionEffects)
        const structure = quest.hexagramId ? getHexagramStructure(quest.hexagramId) : null
        const derivedUpper = structure ? playbookByElement.get(structure.upper.toLowerCase()) || null : null
        const derivedLower = structure ? playbookByElement.get(structure.lower.toLowerCase()) || null : null

        const upperArchetypeId = meta.upperArchetypeId || meta.mainArchetypeIds?.[0] || derivedUpper?.id || null
        const upperArchetypeName = meta.upperArchetypeName || derivedUpper?.name || meta.mainArchetypeName || 'Unknown archetype'
        const lowerArchetypeId = meta.lowerArchetypeId || meta.mainArchetypeIds?.[1] || derivedLower?.id || null
        const lowerArchetypeName = meta.lowerArchetypeName || derivedLower?.name || meta.mainArchetypeName || 'Unknown archetype'

        questsByPeriod[period].push({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            hexagramId: quest.hexagramId,
            reward: quest.reward,
            completionEffects: quest.completionEffects,
            upperArchetypeId,
            upperArchetypeName,
            lowerArchetypeId,
            lowerArchetypeName,
            firstCompleter: firstCompleter ? {
                id: firstCompleter.id,
                name: firstCompleter.name
            } : null,
            isOldPeriod: period < globalState.currentPeriod
        })
    })

    return {
        currentPeriod: globalState.currentPeriod,
        storyClock: globalState.storyClock,
        isPaused: globalState.isPaused,
        hexagramSequence: sequence,
        questsByPeriod,
        rolloverPolicy
    }
}

export async function generateStoryClockQuestText(questId: string) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not logged in' as const }
    if (!questId) return { error: 'Missing quest ID' as const }

    const quest = await db.customBar.findUnique({
        where: { id: questId },
        select: {
            id: true,
            title: true,
            description: true,
            hexagramId: true,
            completionEffects: true
        }
    })

    if (!quest) return { error: 'Quest not found' as const }

    const meta = parseStoryClockMeta(quest.completionEffects)
    if (meta.questSource !== 'story_clock') {
        return { error: 'Only story_clock quests can be generated here.' as const }
    }

    const seed = await buildStoryClockSeed(quest, meta)
    const fallbackBody = buildFallbackStoryText(seed)

    if (meta.aiBody && meta.aiBody.trim().length > 0) {
        return {
            success: true as const,
            aiTitle: meta.aiTitle || quest.title,
            aiBody: meta.aiBody,
            isFallback: false,
            persisted: true,
            seed
        }
    }

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: z.object({
                title: z.string(),
                paragraphs: z.array(z.string()).min(2).max(3),
                moves: z.array(z.string()).length(3),
                omen: z.string(),
            }),
            system: [
                'You are the Story Clock Oracle for BARS.',
                'Write concise, playable quest text from the provided seed JSON.',
                'Output short, concrete language for players.',
                'Do not mention internal implementation details.',
            ].join(' '),
            prompt: [
                'Generate story_clock quest text from this seed JSON:',
                JSON.stringify(seed, null, 2),
                '',
                'Output constraints:',
                '- Title: 1 line',
                '- 2-3 short paragraphs',
                '- exactly 3 bullet moves',
                '- 1-line omen',
            ].join('\n')
        })

        const aiBody = formatGeneratedStoryBody(object)
        const aiTitle = object.title.trim() || quest.title
        const effectsObject = parseJsonObject(quest.completionEffects)

        const nextEffects = JSON.stringify({
            ...effectsObject,
            aiTitle,
            aiBody,
            aiGeneratedAt: new Date().toISOString(),
            upperTrigram: seed.upper_trigram,
            lowerTrigram: seed.lower_trigram,
            nationTonePrimary: seed.nation_tone_primary,
            nationToneSecondary: seed.nation_tone_secondary,
            faceContext: seed.face_context,
        })

        await db.customBar.update({
            where: { id: questId },
            data: { completionEffects: nextEffects }
        })

        revalidatePath('/bars/available')
        revalidatePath('/story-clock')

        return {
            success: true as const,
            aiTitle,
            aiBody,
            isFallback: false,
            persisted: true,
            seed
        }
    } catch (error: any) {
        console.error('[StoryClock][AI][generateStoryClockQuestText]', error?.message || error)
        return {
            success: true as const,
            aiTitle: `Hexagram ${seed.hexagram_id ?? '?'} Oracle Stub`,
            aiBody: fallbackBody,
            isFallback: true,
            persisted: false,
            seed
        }
    }
}

function parseStoryClockMeta(raw: string | null) {
    if (!raw) {
        return {
            questSource: null as string | null,
            mainArchetypeIds: null as (string | null)[] | null,
            mainArchetypeName: null as string | null,
            upperArchetypeId: null as string | null,
            upperArchetypeName: null as string | null,
            lowerArchetypeId: null as string | null,
            lowerArchetypeName: null as string | null,
            cubeState: null as string | null,
            nationTonePrimary: null as string | null,
            nationToneSecondary: null as string | null,
            faceContext: null as string | null,
            upperTrigram: null as string | null,
            lowerTrigram: null as string | null,
            aiTitle: null as string | null,
            aiBody: null as string | null
        }
    }

    try {
        const parsed = JSON.parse(raw)
        return {
            questSource: typeof parsed.questSource === 'string' ? parsed.questSource : null,
            mainArchetypeIds: Array.isArray(parsed.mainArchetypeIds) ? parsed.mainArchetypeIds : null,
            mainArchetypeName: typeof parsed.mainArchetypeName === 'string' ? parsed.mainArchetypeName : null,
            upperArchetypeId: typeof parsed.upperArchetypeId === 'string' ? parsed.upperArchetypeId : null,
            upperArchetypeName: typeof parsed.upperArchetypeName === 'string' ? parsed.upperArchetypeName : null,
            lowerArchetypeId: typeof parsed.lowerArchetypeId === 'string' ? parsed.lowerArchetypeId : null,
            lowerArchetypeName: typeof parsed.lowerArchetypeName === 'string' ? parsed.lowerArchetypeName : null,
            cubeState: typeof parsed.cubeState === 'string' ? parsed.cubeState : null,
            nationTonePrimary: typeof parsed.nationTonePrimary === 'string' ? parsed.nationTonePrimary : null,
            nationToneSecondary: typeof parsed.nationToneSecondary === 'string' ? parsed.nationToneSecondary : null,
            faceContext: typeof parsed.faceContext === 'string' ? parsed.faceContext : null,
            upperTrigram: typeof parsed.upperTrigram === 'string' ? parsed.upperTrigram : null,
            lowerTrigram: typeof parsed.lowerTrigram === 'string' ? parsed.lowerTrigram : null,
            aiTitle: typeof parsed.aiTitle === 'string' ? parsed.aiTitle : null,
            aiBody: typeof parsed.aiBody === 'string' ? parsed.aiBody : null
        }
    } catch {
        return {
            questSource: null as string | null,
            mainArchetypeIds: null as (string | null)[] | null,
            mainArchetypeName: null as string | null,
            upperArchetypeId: null as string | null,
            upperArchetypeName: null as string | null,
            lowerArchetypeId: null as string | null,
            lowerArchetypeName: null as string | null,
            cubeState: null as string | null,
            nationTonePrimary: null as string | null,
            nationToneSecondary: null as string | null,
            faceContext: null as string | null,
            upperTrigram: null as string | null,
            lowerTrigram: null as string | null,
            aiTitle: null as string | null,
            aiBody: null as string | null
        }
    }
}
