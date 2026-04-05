import { z } from 'zod'
import { CONTENT_LAYER } from '@/lib/ontology'

export const barQuestLinkCreateSchema = z.object({
  sourceBarId: z.string().min(1),
  targetQuestId: z.string().min(1),
  matchType: z.enum(['primary', 'secondary', 'manual']).default('primary'),
  confidence: z.number().min(0).max(1).optional().nullable(),
  reason: z.string().min(1),
  supportedBy: z.record(z.string(), z.unknown()).optional().nullable(),
  campaignRef: z.string().optional().nullable(),
  instanceId: z.string().optional().nullable(),
})

export const barQuestLinkPatchSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'withdrawn']),
})

const contentLayerSchema = z.enum([CONTENT_LAYER.OPS, CONTENT_LAYER.STORY])

export const campaignDraftCreateSchema = z.object({
  title: z.string().optional().nullable(),
  contentLayer: contentLayerSchema.optional().default(CONTENT_LAYER.STORY),
  playerArc: z.record(z.string(), z.unknown()),
  campaignContext: z.record(z.string(), z.unknown()),
  structure: z.record(z.string(), z.unknown()).optional(),
})

export const campaignDraftPatchSchema = z.object({
  title: z.string().optional().nullable(),
  contentLayer: contentLayerSchema.optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
  playerArc: z.record(z.string(), z.unknown()).optional(),
  campaignContext: z.record(z.string(), z.unknown()).optional(),
  structure: z.record(z.string(), z.unknown()).optional(),
})
