// Story system types for guided onboarding

export interface StoryNode {
    id: string
    nodeId: string          // "intro_001", "nation_fire_001"
    title: string
    content: string         // Markdown formatted
    guideDialogue?: string  // What the Guide says
    category: 'intro' | 'nation' | 'playbook' | 'transition' | 'quest' | 'identity'
    choices: StoryChoice[]
    metadata?: {
        teachesAbout?: string   // "nations", "playbooks", "vibeulons"
        emotionalTone?: string  // "exciting", "mysterious", "informative"
    }
    inputType?: 'text' | 'none'
}

export interface StoryChoice {
    id: string
    text: string
    nextNodeId: string
    requirements?: string[] // Nodes that must be completed
    rewards?: {
        vibeulons?: number
        unlocks?: string[]  // What this choice unlocks
    }
}

export interface StoryProgress {
    currentNodeId: string
    completedNodes: string[]
    decisions: {
        nodeId: string
        choiceId: string
        timestamp: Date
    }[]
    unlockedNations?: string[]
    unlockedPlaybooks?: string[]
    vibeulonsEarned: number
    playerName?: string
    characterName?: string
    nationId?: string
    playbookId?: string
    startedAt: Date
    lastActiveAt: Date
}

export interface MiniQuest {
    id: string
    title: string
    scenario: string
    options: QuestOption[]
    evaluation: (choice: string) => {
        feedback: string
        suggestedNation?: string
        suggestedPlaybook?: string
        vibeulons: number
    }
}

export interface QuestOption {
    id: string
    text: string
    alignsWith: string[] // nation/playbook IDs
}

export type GuideEmotion = 'neutral' | 'welcoming' | 'encouraging' | 'mysterious' | 'thoughtful'

export type OnboardingStep = 'intro' | 'identity' | 'nation_discovery' | 'playbook_discovery' | 'finalization'
