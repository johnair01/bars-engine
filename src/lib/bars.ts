export type BarInputType = 'text' | 'textarea' | 'select' | 'multiselect' | 'nation-select' | 'playbook-select'

export type BarInput = {
    key: string
    label: string
    type: BarInputType
    placeholder?: string
    options?: string[]
}

export type BarDef = {
    id: string
    title: string
    description: string
    inputs: BarInput[]
    reward: number
    unique: boolean // If true, can only be done once
    mandatory?: boolean // If true, required to enter game
}

// --- CONTENT DEFINITIONS ---

export const STARTER_BARS: BarDef[] = [
    {
        id: 'bar_nation',
        title: 'Declare Your Nation',
        description: 'Where do you hail from? This defines your burden.',
        reward: 0,
        unique: true,
        mandatory: true,
        inputs: [{ key: 'nationId', label: 'Nation', type: 'nation-select' }]
    },
    {
        id: 'bar_playbook',
        title: 'Choose Your Playbook',
        description: 'How do you move through the world?',
        reward: 0,
        unique: true,
        mandatory: true,
        inputs: [{ key: 'playbookId', label: 'Playbook', type: 'playbook-select' }]
    },
    {
        id: 'bar_blessed_object',
        title: 'Bring a Blessed Object',
        description: 'Name a small object you will physically bring to the party.',
        reward: 1,
        unique: true,
        inputs: [{ key: 'objectName', label: 'Object Name', type: 'text', placeholder: "e.g. My Grandmother's Ring" }]
    },
    {
        id: 'bar_attunement',
        title: 'Attune Your Object',
        description: 'What emotional energy does your object hold?',
        reward: 1,
        unique: true,
        inputs: [{
            key: 'attunement',
            label: 'Energy',
            type: 'select',
            options: ['Triumph (Anger)', 'Bliss (Joy)', 'Poignance (Sadness)', 'Momentum (Excitement)', 'Peace (Neutrality)']
        }]
    },
    {
        id: 'bar_intention',
        title: 'Personal Intention',
        description: 'One sentence describing the experience you desire.',
        reward: 1,
        unique: true,
        inputs: [{ key: 'intention', label: 'Intention', type: 'text', placeholder: "I want to feel..." }]
    },
    {
        id: 'bar_commission',
        title: 'Commission a Quest',
        description: 'Request a public quest from the engine.',
        reward: 1,
        unique: true,
        inputs: [
            { key: 'title', label: 'Quest Title', type: 'text', placeholder: "The Lost Toast" },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: "Constraints and details..." }
        ]
    },
    {
        id: 'bar_cursed_item',
        title: 'Bring a Cursed Item',
        description: 'An object you wish to be cleansed or destroyed.',
        reward: 1,
        unique: true,
        inputs: [{ key: 'itemName', label: 'Item Name', type: 'text', placeholder: "The Doll" }]
    },
    {
        id: 'bar_signups',
        title: 'Preproduction Signups',
        description: 'Volunteer for party roles. (+1 Vibulon per role)',
        reward: 1, // Logic handled specially for multiselect count
        unique: true,
        inputs: [{
            key: 'roles',
            label: 'Roles',
            type: 'multiselect',
            options: ['Snack Contribution', 'Drink Contribution', 'Cleanup Crew', 'Vibe Patrol', 'Decor Setup', 'Ice Delivery']
        }]
    }
]
