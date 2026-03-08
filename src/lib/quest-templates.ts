export type QuestInputConfig = {
    key: string
    label: string
    type: 'text' | 'textarea' | 'select'
    placeholder?: string
    options?: string[]
    optional?: boolean
}

export type QuestTemplate = {
    id: string
    category: 'dreams' | 'play' | 'custom'
    categoryDisplay?: string
    title: string
    description: string
    examples: string[]
    lifecycleFraming?: boolean
    approaches?: string[]
    directions?: string[]
    inputs: QuestInputConfig[]
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
    {
        id: 'dreams-and-schemes',
        category: 'dreams',
        categoryDisplay: 'CAMPAIGN',
        title: 'Dreams & Schemes',
        description: 'Campaign-level quests: long-term vision, series of adventures, connected to Kotter Model Stages. Within a campaign, becomes a sub-campaign.',
        examples: [
            'Launch a collaborative project',
            'Build a multi-stage vision',
            'Create urgency for change'
        ],
        approaches: ['Freeform', 'Kotter Framework'],
        inputs: [
            { key: 'vision', label: 'Your Vision', type: 'textarea', placeholder: 'Describe what you want to build...' },
            { key: 'approach', label: 'Approach', type: 'select', options: ['Freeform', 'Kotter Framework'] },
            {
                key: 'kotterStage', label: 'Kotter Stage (if applicable)', type: 'select', options: [
                    '1. Create Urgency', '2. Build Coalition', '3. Form Vision', '4. Enlist Army',
                    '5. Enable Action', '6. Generate Wins', '7. Sustain Acceleration', '8. Institute Change'
                ], optional: true
            }
        ]
    },
    {
        id: 'personal-development',
        category: 'play',
        categoryDisplay: 'GROW UP',
        title: 'Personal Development',
        description: 'Grow Up quests — increase skill capacity through developmental lines. Experiment, learn, and build capacity.',
        examples: [
            'Try something new',
            'Develop a skill',
            'Build capacity in an area'
        ],
        lifecycleFraming: true,
        inputs: [
            { key: 'exploration', label: 'What will you explore?', type: 'textarea', placeholder: 'Describe your experiment...' },
            { key: 'framing', label: 'Lifecycle Framing', type: 'select', options: ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up'], optional: true }
        ]
    },
    {
        id: 'custom',
        category: 'custom',
        title: 'Custom Quest',
        description: 'Create a unique quest from scratch',
        examples: ['Anything you can imagine'],
        inputs: [
            { key: 'goal', label: 'Goal', type: 'textarea', placeholder: 'What needs to be done?' }
        ]
    }
]
