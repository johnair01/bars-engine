/**
 * Lightweight JSON story for public event-invite BARs (no Twine).
 * @see .specify/specs/campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md
 */

export const EVENT_INVITE_BAR_TYPE = 'event_invite'

export type EventInviteChoice = {
    label: string
    next: string
}

export type EventInviteEnding = {
    role: string
    description: string
}

export type EventInvitePassage = {
    id: string
    text: string
    choices?: EventInviteChoice[]
    ending?: EventInviteEnding
}

/** Outbound buttons after the final passage (overrides defaults when set). */
export type EventInviteEndingCta = {
    href: string
    label: string
    className: string
}

export type EventInviteStory = {
    id: string
    start: string
    passages: EventInvitePassage[]
    /** When set, invite page uses these instead of EVENT_INVITE_DEFAULT_CTAS. */
    endingCtas?: EventInviteEndingCta[]
}

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/** Validate and return story, or null if invalid. */
export function parseEventInviteStory(raw: string | null | undefined): EventInviteStory | null {
    if (!raw || typeof raw !== 'string') return null
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return null
    }
    if (!isRecord(parsed)) return null
    if (typeof parsed.id !== 'string' || !parsed.id.trim()) return null
    if (typeof parsed.start !== 'string' || !parsed.start.trim()) return null
    if (!Array.isArray(parsed.passages) || parsed.passages.length === 0) return null

    const ids = new Set<string>()
    const passages: EventInvitePassage[] = []

    for (const p of parsed.passages) {
        if (!isRecord(p)) return null
        if (typeof p.id !== 'string' || !p.id.trim()) return null
        if (ids.has(p.id)) return null
        ids.add(p.id)
        if (typeof p.text !== 'string') return null

        let choices: EventInviteChoice[] | undefined
        if (p.choices !== undefined) {
            if (!Array.isArray(p.choices)) return null
            choices = []
            for (const c of p.choices) {
                if (!isRecord(c)) return null
                if (typeof c.label !== 'string' || typeof c.next !== 'string') return null
                choices.push({ label: c.label, next: c.next })
            }
        }

        let ending: EventInviteEnding | undefined
        if (p.ending !== undefined) {
            if (!isRecord(p.ending)) return null
            if (typeof p.ending.role !== 'string' || typeof p.ending.description !== 'string') return null
            ending = { role: p.ending.role, description: p.ending.description }
        }

        if (ending && choices?.length) return null
        if (!ending && !choices?.length) return null

        passages.push({ id: p.id, text: p.text, choices, ending })
    }

    if (!ids.has(parsed.start)) return null

    for (const p of passages) {
        if (p.choices) {
            for (const c of p.choices) {
                if (!ids.has(c.next)) return null
            }
        }
    }

    let endingCtas: EventInviteEndingCta[] | undefined
    if (parsed.endingCtas !== undefined) {
        if (!Array.isArray(parsed.endingCtas)) return null
        endingCtas = []
        for (const c of parsed.endingCtas) {
            if (!isRecord(c)) return null
            if (typeof c.href !== 'string' || typeof c.label !== 'string' || typeof c.className !== 'string')
                return null
            endingCtas.push({ href: c.href, label: c.label, className: c.className })
        }
        if (endingCtas.length === 0) return null
    }

    return {
        id: parsed.id,
        start: parsed.start,
        passages,
        endingCtas,
    }
}
