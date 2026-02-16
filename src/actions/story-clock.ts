'use server'

import { db } from '@/lib/db'
import { getHexagramStructure } from '@/lib/iching-struct'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { buildArchetypeMapByTrigram } from '@/lib/archetype-registry'
import {
    type ForensicsStyleCheck,
    type QuestGenerationTrace,
    composeQuestCacheKey,
    normalizeInputs,
    percentageDistinct,
    percentageMatches,
    resolveGeneratorVersion,
    sha256Fingerprint,
    stableJsonStringify,
} from '@/lib/quest-forensics'

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

type PersistedPlayerFacingQuest = {
    title?: string
    action: string
    done_when: string
    ally_help?: string
}

type StoryClockSeedOverrides = Partial<Omit<StoryClockSeed, 'upper_trigram' | 'lower_trigram'>> & {
    upper_trigram?: Partial<TrigramReading>
    lower_trigram?: Partial<TrigramReading>
}

type StyleViolation = {
    code: string
    message: string
    fieldPath: string
}

type StyleValidationResult = {
    pass: boolean
    violations: StyleViolation[]
}

const QUEST_CACHE_KEY_VERSION = 'story-quest-cache-v1'
const DEBUG_QUEST_TRACE = process.env.DEBUG_QUEST_TRACE === '1'
const STYLE_GATE_ENABLED = process.env.STYLE_GATE_ENABLED === '1'
const DEFAULT_QUEST_MODEL = process.env.QUEST_MODEL || 'gpt-4o-mini'

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

const QUEST_STYLE_REPAIR_SCHEMA = z.object({
    title: z.string().max(40).optional(),
    action: z.string().max(140),
    done_when: z.string().max(90),
    ally_help: z.string().max(90).optional(),
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

function parseCubeSignature(
    cubeState: string | null | undefined,
    cubeStateLegacy?: string | null,
    cubeAxisType?: string | null
) {
    const parseFullSignature = (raw: string | null | undefined): CubeSignatureKey | null => {
        const normalized = (raw || '').trim().toUpperCase()
        const parts = normalized.split('_')
        const isValid =
            parts.length === 3
            && (parts[0] === 'HIDE' || parts[0] === 'SEEK')
            && (parts[1] === 'TRUTH' || parts[1] === 'DARE')
            && (parts[2] === 'INTERIOR' || parts[2] === 'EXTERIOR')
        return isValid ? normalized as CubeSignatureKey : null
    }

    const legacy = parseFullSignature(cubeStateLegacy)
    const raw = (cubeState || '').trim().toUpperCase()
    const direct = parseFullSignature(raw)

    let key: CubeSignatureKey | null = direct
    if (!key) {
        const visibility = legacy ? (legacy.split('_')[0] as CubeProximity) : 'SEEK'
        const risk = legacy ? (legacy.split('_')[1] as CubeRisk) : 'TRUTH'
        const direction = legacy ? (legacy.split('_')[2] as CubeDirection) : 'EXTERIOR'
        const axisType = (cubeAxisType || '').trim().toUpperCase()

        if (raw === 'HIDE' || raw === 'SEEK') {
            key = `${raw as CubeProximity}_${risk}_${direction}` as CubeSignatureKey
        } else if (raw === 'TRUTH' || raw === 'DARE') {
            key = `${visibility}_${raw as CubeRisk}_${direction}` as CubeSignatureKey
        } else if (raw.startsWith('VISIBILITY_')) {
            const value = raw.replace('VISIBILITY_', '')
            if (value === 'HIDE' || value === 'SEEK') {
                key = `${value as CubeProximity}_${risk}_${direction}` as CubeSignatureKey
            }
        } else if (raw.startsWith('REVELATION_')) {
            const value = raw.replace('REVELATION_', '')
            if (value === 'TRUTH' || value === 'DARE') {
                key = `${visibility}_${value as CubeRisk}_${direction}` as CubeSignatureKey
            }
        } else if (axisType === 'VISIBILITY' && (raw === 'TRUTH' || raw === 'DARE')) {
            key = `${visibility}_${raw as CubeRisk}_${direction}` as CubeSignatureKey
        } else if (axisType === 'REVELATION' && (raw === 'HIDE' || raw === 'SEEK')) {
            key = `${raw as CubeProximity}_${risk}_${direction}` as CubeSignatureKey
        }
    }

    if (!key) {
        key = legacy || 'SEEK_TRUTH_EXTERIOR'
    }

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

function clampText(value: string, max: number) {
    const normalized = value.trim()
    if (normalized.length <= max) return normalized
    return normalized.slice(0, max).trim()
}

function stripUiLabel(value: string, labels: string[]) {
    let cleaned = value.trim()
    let changed = true
    while (changed) {
        changed = false
        for (const label of labels) {
            const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const pattern = new RegExp(`^${escaped}\\s*:?\\s*`, 'i')
            if (pattern.test(cleaned)) {
                cleaned = cleaned.replace(pattern, '').trim()
                changed = true
            }
        }
    }
    return cleaned
}

function normalizePlayerFacingText(value: string, max: number, labels: string[]) {
    const stripped = stripUiLabel(value, labels)
    return clampText(stripped, max)
}

function toPersistedPlayerFacingQuest(payload: StoryClockQuestPayload): PersistedPlayerFacingQuest {
    const rawAction = normalizeText(payload.quest.main_character_move.do) || normalizeText(payload.quest.pitch)
    const rawDoneWhen = normalizeText(payload.quest.main_character_move.done_when)
    const firstAlly = payload.quest.ally_moves.find((move) => normalizeText(move.ask).length > 0)?.ask || ''

    const title = normalizePlayerFacingText(normalizeText(payload.quest.title), 40, ['title'])
    const action = normalizePlayerFacingText(rawAction, 140, ['action', 'main move', 'main_character_move', 'do'])
    const doneWhen = normalizePlayerFacingText(rawDoneWhen, 90, ['done when', 'done_when'])
    const allyHelp = normalizePlayerFacingText(firstAlly, 90, ['ally help', 'ally_help', 'ally'])

    return {
        title: title || undefined,
        action: action || 'Take one concrete step that advances the Big Score.',
        done_when: doneWhen || 'Marked complete in the app.',
        ally_help: allyHelp || undefined,
    }
}

function hasPersistedPlayerFacingContract(raw: string | null) {
    if (!raw) return false
    const parsed = parseJsonObject(raw)
    const candidate = parsed.player_facing || parsed.playerFacing || parsed.summary
    if (!candidate || typeof candidate !== 'object') return false
    const record = candidate as Record<string, unknown>
    return typeof record.action === 'string'
        && record.action.trim().length > 0
        && typeof record.done_when === 'string'
        && record.done_when.trim().length > 0
}

function mergeStoryClockSeed(base: StoryClockSeed, overrides?: StoryClockSeedOverrides) {
    if (!overrides) return base
    return {
        ...base,
        ...overrides,
        upper_trigram: {
            ...base.upper_trigram,
            ...(overrides.upper_trigram || {})
        },
        lower_trigram: {
            ...base.lower_trigram,
            ...(overrides.lower_trigram || {})
        },
    }
}

function toStyleChecks(stage: 'first_pass' | 'after_repair', result: StyleValidationResult): ForensicsStyleCheck[] {
    if (result.violations.length === 0) {
        return [{
            stage,
            code: 'style_contract',
            pass: true,
            message: 'All style-guide checks passed.',
            fieldPath: 'player_facing'
        }]
    }
    return result.violations.map((violation) => ({
        stage,
        code: violation.code,
        pass: false,
        message: violation.message,
        fieldPath: violation.fieldPath
    }))
}

function validateQuestStyle(playerFacing: PersistedPlayerFacingQuest): StyleValidationResult {
    const violations: StyleViolation[] = []
    const title = normalizeText(playerFacing.title)
    const action = normalizeText(playerFacing.action)
    const doneWhen = normalizeText(playerFacing.done_when)
    const allyHelp = normalizeText(playerFacing.ally_help)

    const hasPrefix = (value: string, prefixes: string[]) => prefixes.some((prefix) => value.toLowerCase().startsWith(prefix.toLowerCase()))
    const containsScaffolding = (value: string) =>
        /(oracle stub|reading|upper trigram|lower trigram|template_id|constraints?|cube signature|phase|kotter)/i.test(value)
    const genericAction = /(next concrete step|complete this quest|advance the big score)/i.test(action)

    if (!action) {
        violations.push({ code: 'ACTION_MISSING', message: 'Action is required.', fieldPath: 'action' })
    } else {
        if (action.length > 140) {
            violations.push({ code: 'ACTION_TOO_LONG', message: 'Action must be <= 140 chars.', fieldPath: 'action' })
        }
        if (hasPrefix(action, ['Action:', 'Main move:', 'Do:'])) {
            violations.push({ code: 'ACTION_LABEL_PREFIX', message: 'Action should not include UI labels.', fieldPath: 'action' })
        }
        if (containsScaffolding(action)) {
            violations.push({ code: 'ACTION_SCAFFOLDING', message: 'Action leaks engine scaffolding text.', fieldPath: 'action' })
        }
        if (!hasConcreteMainMove(action)) {
            violations.push({ code: 'ACTION_NOT_CONCRETE', message: 'Action must start with a concrete verb.', fieldPath: 'action' })
        }
        if (genericAction) {
            violations.push({ code: 'ACTION_GENERIC', message: 'Action is generic and not tactical.', fieldPath: 'action' })
        }
    }

    if (!doneWhen) {
        violations.push({ code: 'DONE_WHEN_MISSING', message: 'Done when is required.', fieldPath: 'done_when' })
    } else {
        if (doneWhen.length > 90) {
            violations.push({ code: 'DONE_WHEN_TOO_LONG', message: 'Done when must be <= 90 chars.', fieldPath: 'done_when' })
        }
        if (hasPrefix(doneWhen, ['Done when:', 'Done_when:'])) {
            violations.push({ code: 'DONE_WHEN_LABEL_PREFIX', message: 'Done when should not include UI labels.', fieldPath: 'done_when' })
        }
        if (!hasObservableDoneWhen(doneWhen)) {
            violations.push({ code: 'DONE_WHEN_NOT_OBSERVABLE', message: 'Done when should include an observable completion signal.', fieldPath: 'done_when' })
        }
    }

    if (title) {
        if (title.length > 40) {
            violations.push({ code: 'TITLE_TOO_LONG', message: 'Title must be <= 40 chars.', fieldPath: 'title' })
        }
        if (hasPrefix(title, ['Title:'])) {
            violations.push({ code: 'TITLE_LABEL_PREFIX', message: 'Title should not include UI labels.', fieldPath: 'title' })
        }
    }

    if (allyHelp) {
        if (allyHelp.length > 90) {
            violations.push({ code: 'ALLY_HELP_TOO_LONG', message: 'Ally help must be <= 90 chars.', fieldPath: 'ally_help' })
        }
        if (hasPrefix(allyHelp, ['Ally help:', 'Ally_help:'])) {
            violations.push({ code: 'ALLY_HELP_LABEL_PREFIX', message: 'Ally help should not include UI labels.', fieldPath: 'ally_help' })
        }
    }

    return {
        pass: violations.length === 0,
        violations,
    }
}

function applyPlayerFacingToPayload(payload: StoryClockQuestPayload, playerFacing: PersistedPlayerFacingQuest): StoryClockQuestPayload {
    const nextPayload: StoryClockQuestPayload = {
        ...payload,
        quest: {
            ...payload.quest,
            title: clampText(normalizeText(playerFacing.title) || payload.quest.title, 40),
            main_character_move: {
                do: clampText(normalizeText(playerFacing.action) || payload.quest.main_character_move.do, 140),
                done_when: clampText(normalizeText(playerFacing.done_when) || payload.quest.main_character_move.done_when, 90),
            },
            ally_moves: payload.quest.ally_moves.map((move, index) => {
                if (index !== 0) return move
                const repairedAlly = clampText(normalizeText(playerFacing.ally_help) || move.ask, 90)
                return {
                    ...move,
                    ask: repairedAlly,
                }
            })
        }
    }
    return nextPayload
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
    if (payload.quest.title.length > 40) return false
    if (payload.quest.pitch.length > 140) return false
    if (payload.quest.main_character_move.do.length > 140) return false
    if (payload.quest.main_character_move.done_when.length > 90) return false
    if (payload.quest.ally_moves.some((move) => move.ask.length > 90)) return false
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
            title: clampText(`${seed.hexagram_name} sprint`, 40),
            pitch: clampText(`Use ${upperKeyword} + ${lowerKeyword} to push this phase objective now.`, 140),
            template_id: signature.template.template_id,
            constraints,
            main_character_move: {
                do: clampText(signature.proximity === 'HIDE'
                    ? `Send one focused update in a selective channel that applies ${upperKeyword} to ${seed.face_context}.`
                    : `Post one visible commitment that applies ${lowerKeyword} to ${seed.face_context}.`, 140),
                done_when: clampText(signature.direction === 'EXTERIOR'
                    ? 'Done when the message, artifact, or meeting confirmation is visible to at least one collaborator.'
                    : 'Done when a written reflection and next-step boundary are recorded in your quest notes.', 90)
            },
            ally_moves: [
                {
                    type: 'VIBEULON',
                    ask: clampText(`Send one vibulon naming a concrete next move using ${upperKeyword}.`, 90)
                },
                {
                    type: 'BAR',
                    ask: clampText(`Create one BAR artifact that advances ${lowerKeyword} for this sprint.`, 90)
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

function buildStoryClockPrompt(seed: StoryClockSeed, signature: ReturnType<typeof parseCubeSignature>, seedTag: string | null) {
    return [
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
            face_context: seed.face_context,
            generation_seed: seedTag,
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
            title: clampText(normalizeText(modelPayload.quest.title), 40),
            pitch: clampText(normalizeText(modelPayload.quest.pitch), 140),
            template_id: signature.template.template_id,
            constraints,
            main_character_move: {
                do: clampText(normalizeText(modelPayload.quest.main_character_move.do), 140),
                done_when: clampText(normalizeText(modelPayload.quest.main_character_move.done_when), 90),
            },
            ally_moves: [
                { type: 'VIBEULON', ask: clampText(byType.get('VIBEULON') || '', 90) },
                { type: 'BAR', ask: clampText(byType.get('BAR') || '', 90) },
            ],
            rewards: { completion_vibeulons: 1, first_completion_bonus: 1 }
        }
    }
}

async function repairQuestStyle(
    payload: StoryClockQuestPayload,
    violations: StyleViolation[],
    seed: StoryClockSeed,
    modelParams: { temperature: number | null; top_p: number | null; max_tokens: number | null }
) {
    const playerFacing = toPersistedPlayerFacingQuest(payload)
    const deterministicRepair: PersistedPlayerFacingQuest = {
        title: clampText(stripUiLabel(normalizeText(playerFacing.title), ['title']), 40) || undefined,
        action: clampText(stripUiLabel(normalizeText(playerFacing.action), ['action', 'main move', 'do']), 140) || 'Take one concrete step that advances the Big Score.',
        done_when: clampText(stripUiLabel(normalizeText(playerFacing.done_when), ['done when', 'done_when']), 90) || 'Marked complete in the app.',
        ally_help: clampText(stripUiLabel(normalizeText(playerFacing.ally_help), ['ally help', 'ally_help']), 90) || undefined,
    }

    try {
        const generationArgs: Record<string, unknown> = {
            model: openai(DEFAULT_QUEST_MODEL),
            schema: QUEST_STYLE_REPAIR_SCHEMA,
            system: [
                'You repair tactical quest copy to match a strict style guide.',
                'Return JSON only with keys title/action/done_when/ally_help.',
                'Keep semantics intact while making the text concrete and observable.',
                'Do not include labels in values.',
            ].join(' '),
            prompt: [
                'Quest style repair request',
                `Seed hexagram: ${seed.hexagram_id} ${seed.hexagram_name}`,
                `Nation tone: ${seed.nation_tone_primary} / ${seed.nation_tone_secondary}`,
                `Cube signature: ${seed.cube_state}`,
                '',
                'Current player-facing fields:',
                stableJsonStringify(playerFacing),
                '',
                'Violations:',
                stableJsonStringify(violations),
                '',
                'Style constraints:',
                '- title optional <= 40 chars',
                '- action required, tactical, <= 140 chars, starts with concrete verb',
                '- done_when required, observable, <= 90 chars',
                '- ally_help optional <= 90 chars',
            ].join('\n')
        }
        if (typeof modelParams.temperature === 'number') generationArgs.temperature = modelParams.temperature
        if (typeof modelParams.top_p === 'number') generationArgs.topP = modelParams.top_p
        if (typeof modelParams.max_tokens === 'number') generationArgs.maxTokens = modelParams.max_tokens

        const { object } = await generateObject(generationArgs as any)
        const repairedObject = (object || {}) as Record<string, unknown>
        const repaired: PersistedPlayerFacingQuest = {
            title: clampText(stripUiLabel(normalizeText(repairedObject.title), ['title']), 40) || undefined,
            action: clampText(stripUiLabel(normalizeText(repairedObject.action), ['action', 'main move', 'do']), 140),
            done_when: clampText(stripUiLabel(normalizeText(repairedObject.done_when), ['done when', 'done_when']), 90),
            ally_help: clampText(stripUiLabel(normalizeText(repairedObject.ally_help), ['ally help', 'ally_help']), 90) || undefined,
        }
        return applyPlayerFacingToPayload(payload, repaired)
    } catch (error: any) {
        console.warn('[StoryClock][StyleRepair] Falling back to deterministic repair:', error?.message || error)
        return applyPlayerFacingToPayload(payload, deterministicRepair)
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
    const signature = parseCubeSignature(meta.cubeState, meta.cubeStateLegacy, meta.cubeAxisType)
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

    // Canonical trigram -> archetype mapping
    const archetypes = await db.playbook.findMany({
        select: { id: true, name: true, description: true }
    })
    const archetypeByTrigram = buildArchetypeMapByTrigram(archetypes)

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
        const derivedUpper = structure ? archetypeByTrigram.get(structure.upper.toLowerCase()) || null : null
        const derivedLower = structure ? archetypeByTrigram.get(structure.lower.toLowerCase()) || null : null

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

type StoryClockModelParams = {
    temperature: number | null
    top_p: number | null
    max_tokens: number | null
}

type StoryClockGenerationOptions = {
    requireAuth: boolean
    debug?: boolean
    seed?: string | number | null
    cacheBypass?: boolean
    strictCacheKey?: boolean
    dryRun?: boolean
    styleGateEnabled?: boolean
    modelParams?: Partial<StoryClockModelParams>
    seedOverrides?: StoryClockSeedOverrides
}

function resolveModelParams(overrides?: Partial<StoryClockModelParams>): StoryClockModelParams {
    return {
        temperature: typeof overrides?.temperature === 'number' ? overrides.temperature : null,
        top_p: typeof overrides?.top_p === 'number' ? overrides.top_p : null,
        max_tokens: typeof overrides?.max_tokens === 'number' ? overrides.max_tokens : null,
    }
}

function isStylePass(checks: ForensicsStyleCheck[], stage: 'first_pass' | 'after_repair') {
    const scoped = checks.filter((check) => check.stage === stage)
    if (scoped.length === 0) {
        if (stage === 'after_repair') {
            const first = checks.filter((check) => check.stage === 'first_pass')
            return first.length > 0 && first.every((check) => check.pass)
        }
        return false
    }
    return scoped.every((check) => check.pass)
}

async function generateStoryClockQuestTextInternal(
    questId: string,
    options: StoryClockGenerationOptions
) {
    if (options.requireAuth) {
        const cookieStore = await cookies()
        const playerId = cookieStore.get('bars_player_id')?.value
        if (!playerId) return { error: 'Not logged in' as const }
    }
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

    const debugEnabled = options.debug === true || DEBUG_QUEST_TRACE
    const styleGateEnabled = options.styleGateEnabled === true || STYLE_GATE_ENABLED
    const seedTag = options.seed != null ? String(options.seed) : null
    const modelParams = resolveModelParams(options.modelParams)
    const effectsObject = parseJsonObject(quest.completionEffects)
    const existingCacheKey = typeof effectsObject.questCacheKey === 'string' ? effectsObject.questCacheKey : null
    const cacheBypass = options.cacheBypass === true

    const meta = parseStoryClockMeta(quest.completionEffects)
    if (meta.questSource !== 'story_clock') {
        return { error: 'Only story_clock quests can be generated here.' as const }
    }

    const baseSeed = await buildStoryClockSeed(quest, meta)
    const seed = mergeStoryClockSeed(baseSeed, options.seedOverrides)
    const signature = parseCubeSignature(seed.cube_state)
    const prompt = buildStoryClockPrompt(seed, signature, seedTag)
    const promptFingerprint = sha256Fingerprint(prompt)
    const retrievalFingerprint = sha256Fingerprint({ documents: [] })
    const retrievalQueryFingerprint = sha256Fingerprint({ query: null, params: null })

    const inputsFingerprint = sha256Fingerprint(normalizeInputs({
        questId,
        seed,
        generationSeed: seedTag,
        modelParams,
        styleGateEnabled,
    }))

    const cacheKey = composeQuestCacheKey({
        version: QUEST_CACHE_KEY_VERSION,
        questId,
        seed: seedTag,
        inputsFingerprint
    })

    const existingPayload = parseExistingPayload(meta.aiBody)
    const hasValidExisting = !!existingPayload && validatePayload(existingPayload, signature)
    const cacheKeyMatches = existingCacheKey === cacheKey
    const canUseCached = !cacheBypass
        && hasValidExisting
        && !!meta.aiBody
        && (!options.strictCacheKey || cacheKeyMatches)

    const buildTrace = (
        payload: StoryClockQuestPayload,
        postprocessSteps: Array<{ name: string; version: string }>,
        styleChecks: ForensicsStyleCheck[],
        cacheStatus: {
            layer: 'completionEffects.aiBody'
            status: 'hit' | 'miss' | 'bypass'
            cache_key: string
            reason?: string
        }
    ): QuestGenerationTrace => ({
        generator_version: resolveGeneratorVersion(),
        timestamp: new Date().toISOString(),
        seed: seedTag,
        model_params: {
            provider: 'openai',
            model: DEFAULT_QUEST_MODEL,
            temperature: modelParams.temperature,
            top_p: modelParams.top_p,
            max_tokens: modelParams.max_tokens,
        },
        cache_status: cacheStatus,
        inputs_fingerprint: inputsFingerprint,
        retrieval_fingerprint: retrievalFingerprint,
        retrieval_query_fingerprint: retrievalQueryFingerprint,
        prompt_fingerprint: promptFingerprint,
        postprocess_steps: postprocessSteps,
        style_guide_checks: styleChecks,
        output_fingerprint: sha256Fingerprint(payload),
    })

    const persistPayload = async (payload: StoryClockQuestPayload, isFallback: boolean) => {
        const playerFacing = toPersistedPlayerFacingQuest(payload)
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
            playerFacingVersion: 1,
            player_facing: playerFacing,
            playerFacing,
            summary: playerFacing,
            questCacheKey: cacheKey,
        })

        if (!options.dryRun) {
            await db.customBar.update({
                where: { id: questId },
                data: { completionEffects: nextEffects }
            })

            revalidatePath('/bars/available')
            revalidatePath('/story-clock')
        }
    }

    if (canUseCached && existingPayload && meta.aiBody) {
        let cachedPayload = existingPayload
        const postprocessSteps: Array<{ name: string; version: string }> = [
            { name: 'cache_read', version: 'v1' }
        ]
        const firstPass = validateQuestStyle(toPersistedPlayerFacingQuest(cachedPayload))
        let styleChecks = toStyleChecks('first_pass', firstPass)

        if (styleGateEnabled && !firstPass.pass) {
            cachedPayload = await repairQuestStyle(cachedPayload, firstPass.violations, seed, modelParams)
            postprocessSteps.push({ name: 'style_repair', version: 'v1' })
            const afterRepair = validateQuestStyle(toPersistedPlayerFacingQuest(cachedPayload))
            styleChecks = [...styleChecks, ...toStyleChecks('after_repair', afterRepair)]
            await persistPayload(cachedPayload, meta.aiFallback === true)
        } else if (!hasPersistedPlayerFacingContract(quest.completionEffects)) {
            await persistPayload(cachedPayload, meta.aiFallback === true)
        }

        const trace = buildTrace(
            cachedPayload,
            postprocessSteps,
            styleChecks,
            {
                layer: 'completionEffects.aiBody',
                status: 'hit',
                cache_key: cacheKey,
                reason: cacheKeyMatches ? 'cache-key-match' : 'legacy-cache-hit-no-key-match'
            }
        )
        if (debugEnabled) {
            console.info('[StoryClock][Trace]', stableJsonStringify(trace))
        }
        return {
            success: true as const,
            aiTitle: meta.aiTitle || cachedPayload.quest.title || quest.title,
            aiBody: JSON.stringify(cachedPayload),
            isFallback: meta.aiFallback === true,
            persisted: !options.dryRun,
            seed,
            trace: debugEnabled ? trace : undefined
        }
    }

    try {
        const generationArgs: Record<string, unknown> = {
            model: openai(DEFAULT_QUEST_MODEL),
            schema: STORY_CLOCK_RESPONSE_SCHEMA,
            system: [
                'You are the Story Cube quest oracle for Story Clock quests only.',
                'Return JSON only.',
                'Do not include markdown fences or additional keys.',
                'Never output internal fused tokens like HIDE_DARE_INTERIOR in user-facing fields.',
                'Use concrete actions and observable done_when signals.',
            ].join(' '),
            prompt
        }
        if (typeof modelParams.temperature === 'number') generationArgs.temperature = modelParams.temperature
        if (typeof modelParams.top_p === 'number') generationArgs.topP = modelParams.top_p
        if (typeof modelParams.max_tokens === 'number') generationArgs.maxTokens = modelParams.max_tokens

        const { object } = await generateObject(generationArgs as any)
        const postprocessSteps: Array<{ name: string; version: string }> = [
            { name: 'canonicalize_model_payload', version: 'v1' }
        ]

        const modelPayload = (object && typeof object === 'object'
            ? object
            : buildDeterministicFallbackPayload(seed, signature)) as StoryClockQuestPayload
        const canonicalPayload = buildCanonicalPayloadFromModel(modelPayload, seed, signature)
        const isValid = validatePayload(canonicalPayload, signature)
        let finalPayload = isValid
            ? canonicalPayload
            : buildDeterministicFallbackPayload(seed, signature)
        const isFallback = !isValid
        if (!isValid) {
            postprocessSteps.push({ name: 'deterministic_fallback_payload', version: 'v1' })
        }

        const firstPass = validateQuestStyle(toPersistedPlayerFacingQuest(finalPayload))
        let styleChecks = toStyleChecks('first_pass', firstPass)
        if (styleGateEnabled && !firstPass.pass) {
            finalPayload = await repairQuestStyle(finalPayload, firstPass.violations, seed, modelParams)
            postprocessSteps.push({ name: 'style_repair', version: 'v1' })
            const afterRepair = validateQuestStyle(toPersistedPlayerFacingQuest(finalPayload))
            styleChecks = [...styleChecks, ...toStyleChecks('after_repair', afterRepair)]
        }

        await persistPayload(finalPayload, isFallback)
        const aiBody = JSON.stringify(finalPayload)
        const trace = buildTrace(
            finalPayload,
            postprocessSteps,
            styleChecks,
            {
                layer: 'completionEffects.aiBody',
                status: cacheBypass ? 'bypass' : 'miss',
                cache_key: cacheKey,
                reason: cacheBypass ? 'explicit-cache-bypass' : 'cache-miss'
            }
        )
        if (debugEnabled) {
            console.info('[StoryClock][Trace]', stableJsonStringify(trace))
        }

        return {
            success: true as const,
            aiTitle: finalPayload.quest.title,
            aiBody,
            isFallback,
            persisted: !options.dryRun,
            seed,
            trace: debugEnabled ? trace : undefined,
            styleFirstPass: isStylePass(styleChecks, 'first_pass'),
            styleAfterRepair: isStylePass(styleChecks, 'after_repair'),
        }
    } catch (error: any) {
        console.error('[StoryClock][AI][generateStoryClockQuestText]', error?.message || error)
        const fallbackPayload = buildDeterministicFallbackPayload(seed, signature)
        const postprocessSteps: Array<{ name: string; version: string }> = [
            { name: 'model_exception_fallback', version: 'v1' }
        ]
        const firstPass = validateQuestStyle(toPersistedPlayerFacingQuest(fallbackPayload))
        let styleChecks = toStyleChecks('first_pass', firstPass)
        let payload = fallbackPayload
        if (styleGateEnabled && !firstPass.pass) {
            payload = await repairQuestStyle(payload, firstPass.violations, seed, modelParams)
            postprocessSteps.push({ name: 'style_repair', version: 'v1' })
            const afterRepair = validateQuestStyle(toPersistedPlayerFacingQuest(payload))
            styleChecks = [...styleChecks, ...toStyleChecks('after_repair', afterRepair)]
        }

        await persistPayload(payload, true)
        const fallbackBody = JSON.stringify(payload)
        const trace = buildTrace(
            payload,
            postprocessSteps,
            styleChecks,
            {
                layer: 'completionEffects.aiBody',
                status: cacheBypass ? 'bypass' : 'miss',
                cache_key: cacheKey,
                reason: 'model-error-fallback'
            }
        )
        if (debugEnabled) {
            console.info('[StoryClock][Trace]', stableJsonStringify(trace))
        }
        return {
            success: true as const,
            aiTitle: payload.quest.title,
            aiBody: fallbackBody,
            isFallback: true,
            persisted: !options.dryRun,
            seed,
            trace: debugEnabled ? trace : undefined,
            styleFirstPass: isStylePass(styleChecks, 'first_pass'),
            styleAfterRepair: isStylePass(styleChecks, 'after_repair'),
        }
    }
}

export async function generateStoryClockQuestText(
    questId: string,
    options?: Omit<StoryClockGenerationOptions, 'requireAuth'>
) {
    return generateStoryClockQuestTextInternal(questId, { requireAuth: true, ...(options || {}) })
}

export async function preGenerateStoryClockQuestText(
    questId: string,
    options?: Omit<StoryClockGenerationOptions, 'requireAuth'>
) {
    return generateStoryClockQuestTextInternal(questId, { requireAuth: false, ...(options || {}) })
}

type QuestForensicsMode = 'A' | 'B' | 'C'

type QuestForensicsRunInput = {
    questId: string
    n?: number
    mode: QuestForensicsMode
    debug?: boolean
    baseInputs?: StoryClockSeedOverrides
    modelParams?: Partial<StoryClockModelParams>
}

type QuestForensicsSample = {
    index: number
    mode: QuestForensicsMode
    dimension?: string
    seed: string | null
    inputs_fingerprint: string
    prompt_fingerprint: string
    output_fingerprint: string
    cache_status: 'hit' | 'miss' | 'bypass'
    style_first_pass: boolean
    style_after_repair: boolean
    postprocess_steps: string[]
}

function inferSamenessRootCause(mode: QuestForensicsMode, samples: QuestForensicsSample[]) {
    const messages: string[] = []
    const distinctInputs = percentageDistinct(samples.map((sample) => sample.inputs_fingerprint))
    const distinctPrompts = percentageDistinct(samples.map((sample) => sample.prompt_fingerprint))
    const distinctOutputs = percentageDistinct(samples.map((sample) => sample.output_fingerprint))
    const cacheHitRate = percentageMatches(samples.map((sample) => sample.cache_status === 'hit'))
    const fallbackRate = percentageMatches(
        samples.map((sample) => sample.postprocess_steps.some((step) => step.startsWith('model_exception_fallback@')))
    )

    if (mode === 'A' && distinctInputs > 0 && distinctPrompts <= 20) {
        messages.push('Mode A indicates seed is not materially changing prompt assembly.')
    }
    if (mode === 'B' && distinctPrompts <= 30) {
        messages.push('Mode B indicates one or more varying fields are not wired into prompt assembly.')
    }
    if (mode === 'C' && cacheHitRate >= 70 && distinctOutputs <= 30) {
        messages.push('Mode C indicates cached quest payload reuse is likely flattening output variety.')
    }
    if (fallbackRate >= 60) {
        messages.push('Frequent model_exception_fallback indicates model call failures are forcing deterministic fallback output.')
    }
    if (distinctPrompts > 50 && distinctOutputs <= 20) {
        messages.push('Postprocess may be collapsing variety after generation (canonicalization/style/fallback).')
    }
    if (messages.length === 0) {
        messages.push('No single collapse point detected; inspect trace details for model params and fallback frequency.')
    }
    return messages
}

function summarizeForensics(samples: QuestForensicsSample[]) {
    return {
        total_runs: samples.length,
        distinct_prompt_fingerprint_pct: percentageDistinct(samples.map((sample) => sample.prompt_fingerprint)),
        distinct_output_fingerprint_pct: percentageDistinct(samples.map((sample) => sample.output_fingerprint)),
        cache_hit_rate_pct: percentageMatches(samples.map((sample) => sample.cache_status === 'hit')),
        style_pass_rate_first_pass_pct: percentageMatches(samples.map((sample) => sample.style_first_pass)),
        style_pass_rate_after_repair_pct: percentageMatches(samples.map((sample) => sample.style_after_repair)),
    }
}

function toForensicsSample(
    mode: QuestForensicsMode,
    index: number,
    seed: string | null,
    trace: QuestGenerationTrace,
    dimension?: string
): QuestForensicsSample {
    const firstPass = trace.style_guide_checks
        .filter((check) => check.stage === 'first_pass')
        .every((check) => check.pass)
    const afterRepairChecks = trace.style_guide_checks.filter((check) => check.stage === 'after_repair')
    const afterRepair = afterRepairChecks.length > 0
        ? afterRepairChecks.every((check) => check.pass)
        : firstPass

    return {
        index,
        mode,
        dimension,
        seed,
        inputs_fingerprint: trace.inputs_fingerprint,
        prompt_fingerprint: trace.prompt_fingerprint,
        output_fingerprint: trace.output_fingerprint,
        cache_status: trace.cache_status.status,
        style_first_pass: firstPass,
        style_after_repair: afterRepair,
        postprocess_steps: trace.postprocess_steps.map((step) => `${step.name}@${step.version}`)
    }
}

export async function runStoryQuestForensicsHarness(input: QuestForensicsRunInput) {
    const runs = Math.max(1, Math.min(20, input.n || 6))
    const baseModelParams = resolveModelParams({
        temperature: input.modelParams?.temperature ?? 0.7,
        top_p: input.modelParams?.top_p ?? 1,
        max_tokens: input.modelParams?.max_tokens ?? 900,
    })

    const samples: QuestForensicsSample[] = []

    if (input.mode === 'A') {
        for (let i = 0; i < runs; i += 1) {
            const seed = String(i + 1)
            const result = await generateStoryClockQuestTextInternal(input.questId, {
                requireAuth: false,
                debug: true,
                dryRun: true,
                cacheBypass: true,
                seed,
                modelParams: baseModelParams,
                seedOverrides: input.baseInputs
            })
            if ('error' in result) return result
            if (!result.trace) continue
            samples.push(toForensicsSample('A', i + 1, seed, result.trace))
        }
    }

    if (input.mode === 'B') {
        const stableSeed = 'forensics-b'
        const dimensions: Array<{ name: string; overrides: StoryClockSeedOverrides[] }> = [
            {
                name: 'hexagram',
                overrides: [
                    { ...(input.baseInputs || {}) },
                    { ...(input.baseInputs || {}), hexagram_id: 15, hexagram_name: 'Modesty' },
                    { ...(input.baseInputs || {}), hexagram_id: 20, hexagram_name: 'Contemplation' },
                ]
            },
            {
                name: 'cube_state',
                overrides: [
                    { ...(input.baseInputs || {}), cube_state: 'HIDE_TRUTH_INTERIOR' },
                    { ...(input.baseInputs || {}), cube_state: 'SEEK_TRUTH_EXTERIOR' },
                    { ...(input.baseInputs || {}), cube_state: 'SEEK_DARE_EXTERIOR' },
                ]
            },
            {
                name: 'tone',
                overrides: [
                    { ...(input.baseInputs || {}), nation_tone_primary: 'urgent', nation_tone_secondary: 'focused' },
                    { ...(input.baseInputs || {}), nation_tone_primary: 'patient', nation_tone_secondary: 'steady' },
                    { ...(input.baseInputs || {}), nation_tone_primary: 'joyful', nation_tone_secondary: 'open' },
                ]
            },
            {
                name: 'face_context',
                overrides: [
                    { ...(input.baseInputs || {}), face_context: 'Open one back-channel with a collaborator.' },
                    { ...(input.baseInputs || {}), face_context: 'Publish one visible update in a shared channel.' },
                    { ...(input.baseInputs || {}), face_context: 'Book one concrete meeting to remove blockers.' },
                ]
            }
        ]

        let idx = 0
        for (const dimension of dimensions) {
            for (const overrides of dimension.overrides) {
                idx += 1
                const result = await generateStoryClockQuestTextInternal(input.questId, {
                    requireAuth: false,
                    debug: true,
                    dryRun: true,
                    cacheBypass: true,
                    seed: stableSeed,
                    modelParams: baseModelParams,
                    seedOverrides: overrides,
                })
                if ('error' in result) return result
                if (!result.trace) continue
                samples.push(toForensicsSample('B', idx, stableSeed, result.trace, dimension.name))
            }
        }
    }

    if (input.mode === 'C') {
        const seed = 'forensics-c'
        for (let i = 0; i < runs; i += 1) {
            const cached = await generateStoryClockQuestTextInternal(input.questId, {
                requireAuth: false,
                debug: true,
                dryRun: true,
                cacheBypass: false,
                seed,
                modelParams: baseModelParams,
                seedOverrides: input.baseInputs
            })
            if ('error' in cached) return cached
            if (cached.trace) {
                samples.push(toForensicsSample('C', i + 1, seed, cached.trace, 'cache_on'))
            }

            const bypassed = await generateStoryClockQuestTextInternal(input.questId, {
                requireAuth: false,
                debug: true,
                dryRun: true,
                cacheBypass: true,
                seed,
                modelParams: baseModelParams,
                seedOverrides: input.baseInputs
            })
            if ('error' in bypassed) return bypassed
            if (bypassed.trace) {
                samples.push(toForensicsSample('C', i + 1 + runs, seed, bypassed.trace, 'cache_bypass'))
            }
        }
    }

    const summary = summarizeForensics(samples)
    const diagnosis = inferSamenessRootCause(input.mode, samples)
    return {
        success: true as const,
        mode: input.mode,
        summary,
        diagnosis,
        samples
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
            cubeAxisType: null as string | null,
            cubeStateLegacy: null as string | null,
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
            cubeAxisType: typeof parsed.cubeAxisType === 'string' ? parsed.cubeAxisType : null,
            cubeStateLegacy: typeof parsed.cubeStateLegacy === 'string' ? parsed.cubeStateLegacy : null,
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
            cubeAxisType: null as string | null,
            cubeStateLegacy: null as string | null,
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
