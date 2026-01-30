import lockedStory from './story_locked.json'

export type Choice = {
    text: string
    targetId: string
    effects?: Record<string, any>
}

export type Passage = {
    id: string
    text: string
    choices: Choice[]
    autoProceed?: boolean
    action?: string
}

export async function getPassage(id: string): Promise<Passage | null> {
    // In-memory lookup for the locked MVP
    const passage = lockedStory.find(p => p.id === id)
    return passage || null
}
