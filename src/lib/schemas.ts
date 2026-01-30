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
