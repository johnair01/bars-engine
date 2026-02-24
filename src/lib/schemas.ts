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
