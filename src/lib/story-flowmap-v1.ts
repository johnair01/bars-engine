export type HeistLoreOutput = 'vulnerability' | 'ally' | 'asset' | 'barrier'

export type HeistPhase = {
    id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    act: 1 | 2
    heist_name: string
    heist_objective: string
    kotter_stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    kotter_name: string
    kotter_mechanic: string
    lore_outputs: HeistLoreOutput[]
}

export const STORY_HEIST_META = {
    big_score_name: 'The Big Score',
    big_score_goal: 'Extract or replace the Master Algorithm and make the win stick.',
} as const

export const STORY_FLOWMAP_V1: Record<HeistPhase['id'], HeistPhase> = {
    1: {
        id: 1,
        act: 1,
        heist_name: 'Recon',
        heist_objective: 'Uncover instability or a concrete weakness in the venue/system.',
        kotter_stage: 1,
        kotter_name: 'Create Urgency',
        kotter_mechanic: 'Expose a credible reason to move now.',
        lore_outputs: ['vulnerability'],
    },
    2: {
        id: 2,
        act: 1,
        heist_name: 'Infiltration',
        heist_objective: 'Secure insiders, permissions, and access paths.',
        kotter_stage: 2,
        kotter_name: 'Build Guiding Coalition',
        kotter_mechanic: 'Recruit or align 1-2 key players.',
        lore_outputs: ['ally'],
    },
    3: {
        id: 3,
        act: 1,
        heist_name: 'The Plan',
        heist_objective: 'Align on target and approach for the Big Score.',
        kotter_stage: 3,
        kotter_name: 'Form Strategic Vision',
        kotter_mechanic: 'Choose one target and one approach.',
        lore_outputs: ['asset'],
    },
    4: {
        id: 4,
        act: 1,
        heist_name: 'The Invite',
        heist_objective: 'Mobilize participants into explicit roles.',
        kotter_stage: 4,
        kotter_name: 'Enlist Volunteer Army',
        kotter_mechanic: 'Get visible commitments from collaborators.',
        lore_outputs: ['ally'],
    },
    5: {
        id: 5,
        act: 2,
        heist_name: 'Jam Security',
        heist_objective: 'Disable or bypass security blockers.',
        kotter_stage: 5,
        kotter_name: 'Remove Barriers',
        kotter_mechanic: 'Eliminate one blocker tied to execution.',
        lore_outputs: ['barrier'],
    },
    6: {
        id: 6,
        act: 2,
        heist_name: 'Win Something',
        heist_objective: 'Secure a visible win that proves progress.',
        kotter_stage: 6,
        kotter_name: 'Generate Short-Term Wins',
        kotter_mechanic: 'Produce one undeniable result.',
        lore_outputs: ['asset'],
    },
    7: {
        id: 7,
        act: 2,
        heist_name: 'Press Advantage',
        heist_objective: 'Chain wins to sustain momentum.',
        kotter_stage: 7,
        kotter_name: 'Sustain Acceleration',
        kotter_mechanic: 'Expand scope or raise tempo with intent.',
        lore_outputs: ['barrier', 'asset'],
    },
    8: {
        id: 8,
        act: 2,
        heist_name: 'The Big Score',
        heist_objective: 'Execute the extraction/replacement and lock it in.',
        kotter_stage: 8,
        kotter_name: 'Institute Change',
        kotter_mechanic: 'Finalize and make the new state stick.',
        lore_outputs: ['asset'],
    },
}

export function getStoryFlowPhase(period: number): HeistPhase {
    const clamped = Math.max(1, Math.min(8, Math.floor(period || 1))) as HeistPhase['id']
    return STORY_FLOWMAP_V1[clamped]
}
