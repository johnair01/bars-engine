import { z } from 'zod'
import { barAnalysisSchema, gameMasterFaceSchema } from '@/lib/bar-forge/validation'

export const gmWaveMoveSchema = z.enum(['wake_up', 'clean_up', 'grow_up', 'show_up'])

const playerQuestContextSchema = z
  .object({
    instanceId: z.string().optional(),
    campaignRef: z.string().optional(),
    playerId: z.string().optional(),
    nationKey: z.string().optional(),
    archetypeKey: z.string().optional(),
    charge: z
      .object({
        text: z.string().optional(),
        sourceBarId: z.string().optional(),
      })
      .optional(),
    barRegistryIds: z.array(z.string()).optional(),
    bars: z
      .array(
        z.object({
          bar: z.string().min(1),
          analysis: barAnalysisSchema,
        })
      )
      .optional(),
  })
  .optional()

export const gameMasterMoveRequestSchema = z.object({
  bar: z.string().min(1),
  analysis: barAnalysisSchema,
  move: gmWaveMoveSchema,
  gameMasters: z.array(gameMasterFaceSchema).min(1),
  options: z
    .object({
      maxArtifacts: z.number().int().min(0).max(50).optional(),
    })
    .optional(),
  context: playerQuestContextSchema,
})

export const resolveQuestRequestSchema = z
  .object({
    instanceId: z.string().optional(),
    campaignRef: z.string().optional(),
    playerId: z.string().min(1),
    charge: z
      .object({
        text: z.string().optional(),
        sourceBarId: z.string().optional(),
      })
      .optional(),
    barRegistryIds: z.array(z.string()).optional(),
    bars: z
      .array(
        z.object({
          bar: z.string().min(1),
          analysis: barAnalysisSchema,
        })
      )
      .optional(),
    nationKey: z.string().optional(),
    archetypeKey: z.string().optional(),
    options: z
      .object({
        maxProposals: z.number().int().min(1).max(20).optional(),
        preferFaces: z.array(gameMasterFaceSchema).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.instanceId && !data.campaignRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide instanceId or campaignRef',
        path: ['instanceId'],
      })
    }
    const hasBars =
      (data.barRegistryIds && data.barRegistryIds.length > 0) ||
      (data.bars && data.bars.length > 0)
    if (!hasBars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide barRegistryIds and/or bars with at least one BAR',
        path: ['bars'],
      })
    }
  })

export const collectiveContextQuerySchema = z
  .object({
    instanceId: z.string().optional(),
    campaignRef: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.instanceId?.trim() && !data.campaignRef?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide instanceId or campaignRef query parameter',
        path: ['instanceId'],
      })
    }
  })
