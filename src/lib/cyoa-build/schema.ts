import { z } from 'zod'

const gmFaceZ = z.enum(['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'])
/** Keep aligned with `NARRATIVE_TEMPLATE_IDS` in `@/lib/narrative-templates/registry`. */
const narrativeTemplateZ = z.enum(['epiphany_bridge', 'kotter', 'modular_coaster'])
const waveMoveZ = z.enum(['wakeUp', 'cleanUp', 'growUp', 'showUp'])
const provenanceZ = z.enum(['check_in', 'shadow_321', 'persisted_alchemy', 'manual', 'unknown'])

/**
 * Unified CYOA session intent (issue #36). Validate at API boundaries and hub/spoke merge.
 */
export const cyoaBuildSchema = z.object({
  emotionalVector: z
    .object({
      currentSummary: z.string().optional(),
      desiredSummary: z.string().optional(),
      ref: z.string().optional(),
    })
    .optional(),
  waveMove: waveMoveZ.optional(),
  gameMasterFace: gmFaceZ,
  gmFaceMoveId: z.string().optional(),
  narrativeTemplate: narrativeTemplateZ,
  campaignContext: z.object({
    campaignRef: z.string(),
    kotterStage: z.number().int().min(1).max(8).optional(),
    spokeIndex: z.number().int().min(0).max(7).optional(),
    allyshipDomain: z.string().optional(),
    gatherResources: z.boolean().optional(),
  }),
  provenance: provenanceZ.optional(),
})

export type CyoaBuild = z.infer<typeof cyoaBuildSchema>

/** Partial document / draft — e.g. mid-wizard */
export const cyoaBuildPartialSchema = cyoaBuildSchema.partial()

export type CyoaBuildPartial = z.infer<typeof cyoaBuildPartialSchema>
