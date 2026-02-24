import { z } from 'zod'

// --------------------------------------------------------
// INVITE SCHEMAS
// --------------------------------------------------------

export const InviteLookupSchema = z.object({
    token: z.string().min(1, "Token required"),
})

export const InviteCreateSchema = z.object({
    preassignedRoleKey: z.string().optional(),
})

// --------------------------------------------------------
// PLAYER SCHEMAS
// --------------------------------------------------------

export const ContactTypeEnum = z.enum(["email", "phone"])

export const PlayerSignupSchema = z.object({
    inviteToken: z.string().min(1),
    name: z.string().min(2, "Name must be at least 2 chars"),
    contactType: ContactTypeEnum,
    contactValue: z.string().min(5, "Contact info too short"), // Basic check
})

// --------------------------------------------------------
// QUEST SCHEMAS
// --------------------------------------------------------

export const QuestReturnSchema = z.object({
    questId: z.string().cuid(),
    returnText: z.string().optional(),
})

// --------------------------------------------------------
// TWINE ENGINE SCHEMAS
// --------------------------------------------------------

export const TwineLinkSchema = z.object({
    text: z.string().optional(),
    name: z.string().optional(),
    link: z.string().optional(),
    target: z.string().optional(),
}).passthrough()

export const TwinePassageSchema = z.object({
    pid: z.string().optional(),
    name: z.string().optional(),
    text: z.string().optional(),
    cleanText: z.string().optional(),
    links: z.array(TwineLinkSchema).optional(),
    tags: z.array(z.string()).optional(),
}).passthrough()

export const ParsedTwineSchema = z.object({
    title: z.string().optional(),
    startPassage: z.string().optional(),
    startPassagePid: z.string().optional(),
    startPassageName: z.string().optional(),
    startNode: z.string().optional(),
    passages: z.array(TwinePassageSchema).default([]),
}).passthrough()

export type ParsedTwine = z.infer<typeof ParsedTwineSchema>
export type TwinePassage = z.infer<typeof TwinePassageSchema>

// --------------------------------------------------------
// CANONICAL TWINE ENGINE SCHEMAS (Prompt M)
// --------------------------------------------------------

export interface CanonicalLink {
    label: string
    target: string
}

export interface CanonicalPassage {
    pid: string
    name: string
    text: string
    cleanText: string
    links: CanonicalLink[]
    tags: string[]
}

export interface CanonicalTwineStory {
    title: string
    startPassage: string
    passages: CanonicalPassage[]
}

/**
 * Normalizes any variation of Twine JSON (legacy, handcrafted, exported)
 * into a strict, predictable CanonicalTwineStory shape.
 */
export function normalizeTwineStory(rawJson: any): CanonicalTwineStory {
    // 1. Initial Zod Parse to guarantee basal array structures
    const parsedResult = ParsedTwineSchema.safeParse(rawJson)
    if (!parsedResult.success) {
        throw new Error(`Invalid Twine JSON structure: ${parsedResult.error.message}`)
    }
    const parsed = parsedResult.data

    // 2. Resolve Title
    const title = parsed.title || 'Untitled Story'

    // 3. Resolve Start Passage
    let startPassageId = '1'
    try {
        startPassageId = getStartPassageId(parsed)
    } catch (e) {
        // Safe fallback if passages exist
        if (parsed.passages.length > 0) {
            startPassageId = parsed.passages[0].name || parsed.passages[0].pid || '1'
        }
    }

    // 4. Normalize Passages
    const passages: CanonicalPassage[] = parsed.passages.map((p, index) => {
        // Fallbacks for passage identification
        const pid = p.pid || String(index + 1)
        const name = p.name || `Passage ${pid}`
        
        // Fallbacks for text content
        const text = p.text || p.cleanText || ''
        const cleanText = p.cleanText || p.text || ''

        // Fallbacks for arrays
        const tags = Array.isArray(p.tags) ? p.tags : []
        const rawLinks = Array.isArray(p.links) ? p.links : []

        // Normalize Links
        const links: CanonicalLink[] = rawLinks.map((l: any) => {
            const label = typeof l.label === 'string' ? l.label 
                        : typeof l.text === 'string' ? l.text 
                        : typeof l.name === 'string' ? l.name 
                        : typeof l.target === 'string' ? l.target 
                        : 'Continue'
            
            const target = typeof l.target === 'string' ? l.target 
                         : typeof l.link === 'string' ? l.link 
                         : label
            
            return { label, target }
        })

        return { pid, name, text, cleanText, links, tags }
    })

    return { title, startPassage: startPassageId, passages }
}

/**
 * Robustly extracts the starting passage ID from a parsed Twine story.
 * Falls back through common export variations: startPassage -> startPassagePid -> startPassageName -> passages[0].
 */
export function getStartPassageId(story: ParsedTwine): string {
    if (story.startPassage) return story.startPassage
    if (story.startPassagePid) return story.startPassagePid
    if (story.startPassageName) return story.startPassageName
    if (story.startNode) return story.startNode

    // Fallback to the first passage if available
    if (story.passages && story.passages.length > 0) {
        const first = story.passages[0]
        if (first.pid) return first.pid
        if (first.name) return first.name
    }

    throw new Error('Could not determine starting passage from Twine JSON')
}
