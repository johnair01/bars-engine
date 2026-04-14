/**
 * CYOA Build Contract — Zod Validation Schemas
 *
 * Runtime type-safe schemas for CyoaBuild receipt types.
 * Used at serialization/deserialization boundaries (JSON from DB,
 * API responses, checkpoint restore) to guarantee data integrity.
 *
 * These complement the manual validation in types.ts:
 * - types.ts `validateCyoaBuildInput()` — field-level error aggregation for UI
 * - schemas.ts Zod schemas — parse/validate at JSON boundary (DB, API, checkpoint)
 *
 * Follows existing Zod patterns from:
 * @see src/lib/bar-forge/validation.ts — gameMasterFaceSchema
 * @see src/lib/schemas.ts — general schema library
 */

import { z } from 'zod'

import { gameMasterFaceSchema } from '@/lib/bar-forge/validation'

// ---------------------------------------------------------------------------
// Shared enums / primitives
// ---------------------------------------------------------------------------

/** Emotional channel values. */
export const emotionalChannelSchema = z.enum([
  'Fear',
  'Anger',
  'Sadness',
  'Joy',
  'Neutrality',
])

/** Alchemy altitude values. */
export const alchemyAltitudeSchema = z.enum([
  'dissatisfied',
  'neutral',
  'satisfied',
])

/** EmotionalVector — the from/to channel + altitude pair. */
export const emotionalVectorSchema = z.object({
  channelFrom: emotionalChannelSchema,
  altitudeFrom: alchemyAltitudeSchema,
  channelTo: emotionalChannelSchema,
  altitudeTo: alchemyAltitudeSchema,
})

/** PersonalMoveType — WAVE move types. */
export const personalMoveTypeSchema = z.enum([
  'wakeUp',
  'cleanUp',
  'growUp',
  'showUp',
])

// ---------------------------------------------------------------------------
// WaveMoveSpine
// ---------------------------------------------------------------------------

/** WAVE move spine — primary move + ordered sequence (1–4 moves). */
export const waveMoveSpineSchema = z.object({
  primary: personalMoveTypeSchema,
  sequence: z.array(personalMoveTypeSchema).min(1).max(4),
})

// ---------------------------------------------------------------------------
// CampaignSnapshot
// ---------------------------------------------------------------------------

/** Frozen campaign context captured at build time. */
export const campaignSnapshotSchema = z.object({
  campaignRef: z.string().min(1),
  spokeIndex: z.number().int().min(0),
  kotterStage: z.number().int().min(0),
  hexagramId: z.number().int().optional(),
  changingLines: z.array(z.number().int()).optional(),
  instanceName: z.string().min(1),
})

// ---------------------------------------------------------------------------
// CyoaBuildInput — factory input DTO
// ---------------------------------------------------------------------------

/** Schema for CyoaBuildInput — the structured factory input. */
export const cyoaBuildInputSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  face: gameMasterFaceSchema,
  emotionalVector: emotionalVectorSchema,
  waveMoveSpine: waveMoveSpineSchema,
  narrativeTemplateKey: z.string().min(1),
  campaignSnapshot: campaignSnapshotSchema,
})

// ---------------------------------------------------------------------------
// CyoaBuild — the immutable receipt
// ---------------------------------------------------------------------------

/**
 * Schema for the frozen CyoaBuild receipt.
 * Validates all fields including the auto-generated blueprintKey and createdAt.
 */
export const cyoaBuildSchema = z.object({
  id: z.string().min(1),
  face: gameMasterFaceSchema,
  emotionalVector: emotionalVectorSchema,
  waveMoveSpine: waveMoveSpineSchema,
  narrativeTemplateKey: z.string().min(1),
  campaignSnapshot: campaignSnapshotSchema,
  blueprintKey: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  playerId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// CyoaBuildDraft — mutable composer WIP
// ---------------------------------------------------------------------------

/** Schema for the mutable draft used during the composer flow. */
export const cyoaBuildDraftSchema = z.object({
  face: gameMasterFaceSchema.optional(),
  emotionalVector: emotionalVectorSchema.optional(),
  waveMoveSpine: z
    .object({
      primary: personalMoveTypeSchema.optional(),
      sequence: z.array(personalMoveTypeSchema).optional(),
    })
    .optional(),
  narrativeTemplateKey: z.string().min(1).optional(),
  campaignSnapshot: z
    .object({
      campaignRef: z.string().min(1),
      spokeIndex: z.number().int().min(0),
      kotterStage: z.number().int().min(0),
      hexagramId: z.number().int().optional(),
      changingLines: z.array(z.number().int()).optional(),
      instanceName: z.string().min(1),
    })
    .optional(),
  savedAt: z.string().datetime({ offset: true }).optional(),
  needsRevalidation: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// CyoaBuildLedgerEntry — hub ledger storage
// ---------------------------------------------------------------------------

/** Schema for ledger entries stored in CampaignHubStateV1. */
export const cyoaBuildLedgerEntrySchema = z.object({
  spokeIndex: z.number().int().min(0),
  build: cyoaBuildSchema,
  recordedAt: z.string().datetime({ offset: true }),
})

// ---------------------------------------------------------------------------
// CompletedBuild — hub ledger receipt with inline BAR summaries
// ---------------------------------------------------------------------------

/** Inline BAR summary stored in a completed build receipt. */
export const completedBuildBarSummarySchema = z.object({
  barId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['vibe', 'story', 'insight']),
  vibeulons: z.number().int().min(0),
})

/**
 * Immutable receipt stored in CampaignHubStateV1.completedBuilds.
 * Contains full path (face, template kind, emotional vector, charge text,
 * terminal node) plus inline BAR summaries (titles, types, vibeulons).
 */
export const completedBuildReceiptSchema = z.object({
  buildId: z.string().min(1),
  spokeIndex: z.number().int().min(0),
  face: gameMasterFaceSchema,
  templateKind: z.string().min(1),
  templateKey: z.string().min(1),
  emotionalVector: emotionalVectorSchema,
  chargeText: z.string(),
  terminalNodeId: z.string().min(1),
  blueprintKey: z.string().min(1),
  barSummaries: z.array(completedBuildBarSummarySchema),
  totalVibeulons: z.number().int().min(0),
  completedAt: z.string().datetime({ offset: true }),
})

/** Parse a CompletedBuildReceipt from unknown data. */
export function parseCompletedBuildReceipt(data: unknown) {
  return completedBuildReceiptSchema.safeParse(data)
}

/** Parse an array of completed build receipts (hub completedBuilds). */
export function parseCompletedBuildReceipts(data: unknown) {
  return z.array(completedBuildReceiptSchema).safeParse(data)
}

export type CompletedBuildBarSummaryParsed = z.infer<typeof completedBuildBarSummarySchema>
export type CompletedBuildReceiptParsed = z.infer<typeof completedBuildReceiptSchema>

// ---------------------------------------------------------------------------
// Build-contract types (locked-choice state model)
// ---------------------------------------------------------------------------

/** Choice discriminator — unlocked or locked. */
const unlockedChoiceSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    status: z.literal('unlocked'),
    value: valueSchema.nullable(),
  })

const lockedChoiceSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    status: z.literal('locked'),
    value: valueSchema,
    lockedAt: z.string().datetime({ offset: true }),
  })

const choiceSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.discriminatedUnion('status', [
    unlockedChoiceSchema(valueSchema),
    lockedChoiceSchema(valueSchema),
  ])

/** NarrativeTemplateRef — lightweight reference stored in build state. */
export const narrativeTemplateRefSchema = z.object({
  templateId: z.string().min(1),
  templateKind: z.string().min(1),
})

/** CyoaBuildState — in-progress composer state. */
export const cyoaBuildStateSchema = z.object({
  v: z.literal(1),
  buildId: z.string().min(1),
  campaignRef: z.string().min(1),
  spokeIndex: z.number().int().min(0),
  face: choiceSchema(gameMasterFaceSchema),
  emotionalVector: choiceSchema(emotionalVectorSchema),
  narrativeTemplate: narrativeTemplateRefSchema.nullable(),
  stepOrder: z.array(z.string()).nullable(),
  extras: z.record(z.string(), z.unknown()),
  status: z.enum(['drafting', 'locked', 'finalized']),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

/** CyoaBuildReceipt — finalized immutable receipt from build-contract. */
export const cyoaBuildReceiptSchema = z.object({
  v: z.literal(1),
  buildId: z.string().min(1),
  campaignRef: z.string().min(1),
  spokeIndex: z.number().int().min(0),
  face: gameMasterFaceSchema,
  emotionalVector: emotionalVectorSchema,
  narrativeTemplate: narrativeTemplateRefSchema,
  extras: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime({ offset: true }),
})

/** CyoaBuildCheckpoint — mid-spoke persistence envelope. */
export const cyoaBuildCheckpointSchema = z.object({
  v: z.literal(1),
  buildState: cyoaBuildStateSchema,
  savedAt: z.string().datetime({ offset: true }),
  needsRevalidation: z.boolean(),
})

// ---------------------------------------------------------------------------
// Inferred types (for type-safe parsing results)
// ---------------------------------------------------------------------------

export type CyoaBuildInputParsed = z.infer<typeof cyoaBuildInputSchema>
export type CyoaBuildParsed = z.infer<typeof cyoaBuildSchema>
export type CyoaBuildDraftParsed = z.infer<typeof cyoaBuildDraftSchema>
export type CyoaBuildLedgerEntryParsed = z.infer<typeof cyoaBuildLedgerEntrySchema>
export type CyoaBuildStateParsed = z.infer<typeof cyoaBuildStateSchema>
export type CyoaBuildReceiptParsed = z.infer<typeof cyoaBuildReceiptSchema>
export type CyoaBuildCheckpointParsed = z.infer<typeof cyoaBuildCheckpointSchema>

// ---------------------------------------------------------------------------
// Parse helpers — safe parse with typed results
// ---------------------------------------------------------------------------

/**
 * Parse a CyoaBuild from unknown data (e.g., JSON from DB).
 * Returns { success: true, data } or { success: false, error }.
 */
export function parseCyoaBuild(data: unknown) {
  return cyoaBuildSchema.safeParse(data)
}

/**
 * Parse a CyoaBuildInput from unknown data.
 */
export function parseCyoaBuildInput(data: unknown) {
  return cyoaBuildInputSchema.safeParse(data)
}

/**
 * Parse a CyoaBuildDraft from unknown data (checkpoint restore).
 */
export function parseCyoaBuildDraft(data: unknown) {
  return cyoaBuildDraftSchema.safeParse(data)
}

/**
 * Parse a CyoaBuildLedgerEntry from unknown data (hub state).
 */
export function parseCyoaBuildLedgerEntry(data: unknown) {
  return cyoaBuildLedgerEntrySchema.safeParse(data)
}

/**
 * Parse an array of ledger entries (hub completedBuilds array).
 */
export function parseCyoaBuildLedgerEntries(data: unknown) {
  return z.array(cyoaBuildLedgerEntrySchema).safeParse(data)
}

/**
 * Parse a CyoaBuildState from unknown data (stateData restore).
 */
export function parseCyoaBuildState(data: unknown) {
  return cyoaBuildStateSchema.safeParse(data)
}

/**
 * Parse a CyoaBuildReceipt from unknown data.
 */
export function parseCyoaBuildReceipt(data: unknown) {
  return cyoaBuildReceiptSchema.safeParse(data)
}

/**
 * Parse a CyoaBuildCheckpoint from unknown data (session resume).
 */
export function parseCyoaBuildCheckpoint(data: unknown) {
  return cyoaBuildCheckpointSchema.safeParse(data)
}
