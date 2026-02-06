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
    category: 'dreams' | 'logistics' | 'play' | 'social' | 'transformation' | 'custom'
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
        title: 'Dreams & Schemes',
        description: 'Launch a long-term vision or project',
        examples: [
            'Pitch a collaborative project',
            'Start planning next phase',
            'Build a long-term vision'
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
        id: 'party-logistics',
        category: 'logistics',
        title: 'Party Preparation',
        description: 'Help prepare for the Feb 21 event',
        examples: [
            'Bring supplies',
            'Set up space',
            'Coordinate transport'
        ],
        lifecycleFraming: true,
        inputs: [
            { key: 'task', label: 'What will you do?', type: 'text', placeholder: 'e.g. Bring extra chairs' },
            { key: 'framing', label: 'Lifecycle Framing', type: 'select', options: ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up'], optional: true }
        ]
    },
    {
        id: 'personal-play',
        category: 'play',
        title: 'Personal Exploration',
        description: 'Experiment, play, and discover',
        examples: [
            'Try something new',
            'Create art',
            'Explore a curiosity'
        ],
        lifecycleFraming: true,
        inputs: [
            { key: 'exploration', label: 'What will you explore?', type: 'textarea', placeholder: 'Describe your experiment...' },
            { key: 'framing', label: 'Lifecycle Framing', type: 'select', options: ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up'], optional: true }
        ]
    },
    {
        id: 'connection',
        category: 'social',
        title: 'Connection Quest',
        description: 'Build or deepen relationships',
        examples: [
            'Meet someone new',
            'Have a deep conversation',
            'Collaborate with another'
        ],
        inputs: [
            { key: 'connection', label: 'How will you connect?', type: 'textarea', placeholder: 'Describe the interaction...' },
            { key: 'withWhom', label: 'With whom? (Optional)', type: 'text', optional: true }
        ]
    },
    {
        id: 'inner-external',
        category: 'transformation',
        title: 'Inner ↔ External',
        description: 'Transform between internal realization and external action',
        directions: ['Inner → External', 'External → Inner'],
        examples: [
            'Share an insight (Inner → External)',
            'Journal about event (External → Inner)'
        ],
        inputs: [
            { key: 'direction', label: 'Direction', type: 'select', options: ['Inner → External', 'External → Inner'] },
            { key: 'transformation', label: 'What are you transforming?', type: 'textarea', placeholder: 'Describe the shift...' }
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
