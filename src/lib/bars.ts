export type BarInputType =
    | 'text'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'nation-select'
    | 'playbook-select'
    | 'image'

export type BarInput = {
    key: string
    label: string
    type: BarInputType
    required?: boolean
    placeholder?: string
    options?: string[]
}

// DAOE: Resolution Register Taxonomy (Phase 1 — FR1.1)
// The three registers define how fictional outcomes are determined:
//   fortune — random real-world element shapes fictional outcomes (I Ching, card draw)
//   drama   — fiction shapes outcome (Twine narrative state machine)
//   karma   — tracked past behavior shapes outcome (BSM maturity, alchemy history)
//   none    — no contested outcome; resolution deferred to social negotiation
export type ResolutionRegister = 'fortune' | 'drama' | 'karma' | 'none'

// DAOE: Authority Naming (Phase 1 — FR1.2)
// Codifies who calls a BAR, who narrates the outcome, and who tracks the state.
// GAP A-2 fix: authority was named in RACI but not in BAR invocation itself.
export type AuthorityInvoker = 'player' | 'gm' | 'either'
export type AuthorityNarrator = 'player' | 'gm' | 'collaborative'
export type AuthorityTracker = 'system' | 'player'

export interface BarAuthority {
  invoker: AuthorityInvoker
  narrator: AuthorityNarrator
  tracker: AuthorityTracker
}

export const JOURNEY_SEQUENCE = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

// --- CONTENT DEFINITIONS ---

export type BarType = 'vibe' | 'story' | 'insight'
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
    twineStoryId?: string | null // If set, quest completion happens via Twine adventure
    // DAOE Phase 1: Register + Authority fields (FR1.1, FR1.2)
    // Naming the register is the primary GAP A-1 / A-3 fix — these were present but unnamed.
    resolutionRegister?: ResolutionRegister
    authority?: BarAuthority
}

export const STARTER_BARS: BarDef[] = [
    {
        id: 'bar_blessed_object',
        type: 'story',
        title: 'Bring a Blessed Object',
        description: 'Learn what makes an object blessed, then choose yours.',
        reward: 2,
        unique: true,
        storyPath: 'blessed_object/start',
        resolutionRegister: 'drama',  // DAOE Phase 1 FR1.5: Twine story path — fiction drives outcome
        authority: { invoker: 'player', narrator: 'collaborative', tracker: 'system' },
        inputs: [{ key: 'objectName', label: 'Object Name', type: 'text', placeholder: "e.g. My Grandmother's Ring" }]
    },
    {
        id: 'bar_attunement',
        type: 'vibe',
        title: 'Attune Your Object',
        description: 'What emotional energy does your object hold?',
        reward: 1,
        unique: true,
        resolutionRegister: 'karma',  // DAOE Phase 1 FR1.5: emotion selection updates karma state (BSM/alchemy)
        authority: { invoker: 'player', narrator: 'player', tracker: 'player' },
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
        resolutionRegister: 'none',  // DAOE Phase 1 FR1.5: no contested outcome — social/introspective
        authority: { invoker: 'player', narrator: 'player', tracker: 'player' },
        inputs: [{ key: 'intention', label: 'Intention', type: 'text', placeholder: "I want to feel..." }]
    },
    {
        id: 'bar_commission',
        type: 'vibe',
        title: 'Commission a Quest',
        description: 'Request a public quest from the engine.',
        reward: 1,
        unique: true,
        resolutionRegister: 'karma',  // DAOE Phase 1 FR1.5: commission creates karma — tracked commitment
        authority: { invoker: 'player', narrator: 'gm', tracker: 'system' },
        inputs: [
            { key: 'title', label: 'Quest Title', type: 'text', placeholder: "The Lost Toast" },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: "Constraints and details..." }
        ]
    },
    {
        id: 'bar_cursed_item',
        type: 'story',
        title: 'Bring a Cursed Item',
        description: 'Learn about curses and choose an object to cleanse.',
        reward: 2,
        unique: true,
        storyPath: 'cursed_item/start',
        resolutionRegister: 'drama',  // DAOE Phase 1 FR1.5: Twine story path — fiction drives outcome
        authority: { invoker: 'player', narrator: 'collaborative', tracker: 'system' },
        inputs: [{ key: 'itemName', label: 'Item Name', type: 'text', placeholder: "The Doll" }]
    },
    {
        id: 'bar_signups',
        type: 'vibe',
        title: 'Preproduction Signups',
        description: 'Volunteer for party roles. (+1 Vibulon per role)',
        reward: 1,
        unique: true,
        resolutionRegister: 'karma',  // DAOE Phase 1 FR1.5: role signup creates tracked karma commitments
        authority: { invoker: 'player', narrator: 'gm', tracker: 'system' },
        inputs: [{
            key: 'roles',
            label: 'Roles',
            type: 'multiselect',
            options: ['Snack Contribution', 'Drink Contribution', 'Cleanup Crew', 'Vibe Patrol', 'Decor Setup', 'Ice Delivery']
        }]
    }
]
