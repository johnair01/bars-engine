import { z } from 'zod'

/** Canonical Game Master faces (see .agent/context/game-master-sects.md). */
export const gameMasterFaceSchema = z.enum([
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
])

export const barAnalysisSchema = z.object({
  type: z.enum(['perception', 'identity', 'relational', 'systemic']),
  wavePhase: z.enum(['Wake Up', 'Clean Up', 'Grow Up', 'Show Up']),
  polarity: z.array(z.string()).default([]),
})

export const matchBarRequestSchema = z.object({
  bar: z.string().min(1, 'bar is required'),
  analysis: barAnalysisSchema,
  /** Optional lens for GPT routing; server may use in metadata / future matcher weights. */
  gameMasterFace: gameMasterFaceSchema.optional(),
  options: z
    .object({
      maxResults: z.number().int().min(1).max(100).optional(),
    })
    .optional(),
})

export const barRegistryRequestSchema = z.object({
  bar: z.string().min(1, 'bar is required'),
  analysis: barAnalysisSchema,
  gameMasterFace: gameMasterFaceSchema.optional(),
  matches: z
    .object({
      primaryQuestId: z.string().optional(),
      secondaryQuestIds: z.array(z.string()).max(2).optional(),
    })
    .optional(),
  source: z.string().max(64).optional(),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
})
