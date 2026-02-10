import { TwineLogic } from './twine-engine'

export type VibesEmergencyTag =
    | 'overwhelm'
    | 'boundary-leak'
    | 'head-spin'
    | 'self-sabotage'
    | 'frozen'
    | 'numb'
    | 'conflict'
    | 'other'

export interface VibesEmergencyOption {
    key: VibesEmergencyTag
    label: string
    icon: string
    prompt: string
    suggestedToolKeys: string[]
}

export const VIBES_EMERGENCY_OPTIONS: VibesEmergencyOption[] = [
    {
        key: 'overwhelm',
        label: 'Overwhelm Cascade',
        icon: '🌊',
        prompt: 'Too many signals at once. System saturation.',
        suggestedToolKeys: ['grounding-sequence', 'three-two-one-placeholder']
    },
    {
        key: 'boundary-leak',
        label: 'Boundary Breach',
        icon: '🛡️',
        prompt: 'Other people’s energy is leaking into my controls.',
        suggestedToolKeys: ['boundary-shield']
    },
    {
        key: 'head-spin',
        label: 'Thought Spiral',
        icon: '🧠',
        prompt: 'Mind racing. Can’t find command center.',
        suggestedToolKeys: ['command-bridge']
    },
    {
        key: 'self-sabotage',
        label: 'Inner Saboteur',
        icon: '🪞',
        prompt: 'Old beliefs are hijacking execution.',
        suggestedToolKeys: ['self-sabotage-audit']
    },
    {
        key: 'frozen',
        label: 'Frozen / Can’t Start',
        icon: '🧊',
        prompt: 'No movement. No ignition.',
        suggestedToolKeys: ['three-two-one-placeholder', 'grounding-sequence']
    },
    {
        key: 'numb',
        label: 'Numb / Disconnected',
        icon: '🌫️',
        prompt: 'Low emotional signal. Hard to feel anything.',
        suggestedToolKeys: ['wave-placeholder', 'grounding-sequence']
    },
    {
        key: 'conflict',
        label: 'Interpersonal Static',
        icon: '⚡',
        prompt: 'Conflict heat is blocking my next move.',
        suggestedToolKeys: ['boundary-shield', 'self-sabotage-audit']
    },
    {
        key: 'other',
        label: 'Other Vibes Emergency',
        icon: '🛸',
        prompt: 'It is weird. I am weird. We proceed anyway.',
        suggestedToolKeys: ['grounding-sequence']
    },
]

export interface FirstAidToolSeed {
    key: string
    name: string
    description: string
    icon: string
    moveType: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
    tags: VibesEmergencyTag[]
    twineLogic: TwineLogic
    sortOrder: number
}

export interface EmotionalFirstAidToolDTO {
    id: string
    key: string
    name: string
    description: string
    icon: string | null
    moveType: string
    tags: VibesEmergencyTag[]
    twineLogic: string
    isActive: boolean
    sortOrder: number
}

export const FIRST_AID_MINT_THRESHOLD = 2
export const FIRST_AID_MINT_AMOUNT = 1

export const DEFAULT_FIRST_AID_TOOLS: FirstAidToolSeed[] = [
    {
        key: 'grounding-sequence',
        name: 'Grounding Sequence',
        description: 'Bring the body online before demanding emotional output.',
        icon: '🌍',
        moveType: 'cleanUp',
        tags: ['overwhelm', 'frozen', 'numb', 'other'],
        sortOrder: 10,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: Grounding Sequence initialized. Choose your docking protocol.',
                    choices: [
                        { text: 'Breath ladder (4 rounds)', targetId: 'breath' },
                        { text: 'Name five things you can see', targetId: 'orient' },
                        { text: 'Feet + seat contact scan', targetId: 'body' }
                    ]
                },
                {
                    id: 'breath',
                    text: 'Inhale for 4. Exhale for 6. Repeat 4 rounds. If your mind drifts, excellent: bring it back anyway.',
                    choices: [
                        {
                            text: 'My signal is steadier now',
                            targetId: 'final',
                            effects: { groundingMode: 'breath-ladder', grounded: true }
                        }
                    ]
                },
                {
                    id: 'orient',
                    text: 'Look around. Name five visible objects, four colors, three sounds. Tell your nervous system: this room is now.',
                    choices: [
                        {
                            text: 'The room feels more real',
                            targetId: 'final',
                            effects: { groundingMode: 'orienting', grounded: true }
                        }
                    ]
                },
                {
                    id: 'body',
                    text: 'Feel the points where your body meets gravity. Pressure. Temperature. Texture. Stay with direct sensation.',
                    choices: [
                        {
                            text: 'I can feel my body again',
                            targetId: 'final',
                            effects: { groundingMode: 'contact-scan', grounded: true }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'EMH: Grounding complete. You are now less haunted by abstraction.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    },
    {
        key: 'boundary-shield',
        name: 'Boundary Shield',
        description: 'Rebuild energetic edges before re-entering social gravity.',
        icon: '🛡️',
        moveType: 'cleanUp',
        tags: ['boundary-leak', 'conflict', 'overwhelm'],
        sortOrder: 20,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: Boundary Shield online. What kind of boundary do you need first?',
                    choices: [
                        { text: 'Time boundary', targetId: 'time' },
                        { text: 'Attention boundary', targetId: 'attention' },
                        { text: 'Emotional boundary', targetId: 'emotional' }
                    ]
                },
                {
                    id: 'time',
                    text: 'State one sentence you can use: "I can do this after ___, not now." Keep it short. Keep it true.',
                    choices: [
                        {
                            text: 'Boundary sentence locked',
                            targetId: 'final',
                            effects: { boundaryType: 'time', boundarySet: true }
                        }
                    ]
                },
                {
                    id: 'attention',
                    text: 'Pick one focus object for the next 15 minutes. Everything else is parked, not deleted.',
                    choices: [
                        {
                            text: 'Focus lock engaged',
                            targetId: 'final',
                            effects: { boundaryType: 'attention', boundarySet: true }
                        }
                    ]
                },
                {
                    id: 'emotional',
                    text: 'Say internally: "I can care without carrying." Repeat three times like you mean it.',
                    choices: [
                        {
                            text: 'Emotional membrane restored',
                            targetId: 'final',
                            effects: { boundaryType: 'emotional', boundarySet: true }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'EMH: Boundary Shield stable. Compassion remains available. Over-functioning is offline.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    },
    {
        key: 'command-bridge',
        name: 'Center of Head / Command Bridge',
        description: 'Move from limbic static into executive center.',
        icon: '🧭',
        moveType: 'cleanUp',
        tags: ['head-spin', 'overwhelm', 'frozen'],
        sortOrder: 30,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: Route to Command Bridge. Pick your re-centering maneuver.',
                    choices: [
                        { text: 'Name the mission in one sentence', targetId: 'mission' },
                        { text: 'Reduce to one next action', targetId: 'next-action' }
                    ]
                },
                {
                    id: 'mission',
                    text: 'Complete this sentence: "For the next hour, my mission is ___." No epics. One hour.',
                    choices: [
                        {
                            text: 'Mission set',
                            targetId: 'final',
                            effects: { commandMode: 'mission-statement', centered: true }
                        }
                    ]
                },
                {
                    id: 'next-action',
                    text: 'Identify one action that takes under ten minutes and clearly advances your quest.',
                    choices: [
                        {
                            text: 'Next action selected',
                            targetId: 'final',
                            effects: { commandMode: 'single-next-action', centered: true }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'EMH: Command Bridge restored. Drama levels reduced to mission-compatible.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    },
    {
        key: 'self-sabotage-audit',
        name: 'Self-Sabotage Belief Audit',
        description: 'Locate the belief, challenge it, and write an executable replacement.',
        icon: '🔍',
        moveType: 'cleanUp',
        tags: ['self-sabotage', 'conflict', 'head-spin', 'frozen'],
        sortOrder: 40,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: Belief Audit started. Which thought is currently running the sabotage?',
                    choices: [
                        { text: '"I will fail."', targetId: 'reframe-fail' },
                        { text: '"I am behind everyone."', targetId: 'reframe-behind' },
                        { text: '"If it is not perfect, I should not start."', targetId: 'reframe-perfect' }
                    ]
                },
                {
                    id: 'reframe-fail',
                    text: 'Replacement line: "Progress gives me data. Data beats fear."',
                    choices: [
                        {
                            text: 'Adopt replacement belief',
                            targetId: 'final',
                            effects: { sabotagingBelief: 'I will fail', replacementBelief: 'Progress gives me data.' }
                        }
                    ]
                },
                {
                    id: 'reframe-behind',
                    text: 'Replacement line: "Comparison is noise. My lane is active now."',
                    choices: [
                        {
                            text: 'Adopt replacement belief',
                            targetId: 'final',
                            effects: { sabotagingBelief: 'I am behind everyone', replacementBelief: 'My lane is active now.' }
                        }
                    ]
                },
                {
                    id: 'reframe-perfect',
                    text: 'Replacement line: "Drafts are legal. Shipping teaches."',
                    choices: [
                        {
                            text: 'Adopt replacement belief',
                            targetId: 'final',
                            effects: { sabotagingBelief: 'It must be perfect first', replacementBelief: 'Drafts are legal.' }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'EMH: Belief Audit complete. Old script archived. New script ready for field testing.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    },
    {
        key: 'wave-placeholder',
        name: 'WAVE Practice (Placeholder)',
        description: 'Reserved protocol slot for your custom WAVE sequence.',
        icon: '🌊',
        moveType: 'cleanUp',
        tags: ['numb', 'overwhelm', 'other'],
        sortOrder: 50,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: WAVE protocol placeholder engaged. Awaiting your canonical WAVE steps.',
                    choices: [
                        {
                            text: 'Acknowledge placeholder and continue',
                            targetId: 'final',
                            effects: { placeholderProtocol: 'WAVE' }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'Placeholder complete. WAVE details to be authored in admin console.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    },
    {
        key: 'three-two-one-placeholder',
        name: '3-2-1 Practice (Placeholder)',
        description: 'Reserved protocol slot for your custom 3-2-1 process.',
        icon: '3️⃣',
        moveType: 'cleanUp',
        tags: ['frozen', 'overwhelm', 'head-spin', 'other'],
        sortOrder: 60,
        twineLogic: {
            startPassageId: 'start',
            passages: [
                {
                    id: 'start',
                    text: 'EMH: 3-2-1 protocol placeholder engaged. Awaiting your full 3-2-1 script.',
                    choices: [
                        {
                            text: 'Acknowledge placeholder and continue',
                            targetId: 'final',
                            effects: { placeholderProtocol: '3-2-1' }
                        }
                    ]
                },
                {
                    id: 'final',
                    text: 'Placeholder complete. 3-2-1 details to be authored in admin console.',
                    choices: [],
                    isFinal: true
                }
            ]
        }
    }
]

export function recommendFirstAidToolKey(
    issueTag: VibesEmergencyTag,
    tools: Array<{ key: string; tags?: string[] }>
): string | null {
    if (tools.length === 0) return null

    const option = VIBES_EMERGENCY_OPTIONS.find(o => o.key === issueTag)
    if (option) {
        for (const key of option.suggestedToolKeys) {
            if (tools.some(tool => tool.key === key)) {
                return key
            }
        }
    }

    const taggedMatch = tools.find(tool => (tool.tags || []).includes(issueTag))
    if (taggedMatch) return taggedMatch.key

    return tools[0]?.key || null
}

export function normalizeEmergencyTag(value: string | null | undefined): VibesEmergencyTag {
    const normalized = (value || '').trim() as VibesEmergencyTag
    if (VIBES_EMERGENCY_OPTIONS.some(option => option.key === normalized)) {
        return normalized
    }
    return 'other'
}
