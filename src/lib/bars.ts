export type BarInputType = 'text' | 'textarea' | 'select' | 'multiselect' | 'nation-select' | 'playbook-select'

export type BarInput = {
    key: string
    label: string
    type: BarInputType
    placeholder?: string
    options?: string[]
}

export type BarType = 'vibe' | 'story'
export type BarStatus = 'available' | 'active' | 'completed'

export type BarDef = {
    id: string
    type: BarType
    title: string
    description: string
    inputs: BarInput[]  // For vibe bars: shown inline. For story bars: shown at end
    reward: number
    unique: boolean
    mandatory?: boolean
    // Story Bar specific
    storyPath?: string  // Path to story content JSON (e.g., 'blessed_object/start')
    isCustom?: boolean // Whether this implies a custom bar from DB
    moveType?: string | null
}

export const JOURNEY_SEQUENCE = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

// --- CONTENT DEFINITIONS ---

export const STARTER_BARS: BarDef[] = [
    {
        id: 'bar_blessed_object',
        type: 'story',  // Will have multi-page flow
        title: 'Bring a Blessed Object',
        description: 'Learn what makes an object blessed, then choose yours.',
        reward: 2,
        unique: true,
        storyPath: 'blessed_object/start',
        inputs: [{ key: 'objectName', label: 'Object Name', type: 'text', placeholder: "e.g. My Grandmother's Ring" }]
    },
    {
        id: 'bar_attunement',
        type: 'vibe',
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
        type: 'vibe',
        title: 'Personal Intention',
        description: 'One sentence describing the experience you desire.',
        reward: 1,
        unique: true,
        inputs: [{ key: 'intention', label: 'Intention', type: 'text', placeholder: "I want to feel..." }]
    },
    {
        id: 'bar_commission',
        type: 'vibe',
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
        type: 'story',  // Will have multi-page flow
        title: 'Bring a Cursed Item',
        description: 'Learn about curses and choose an object to cleanse.',
        reward: 2,
        unique: true,
        storyPath: 'cursed_item/start',
        inputs: [{ key: 'itemName', label: 'Item Name', type: 'text', placeholder: "The Doll" }]
    },
    {
        id: 'bar_signups',
        type: 'vibe',
        title: 'Preproduction Signups',
        description: 'Volunteer for party roles. (+1 Vibulon per role)',
        reward: 1,
        unique: true,
        inputs: [{
            key: 'roles',
            label: 'Roles',
            type: 'multiselect',
            options: ['Snack Contribution', 'Drink Contribution', 'Cleanup Crew', 'Vibe Patrol', 'Decor Setup', 'Ice Delivery']
        }]
    }
]
