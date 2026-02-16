import type { BarInput } from '@/lib/bars'
import type { CubeGeometry, EncounterState } from '@/lib/cube-engine'

export type StoryCubeMoveType = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

export type StoryCubeMechanics = {
    version: number
    moveType: StoryCubeMoveType
    requiresAssist: boolean
    requiredInputKeys: string[]
    completionFraming: string
    assistPrompt: string | null
}

export type StoryCubeRule = StoryCubeMechanics & {
    inputs: BarInput[]
}

export const STORY_CUBE_RULE_VERSION = 1

const STANDARD_ASSIST_PROMPT = 'This cube state requires at least one Assist Signal from another player before completion.'

function createRule(params: {
    moveType: StoryCubeMoveType
    requiresAssist: boolean
    completionFraming: string
    assistPrompt?: string | null
    inputs: BarInput[]
}): StoryCubeRule {
    const requiredInputKeys = params.inputs
        .filter((input) => input.required)
        .map((input) => input.key)

    return {
        version: STORY_CUBE_RULE_VERSION,
        moveType: params.moveType,
        requiresAssist: params.requiresAssist,
        requiredInputKeys,
        completionFraming: params.completionFraming,
        assistPrompt: params.requiresAssist
            ? (params.assistPrompt ?? STANDARD_ASSIST_PROMPT)
            : null,
        inputs: params.inputs,
    }
}

export const STORY_CUBE_STATES: EncounterState[] = [
    'HIDE_TRUTH_INTERIOR',
    'HIDE_TRUTH_EXTERIOR',
    'HIDE_DARE_INTERIOR',
    'HIDE_DARE_EXTERIOR',
    'SEEK_TRUTH_INTERIOR',
    'SEEK_TRUTH_EXTERIOR',
    'SEEK_DARE_INTERIOR',
    'SEEK_DARE_EXTERIOR',
]

export const STORY_CUBE_RULES: Readonly<Record<EncounterState, StoryCubeRule>> = {
    HIDE_TRUTH_INTERIOR: createRule({
        moveType: 'cleanUp',
        requiresAssist: false,
        completionFraming: 'Reveal a private truth and commit to one concrete internal repair.',
        inputs: [
            {
                key: 'privateTruth',
                label: 'Private truth',
                type: 'textarea',
                required: true,
                placeholder: 'What truth have you been avoiding?',
            },
            {
                key: 'innerRepair',
                label: 'Internal repair step',
                type: 'textarea',
                required: true,
                placeholder: 'What personal repair action will you take this period?',
            },
            {
                key: 'boundary',
                label: 'Boundary to protect this work',
                type: 'text',
                placeholder: 'Optional: name a boundary that keeps this truth safe.',
            },
        ],
    }),
    HIDE_TRUTH_EXTERIOR: createRule({
        moveType: 'cleanUp',
        requiresAssist: true,
        completionFraming: 'Surface a concealed fact and perform an external repair with witness support.',
        inputs: [
            {
                key: 'concealedFact',
                label: 'Concealed fact',
                type: 'textarea',
                required: true,
                placeholder: 'What hidden fact must be brought into the open?',
            },
            {
                key: 'publicRepair',
                label: 'External repair action',
                type: 'textarea',
                required: true,
                placeholder: 'What visible repair or correction will you make?',
            },
            {
                key: 'witnessName',
                label: 'Witness or receiving circle',
                type: 'text',
                placeholder: 'Optional: who can verify this repair?',
            },
        ],
    }),
    HIDE_DARE_INTERIOR: createRule({
        moveType: 'growUp',
        requiresAssist: false,
        completionFraming: 'Name the hidden risk and take a courage step that changes your inner posture.',
        inputs: [
            {
                key: 'secretRisk',
                label: 'Hidden risk',
                type: 'textarea',
                required: true,
                placeholder: 'What risk have you kept to yourself?',
            },
            {
                key: 'courageStep',
                label: 'Courage step',
                type: 'textarea',
                required: true,
                placeholder: 'What daring action can you take privately this week?',
            },
            {
                key: 'fearSignal',
                label: 'Fear signal',
                type: 'text',
                placeholder: 'Optional: what fear might try to stop you?',
            },
        ],
    }),
    HIDE_DARE_EXTERIOR: createRule({
        moveType: 'showUp',
        requiresAssist: true,
        completionFraming: 'Convert hidden daring into a public-facing move and ask for support.',
        inputs: [
            {
                key: 'hiddenDare',
                label: 'Hidden dare',
                type: 'textarea',
                required: true,
                placeholder: 'What bold impulse have you been suppressing?',
            },
            {
                key: 'publicMove',
                label: 'Public move',
                type: 'textarea',
                required: true,
                placeholder: 'What visible action will you take now?',
            },
            {
                key: 'supportRole',
                label: 'Support role needed',
                type: 'text',
                placeholder: 'Optional: what kind of ally support would help?',
            },
        ],
    }),
    SEEK_TRUTH_INTERIOR: createRule({
        moveType: 'wakeUp',
        requiresAssist: false,
        completionFraming: 'Investigate inwardly and capture a truth that shifts your perspective.',
        inputs: [
            {
                key: 'innerQuestion',
                label: 'Inner question',
                type: 'textarea',
                required: true,
                placeholder: 'What are you trying to understand about yourself?',
            },
            {
                key: 'discoveredTruth',
                label: 'Discovered truth',
                type: 'textarea',
                required: true,
                placeholder: 'What did you discover?',
            },
            {
                key: 'practiceChange',
                label: 'Practice change',
                type: 'text',
                placeholder: 'Optional: one practice you will change.',
            },
        ],
    }),
    SEEK_TRUTH_EXTERIOR: createRule({
        moveType: 'wakeUp',
        requiresAssist: true,
        completionFraming: 'Seek evidence in the world and report a truth that others can inspect.',
        inputs: [
            {
                key: 'fieldQuestion',
                label: 'Field question',
                type: 'textarea',
                required: true,
                placeholder: 'What external question are you investigating?',
            },
            {
                key: 'evidenceFound',
                label: 'Evidence found',
                type: 'textarea',
                required: true,
                placeholder: 'What observable evidence did you find?',
            },
            {
                key: 'sourceTrail',
                label: 'Source trail',
                type: 'text',
                placeholder: 'Optional: link, place, or witness.',
            },
        ],
    }),
    SEEK_DARE_INTERIOR: createRule({
        moveType: 'growUp',
        requiresAssist: false,
        completionFraming: 'Explore a new direction through a personal experiment.',
        inputs: [
            {
                key: 'desiredShift',
                label: 'Desired shift',
                type: 'textarea',
                required: true,
                placeholder: 'What shift are you reaching for?',
            },
            {
                key: 'firstExperiment',
                label: 'First experiment',
                type: 'textarea',
                required: true,
                placeholder: 'What small experiment will you run?',
            },
            {
                key: 'riskEnvelope',
                label: 'Risk envelope',
                type: 'text',
                placeholder: 'Optional: how will you keep risk bounded?',
            },
        ],
    }),
    SEEK_DARE_EXTERIOR: createRule({
        moveType: 'showUp',
        requiresAssist: true,
        completionFraming: 'Pursue a visible daring move that recruits allies and public accountability.',
        inputs: [
            {
                key: 'publicDare',
                label: 'Public dare',
                type: 'textarea',
                required: true,
                placeholder: 'What visible bold action are you committing to?',
            },
            {
                key: 'visibleAction',
                label: 'Action delivered',
                type: 'textarea',
                required: true,
                placeholder: 'What did you do that others could observe?',
            },
            {
                key: 'allyInvitation',
                label: 'Ally invitation',
                type: 'text',
                placeholder: 'Optional: what kind of ally response did you invite?',
            },
        ],
    }),
}

export function getStoryCubeRule(state: EncounterState): StoryCubeRule {
    return STORY_CUBE_RULES[state]
}

export function getStoryCubeRuleFromGeometry(cube: Pick<CubeGeometry, 'state'>): StoryCubeRule {
    return getStoryCubeRule(cube.state)
}

export function tryGetStoryCubeRule(state: unknown): StoryCubeRule | null {
    if (typeof state !== 'string') return null
    if (!(state in STORY_CUBE_RULES)) return null
    return STORY_CUBE_RULES[state as EncounterState]
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isStoryCubeMechanics(value: unknown): value is StoryCubeMechanics {
    if (!value || typeof value !== 'object') return false
    const candidate = value as Partial<StoryCubeMechanics>
    const hasMoveType = candidate.moveType === 'wakeUp'
        || candidate.moveType === 'cleanUp'
        || candidate.moveType === 'growUp'
        || candidate.moveType === 'showUp'

    return typeof candidate.version === 'number'
        && hasMoveType
        && typeof candidate.requiresAssist === 'boolean'
        && isStringArray(candidate.requiredInputKeys)
        && typeof candidate.completionFraming === 'string'
        && (typeof candidate.assistPrompt === 'string' || candidate.assistPrompt === null)
}

export function formatStoryCubeRequirement(mechanics: Pick<StoryCubeMechanics, 'requiresAssist' | 'moveType'>) {
    return mechanics.requiresAssist
        ? `${mechanics.moveType} move - assist required`
        : `${mechanics.moveType} move - solo allowed`
}
