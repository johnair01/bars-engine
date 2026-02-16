'use server'

import { db } from '@/lib/db'
import { getHexagramStructure } from '@/lib/iching-struct'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

type StoryClockRolloverPolicy = 'carry_unfinished' | 'archive_unfinished'
type CubeProximity = 'HIDE' | 'SEEK'
type CubeRisk = 'TRUTH' | 'DARE'
type CubeDirection = 'INTERIOR' | 'EXTERIOR'
type CubeSignatureKey = `${CubeProximity}_${CubeRisk}_${CubeDirection}`

type TrigramReading = {
    id: string
    name: string
    archetype: string
    keywords: string[]
}

type StoryClockSeed = {
    hexagram_id: number
    hexagram_name: string
    upper_trigram: TrigramReading
    lower_trigram: TrigramReading
    eligible_archetypes: string[]
    nation_tone_primary: string
    nation_tone_secondary: string
    cube_state: CubeSignatureKey
    face_context: string
}

type StoryClockQuestPayload = {
    reading: {
        hexagram_id: number
        hexagram_name: string
        upper_trigram: TrigramReading
        lower_trigram: TrigramReading
        brief: string
    }
    cube: {
        proximity: CubeProximity
        risk: CubeRisk
        direction: CubeDirection
        signature_display: string
    }
    quest: {
        title: string
        pitch: string
        template_id: string
        constraints: string[]
        main_character_move: {
            do: string
            done_when: string
        }
        ally_moves: Array<{
            type: 'VIBEULON' | 'BAR'
            ask: string
        }>
        rewards: {
            completion_vibeulons: 1
            first_completion_bonus: 1
        }
    }
}

const STORY_CLOCK_RESPONSE_SCHEMA = z.object({
    reading: z.object({
        hexagram_id: z.number(),
        hexagram_name: z.string(),
        upper_trigram: z.object({
            id: z.string(),
            name: z.string(),
            archetype: z.string(),
            keywords: z.array(z.string())
        }),
        lower_trigram: z.object({
            id: z.string(),
            name: z.string(),
            archetype: z.string(),
            keywords: z.array(z.string())
        }),
        brief: z.string()
    }),
    cube: z.object({
        proximity: z.enum(['HIDE', 'SEEK']),
        risk: z.enum(['TRUTH', 'DARE']),
        direction: z.enum(['INTERIOR', 'EXTERIOR']),
        signature_display: z.string()
    }),
    quest: z.object({
        title: z.string(),
        pitch: z.string(),
        template_id: z.string(),
        constraints: z.array(z.string()),
        main_character_move: z.object({
            do: z.string(),
            done_when: z.string()
        }),
        ally_moves: z.array(z.object({
            type: z.enum(['VIBEULON', 'BAR']),
            ask: z.string()
        })),
        rewards: z.object({
            completion_vibeulons: z.literal(1),
            first_completion_bonus: z.literal(1)
        })
    })
})

const TRIGRAM_DEFAULT_KEYWORDS: Record<string, { id: string, name: string, keywords: string[] }> = {
    heaven: { id: 'qian', name: 'Heaven', keywords: ['initiative', 'decisive action', 'leadership'] },
    earth: { id: 'kun', name: 'Earth', keywords: ['support', 'stability', 'care'] },
    thunder: { id: 'zhen', name: 'Thunder', keywords: ['activation', 'timing', 'spark'] },
    water: { id: 'kan', name: 'Water', keywords: ['depth', 'adaptation', 'risk-navigation'] },
    mountain: { id: 'gen', name: 'Mountain', keywords: ['boundary', 'discipline', 'stillness'] },
    wind: { id: 'xun', name: 'Wind', keywords: ['influence', 'patience', 'refinement'] },
    fire: { id: 'li', name: 'Fire', keywords: ['clarity', 'truth-speaking', 'illumination'] },
    lake: { id: 'dui', name: 'Lake', keywords: ['connection', 'play', 'cohesion'] },
}

const CUBE_TEMPLATE_PALETTE: Record<CubeSignatureKey, { template_id: string; signature_display: string; pattern: string[] }> = {
    HIDE_TRUTH_INTERIOR: {
        template_id: 'HTI_private_clarity_ritual',
        signature_display: 'Hide • Truth • Interior',
        pattern: [
            'Name the truth you have been avoiding in private.',
            'Choose the smallest internal shift that changes your next move.',
            'Output one sentence of clarity and one boundary.'
        ]
    },
    HIDE_TRUTH_EXTERIOR: {
        template_id: 'HTE_quiet_disclosure_boundary',
        signature_display: 'Hide • Truth • Exterior',
        pattern: [
            'Share one true constraint in a selective channel.',
            'Set one boundary with minimal drama.',
            'Output message sent or boundary enacted.'
        ]
    },
    HIDE_DARE_INTERIOR: {
        template_id: 'HDI_shadow_dare_solo',
        signature_display: 'Hide • Dare • Interior',
        pattern: [
            'Execute a silent dare that changes internal posture.',
            'Face one fear privately with a ritual or release.',
            'Output a vow, release, or locked-in decision.'
        ]
    },
    HIDE_DARE_EXTERIOR: {
        template_id: 'HDE_stealth_ship',
        signature_display: 'Hide • Dare • Exterior',
        pattern: [
            'Take one external stealth action creating irreversible progress.',
            'Ship one artifact, submit one form, or schedule one meeting.',
            'Output the artifact or confirmation event.'
        ]
    },
    SEEK_TRUTH_INTERIOR: {
        template_id: 'STI_mirror_and_integrate',
        signature_display: 'Seek • Truth • Interior',
        pattern: [
            'Ask for one mirror or reality-check.',
            'Digest privately and choose one integration step.',
            'Output feedback received and internal adjustment.'
        ]
    },
    SEEK_TRUTH_EXTERIOR: {
        template_id: 'STE_clear_ask_alignment',
        signature_display: 'Seek • Truth • Exterior',
        pattern: [
            'Initiate candid alignment conversation.',
            'Make one clean ask with clear roles and next step.',
            'Output agreement, ask sent, or clarified next move.'
        ]
    },
    SEEK_DARE_INTERIOR: {
        template_id: 'SDI_courage_rehearsal',
        signature_display: 'Seek • Dare • Interior',
        pattern: [
            'Rehearse the leap before the leap.',
            'Choose a script, body cue, and commitment threshold.',
            'Output rehearsal artifact and threshold.'
        ]
    },
    SEEK_DARE_EXTERIOR: {
        template_id: 'SDE_public_commit_sprint',
        signature_display: 'Seek • Dare • Exterior',
        pattern: [
            'Make visible commitment with witnesses.',
            'Take first public step immediately.',
            'Output posted commitment plus first action completed.'
        ]
    }
}

const PROXIMITY_CONSTRAINTS: Record<CubeProximity, string> = {
    HIDE: 'Keep audience minimal and use a selective channel.',
    SEEK: 'Use invitation, approach, and visible collaboration.'
}

const RISK_CONSTRAINTS: Record<CubeRisk, string> = {
    TRUTH: 'Name reality clearly through disclosure or an honest question.',
    DARE: 'Include risk, commitment, and one irreversible step.'
}

const DIRECTION_CONSTRAINTS: Record<CubeDirection, string> = {
    INTERIOR: 'Anchor the move in inner work: emotion, cognition, ritual, or parts.',
    EXTERIOR: 'Anchor the move in world action: message, artifact, meeting, or environment change.'
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

function parseCubeSignature(cubeState: string | null | undefined) {
    const normalized = (cubeState || '').trim().toUpperCase()
    const parts = normalized.split('_')
    const isValid =
        parts.length === 3
        && (parts[0] === 'HIDE' || parts[0] === 'SEEK')
        && (parts[1] === 'TRUTH' || parts[1] === 'DARE')
        && (parts[2] === 'INTERIOR' || parts[2] === 'EXTERIOR')

    const key = (isValid ? normalized : 'SEEK_TRUTH_EXTERIOR') as CubeSignatureKey
    const [proximity, risk, direction] = key.split('_') as [CubeProximity, CubeRisk, CubeDirection]
    const template = CUBE_TEMPLATE_PALETTE[key]

    return {
        key,
        proximity,
        risk,
        direction,
        signature_display: template.signature_display,
        template,
    }
}

function buildAxisConstraints(signature: { proximity: CubeProximity; risk: CubeRisk; direction: CubeDirection }) {
    return [
        PROXIMITY_CONSTRAINTS[signature.proximity],
        RISK_CONSTRAINTS[signature.risk],
        DIRECTION_CONSTRAINTS[signature.direction],
    ]
}

function normalizeText(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
}

function dedupeStrings(values: string[]) {
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of values) {
        const value = raw.trim()
        if (!value) continue
        const key = value.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(value)
    }
    return out
}

function containsInternalCubeToken(text: string) {
    return /\b[A-Z]+_[A-Z]+_[A-Z]+\b/.test(text)
}

function hasObservableDoneWhen(text: string) {
    const normalized = text.toLowerCase()
    return /(when|once|after|sent|posted|scheduled|submitted|shared|completed|confirmed|published|received|recorded|visible|artifact|meeting)/.test(normalized)
}

function hasConcreteMainMove(text: string) {
    const normalized = text.trim()
    if (!normalized || normalized.includes('\n') || normalized.length > 220) return false
    return /^(send|post|write|schedule|submit|share|record|publish|book|set|ask|invite|create|ship|draft|message|call|rehearse|practice|complete|announce)\b/i.test(normalized)
}

function resolveTrigramReading(trigramName: string, archetypeName: string | null): TrigramReading {
    const key = trigramName.trim().toLowerCase()
    const fallback = {
        id: key || 'unknown',
        name: trigramName || 'Unknown',
        keywords: ['clarity', 'action', 'alignment']
    }
    const meta = TRIGRAM_DEFAULT_KEYWORDS[key] || fallback
    return {
        id: meta.id,
        name: meta.name,
        archetype: archetypeName || `${meta.name} archetype`,
        keywords: meta.keywords
    }
}

function parseExistingPayload(raw: string | null) {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        const result = STORY_CLOCK_RESPONSE_SCHEMA.safeParse(parsed)
        return result.success ? result.data : null
    } catch {
        return null
    }
}

function validatePayload(payload: StoryClockQuestPayload, signature: ReturnType<typeof parseCubeSignature>) {
    const stringsToScan = [
        payload.reading.brief,
        payload.cube.signature_display,
        payload.quest.title,
        payload.quest.pitch,
        payload.quest.main_character_move.do,
        payload.quest.main_character_move.done_when,
        ...payload.quest.constraints,
        ...payload.quest.ally_moves.map((move) => move.ask),
    ]
    if (stringsToScan.some((value) => containsInternalCubeToken(value))) return false
    if (payload.quest.ally_moves.length < 2) return false
    const allyTypes = new Set(payload.quest.ally_moves.map((move) => move.type))
    if (!allyTypes.has('VIBEULON') || !allyTypes.has('BAR')) return false
    if (!hasConcreteMainMove(payload.quest.main_character_move.do)) return false
    if (!hasObservableDoneWhen(payload.quest.main_character_move.done_when)) return false
    if (payload.cube.proximity !== signature.proximity || payload.cube.risk !== signature.risk || payload.cube.direction !== signature.direction) return false
    if (payload.quest.template_id !== signature.template.template_id) return false

    const combinedText = [
        payload.quest.pitch,
        payload.quest.main_character_move.do,
        payload.quest.main_character_move.done_when,
        ...payload.quest.constraints
    ].join(' ').toLowerCase()

    const keywordSets = [payload.reading.upper_trigram.keywords, payload.reading.lower_trigram.keywords]
    return keywordSets.every((keywords) => keywords.some((keyword) => combinedText.includes(keyword.toLowerCase())))
}

function buildDeterministicFallbackPayload(seed: StoryClockSeed, signature: ReturnType<typeof parseCubeSignature>): StoryClockQuestPayload {
    const upperKeyword = seed.upper_trigram.keywords[0] || 'clarity'
    const lowerKeyword = seed.lower_trigram.keywords[0] || 'action'
    const axisConstraints = buildAxisConstraints(signature)
    const constraints = dedupeStrings([
        ...axisConstraints,
        ...signature.template.pattern.slice(0, 2),
        `Use ${upperKeyword} and ${lowerKeyword} language in the move framing.`,
    ]).slice(0, 5)

    return {
        reading: {
            hexagram_id: seed.hexagram_id,
            hexagram_name: seed.hexagram_name,
            upper_trigram: seed.upper_trigram,
            lower_trigram: seed.lower_trigram,
            brief: `Hexagram ${seed.hexagram_id} (${seed.hexagram_name}) blends ${seed.upper_trigram.name} over ${seed.lower_trigram.name}, asking for ${seed.nation_tone_primary} with a ${seed.nation_tone_secondary} undertone.`,
        },
        cube: {
            proximity: signature.proximity,
            risk: signature.risk,
            direction: signature.direction,
            signature_display: signature.signature_display,
        },
        quest: {
            title: `${signature.signature_display} quest: ${seed.hexagram_name}`,
            pitch: `Lead with ${upperKeyword} and ${lowerKeyword}. Eligible archetypes (${seed.eligible_archetypes.join(', ') || 'collective'}) should turn ${seed.face_context} into a concrete move this period.`,
            template_id: signature.template.template_id,
            constraints,
            main_character_move: {
                do: signature.proximity === 'HIDE'
                    ? `Send one focused update in a selective channel that applies ${upperKeyword} to ${seed.face_context}.`
                    : `Post one visible commitment that applies ${lowerKeyword} to ${seed.face_context}.`,
                done_when: signature.direction === 'EXTERIOR'
                    ? 'Done when the message, artifact, or meeting confirmation is visible to at least one collaborator.'
                    : 'Done when a written reflection and next-step boundary are recorded in your quest notes.'
            },
            ally_moves: [
                {
                    type: 'VIBEULON',
                    ask: `Send a vibulon signal backing ${upperKeyword} and naming one concrete nudge for momentum.`
                },
                {
                    type: 'BAR',
                    ask: `Create a BAR artifact that advances ${lowerKeyword} and references this quest title.`
                }
            ],
            rewards: { completion_vibeulons: 1, first_completion_bonus: 1 }
        }
    }
}

function toAiPromptPaletteText() {
    return Object.entries(CUBE_TEMPLATE_PALETTE)
        .map(([signature, template]) => {
            return [
                `${signature} -> ${template.template_id}`,
                `display: ${template.signature_display}`,
                ...template.pattern.map((line) => `- ${line}`),
            ].join('\n')
        })
        .join('\n\n')
}

function buildCanonicalPayloadFromModel(
    modelPayload: StoryClockQuestPayload,
    seed: StoryClockSeed,
    signature: ReturnType<typeof parseCubeSignature>
): StoryClockQuestPayload {
    const constraints = dedupeStrings([
        ...buildAxisConstraints(signature),
        ...modelPayload.quest.constraints.map((constraint) => normalizeText(constraint)),
    ]).slice(0, 6)

    const rawAllyMoves = modelPayload.quest.ally_moves.filter((move) => !!normalizeText(move.ask))
    const byType = new Map(rawAllyMoves.map((move) => [move.type, normalizeText(move.ask)]))
    if (!byType.has('VIBEULON')) {
        byType.set('VIBEULON', `Send one vibulon that names the next concrete move for ${seed.upper_trigram.archetype}.`)
    }
    if (!byType.has('BAR')) {
        byType.set('BAR', `Create one BAR artifact that makes progress visible for ${seed.lower_trigram.archetype}.`)
    }

    return {
        reading: {
            hexagram_id: seed.hexagram_id,
            hexagram_name: seed.hexagram_name,
            upper_trigram: seed.upper_trigram,
            lower_trigram: seed.lower_trigram,
            brief: normalizeText(modelPayload.reading.brief),
        },
        cube: {
            proximity: signature.proximity,
            risk: signature.risk,
            direction: signature.direction,
            signature_display: signature.signature_display,
        },
        quest: {
            title: normalizeText(modelPayload.quest.title),
            pitch: normalizeText(modelPayload.quest.pitch),
            template_id: signature.template.template_id,
            constraints,
            main_character_move: {
                do: normalizeText(modelPayload.quest.main_character_move.do),
                done_when: normalizeText(modelPayload.quest.main_character_move.done_when),
            },
            ally_moves: [
                { type: 'VIBEULON', ask: byType.get('VIBEULON') || '' },
                { type: 'BAR', ask: byType.get('BAR') || '' },
            ],
            rewards: { completion_vibeulons: 1, first_completion_bonus: 1 }
        }
    }
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
            select: { id: true, name: true, tone: true }
        })
        : null
    const split = splitTone(hexagram?.tone)
    const upperTrigramName = meta.upperTrigram || structure?.upper || 'Unknown'
    const lowerTrigramName = meta.lowerTrigram || structure?.lower || 'Unknown'
    const upperTrigram = resolveTrigramReading(upperTrigramName, meta.upperArchetypeName || null)
    const lowerTrigram = resolveTrigramReading(lowerTrigramName, meta.lowerArchetypeName || null)
    const eligible = [upperTrigram.archetype, lowerTrigram.archetype]
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    const signature = parseCubeSignature(meta.cubeState)
    return {
        hexagram_id: quest.hexagramId || 0,
        hexagram_name: hexagram?.name || `Hexagram ${quest.hexagramId || '?'}`,
        upper_trigram: upperTrigram,
        lower_trigram: lowerTrigram,
        eligible_archetypes: eligible,
        nation_tone_primary: meta.nationTonePrimary || split.primary,
        nation_tone_secondary: meta.nationToneSecondary || split.secondary,
        cube_state: signature.key,
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
    const signature = parseCubeSignature(seed.cube_state)
    const existingPayload = parseExistingPayload(meta.aiBody)
    const hasValidExisting = !!existingPayload && validatePayload(existingPayload, signature)
    if (hasValidExisting && meta.aiBody) {
        return {
            success: true as const,
            aiTitle: meta.aiTitle || existingPayload.quest.title || quest.title,
            aiBody: meta.aiBody,
            isFallback: meta.aiFallback === true,
            persisted: true,
            seed
        }
    }

    const persistPayload = async (payload: StoryClockQuestPayload, isFallback: boolean) => {
        const effectsObject = parseJsonObject(quest.completionEffects)
        const nextEffects = JSON.stringify({
            ...effectsObject,
            aiTitle: payload.quest.title,
            aiBody: JSON.stringify(payload),
            aiGeneratedAt: new Date().toISOString(),
            aiFallback: isFallback,
            upperTrigram: payload.reading.upper_trigram.name,
            lowerTrigram: payload.reading.lower_trigram.name,
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
    }

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: STORY_CLOCK_RESPONSE_SCHEMA,
            system: [
                'You are the Story Cube quest oracle for Story Clock quests only.',
                'Return JSON only.',
                'Do not include markdown fences or additional keys.',
                'Never output internal fused tokens like HIDE_DARE_INTERIOR in user-facing fields.',
                'Use concrete actions and observable done_when signals.',
            ].join(' '),
            prompt: [
                'Generate Story Clock quest JSON using this seed:',
                JSON.stringify({
                    hexagram_id: seed.hexagram_id,
                    upper_trigram: {
                        id: seed.upper_trigram.id,
                        name: seed.upper_trigram.name,
                        archetype: seed.upper_trigram.archetype,
                        keywords: seed.upper_trigram.keywords
                    },
                    lower_trigram: {
                        id: seed.lower_trigram.id,
                        name: seed.lower_trigram.name,
                        archetype: seed.lower_trigram.archetype,
                        keywords: seed.lower_trigram.keywords
                    },
                    eligible_archetypes: seed.eligible_archetypes,
                    nation_tone_primary: seed.nation_tone_primary,
                    nation_tone_secondary: seed.nation_tone_secondary,
                    cube_state: seed.cube_state,
                    face_context: seed.face_context
                }, null, 2),
                '',
                `Cube signature: ${signature.key} (${signature.signature_display})`,
                `Required template_id: ${signature.template.template_id}`,
                '',
                '8-signature template palette:',
                toAiPromptPaletteText(),
                '',
                'Hard constraints:',
                '- Include at least one keyword from upper_trigram.keywords and one from lower_trigram.keywords in pitch/main move/constraints.',
                '- main_character_move.do = one concrete action.',
                '- main_character_move.done_when = observable completion signal.',
                '- ally_moves must include BOTH VIBEULON and BAR.',
                '- rewards must be completion_vibeulons=1 and first_completion_bonus=1.',
                '- signature_display must be human-friendly, e.g. Hide • Truth • Interior.',
            ].join('\n')
        })

        const canonicalPayload = buildCanonicalPayloadFromModel(object, seed, signature)
        const isValid = validatePayload(canonicalPayload, signature)
        const finalPayload = isValid
            ? canonicalPayload
            : buildDeterministicFallbackPayload(seed, signature)
        const isFallback = !isValid

        await persistPayload(finalPayload, isFallback)
        const aiBody = JSON.stringify(finalPayload)

        return {
            success: true as const,
            aiTitle: finalPayload.quest.title,
            aiBody,
            isFallback,
            persisted: true,
            seed
        }
    } catch (error: any) {
        console.error('[StoryClock][AI][generateStoryClockQuestText]', error?.message || error)
        const fallbackPayload = buildDeterministicFallbackPayload(seed, signature)
        await persistPayload(fallbackPayload, true)
        const fallbackBody = JSON.stringify(fallbackPayload)
        return {
            success: true as const,
            aiTitle: fallbackPayload.quest.title,
            aiBody: fallbackBody,
            isFallback: true,
            persisted: true,
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
            aiBody: null as string | null,
            aiFallback: false as boolean
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
            aiBody: typeof parsed.aiBody === 'string' ? parsed.aiBody : null,
            aiFallback: typeof parsed.aiFallback === 'boolean' ? parsed.aiFallback : false
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
            aiBody: null as string | null,
            aiFallback: false as boolean
        }
    }
}
