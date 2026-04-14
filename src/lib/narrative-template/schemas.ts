/**
 * NarrativeTemplate — Zod Validation Schemas
 *
 * Runtime type-safe schemas for the unified NarrativeTemplate registry.
 * Used at serialization/deserialization boundaries (JSON from DB,
 * admin form validation, template import/export) to guarantee configBlob
 * integrity per template kind.
 *
 * Follows existing Zod patterns:
 * @see src/lib/cyoa-build/schemas.ts — CyoaBuild Zod schemas
 * @see src/lib/bar-forge/validation.ts — gameMasterFaceSchema
 * @see src/lib/schemas.ts — general schema library
 */

import { z } from 'zod'

import { gameMasterFaceSchema } from '@/lib/bar-forge/validation'

// ---------------------------------------------------------------------------
// Shared primitives (reused across kind configs)
// ---------------------------------------------------------------------------

/** NarrativeTemplateKind — mirrors Prisma enum. */
export const narrativeTemplateKindSchema = z.enum([
  'EPIPHANY',
  'KOTTER',
  'ORIENTATION',
  'CUSTOM',
])

/** Segment variant — player or sponsor. */
export const segmentVariantSchema = z.enum(['player', 'sponsor'])

/** Personal move types — WAVE moves. */
export const personalMoveTypeSchema = z.enum([
  'wakeUp',
  'cleanUp',
  'growUp',
  'showUp',
])

/** Quest model — personal (Epiphany Bridge) or communal (Kotter). */
export const questModelSchema = z.enum(['personal', 'communal'])

/** Template status — active or archived. */
export const templateStatusSchema = z.enum(['active', 'archived'])

// ---------------------------------------------------------------------------
// Epiphany beat types (6 beats)
// ---------------------------------------------------------------------------

export const epiphanyBeatTypeSchema = z.enum([
  'orientation',
  'rising_engagement',
  'tension',
  'integration',
  'transcendence',
  'consequence',
])

// ---------------------------------------------------------------------------
// Kotter beat types (8 stages)
// ---------------------------------------------------------------------------

export const kotterBeatTypeSchema = z.enum([
  'urgency',
  'coalition',
  'vision',
  'communicate',
  'obstacles',
  'wins',
  'build_on',
  'anchor',
])

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

/** Per-beat override schema. */
export const beatOverrideSchema = z.object({
  choiceType: z.enum(['altitudinal', 'horizontal']).optional(),
  enabledFaces: z.array(gameMasterFaceSchema).optional(),
  enabledHorizontal: z.array(personalMoveTypeSchema).optional(),
})

/** Orientation sub-packet schema. */
export const orientationSubPacketSchema = z.object({
  face: gameMasterFaceSchema,
  label: z.string().min(1),
  passageKey: z.string().optional(),
  prompt: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Kind-specific config schemas
// ---------------------------------------------------------------------------

/** EPIPHANY config schema — personal quest arc (6 beats). */
export const epiphanyConfigSchema = z.object({
  beats: z.array(epiphanyBeatTypeSchema).min(1).max(6),
  defaultSegment: segmentVariantSchema,
  spineLength: z.enum(['short', 'full']).optional(),
  moveType: personalMoveTypeSchema.optional(),
  loreGatesEnabled: z.boolean().optional(),
  beatOverrides: z.record(z.string(), beatOverrideSchema).optional(),
})

/** KOTTER config schema — communal quest arc (8 stages). */
export const kotterConfigSchema = z.object({
  beats: z.array(kotterBeatTypeSchema).min(1).max(8),
  defaultSegment: segmentVariantSchema,
  moveType: personalMoveTypeSchema.optional(),
  loreGatesEnabled: z.boolean().optional(),
  beatOverrides: z.record(z.string(), beatOverrideSchema).optional(),
})

/** ORIENTATION config schema — face-discovery orientation flow. */
export const orientationConfigSchema = z.object({
  faces: z.array(gameMasterFaceSchema).min(1).max(6),
  subPackets: z.array(orientationSubPacketSchema).min(1),
  showFaceLore: z.boolean().optional(),
  introPassageKey: z.string().optional(),
})

/** CUSTOM config schema — freeform GM-defined config. */
export const customConfigSchema = z.record(z.string(), z.unknown())

// ---------------------------------------------------------------------------
// Discriminated config resolution
// ---------------------------------------------------------------------------

/**
 * Validates configBlob against the correct schema for a given kind.
 * Returns a typed SafeParseReturn.
 *
 * Usage:
 *   const result = parseConfigBlob('EPIPHANY', rawJson)
 *   if (result.success) { const config: EpiphanyConfig = result.data }
 */
export function parseConfigBlob(
  kind: z.infer<typeof narrativeTemplateKindSchema>,
  data: unknown,
) {
  switch (kind) {
    case 'EPIPHANY':
      return epiphanyConfigSchema.safeParse(data)
    case 'KOTTER':
      return kotterConfigSchema.safeParse(data)
    case 'ORIENTATION':
      return orientationConfigSchema.safeParse(data)
    case 'CUSTOM':
      return customConfigSchema.safeParse(data)
  }
}

// ---------------------------------------------------------------------------
// Full NarrativeTemplate row schema (shared spine)
// ---------------------------------------------------------------------------

/**
 * Schema for the shared spine of a NarrativeTemplate row.
 * configBlob is validated separately via parseConfigBlob() since
 * its shape depends on the `kind` field.
 */
export const narrativeTemplateSpineSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  kind: narrativeTemplateKindSchema,
  stepCount: z.number().int().min(1),
  faceAffinities: z.array(gameMasterFaceSchema),
  questModel: questModelSchema,
  configBlob: z.unknown(), // validated separately by kind
  status: templateStatusSchema,
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

/** Summary projection schema (for list/selector endpoints). */
export const narrativeTemplateSummarySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  kind: narrativeTemplateKindSchema,
  faceAffinities: z.array(gameMasterFaceSchema),
  questModel: questModelSchema,
  stepCount: z.number().int().min(1),
  status: templateStatusSchema,
})

// ---------------------------------------------------------------------------
// Admin mutation input schemas
// ---------------------------------------------------------------------------

/** Schema for creating a new NarrativeTemplate. */
export const createNarrativeTemplateInputSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(128)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Key must be lowercase kebab-case (e.g. "epiphany-default")',
    ),
  name: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  kind: narrativeTemplateKindSchema,
  stepCount: z.number().int().min(1).max(20),
  faceAffinities: z.array(gameMasterFaceSchema).default([]),
  questModel: questModelSchema.default('personal'),
  configBlob: z.unknown(), // validated per-kind after initial parse
  status: templateStatusSchema.default('active'),
  sortOrder: z.number().int().default(0),
})

/** Schema for updating an existing NarrativeTemplate. */
export const updateNarrativeTemplateInputSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  stepCount: z.number().int().min(1).max(20).optional(),
  faceAffinities: z.array(gameMasterFaceSchema).optional(),
  questModel: questModelSchema.optional(),
  configBlob: z.unknown().optional(), // validated per-kind after initial parse
  status: templateStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
})

// ---------------------------------------------------------------------------
// Inferred types (for type-safe parsing results)
// ---------------------------------------------------------------------------

export type NarrativeTemplateKindParsed = z.infer<typeof narrativeTemplateKindSchema>
export type EpiphanyConfigParsed = z.infer<typeof epiphanyConfigSchema>
export type KotterConfigParsed = z.infer<typeof kotterConfigSchema>
export type OrientationConfigParsed = z.infer<typeof orientationConfigSchema>
export type CustomConfigParsed = z.infer<typeof customConfigSchema>
export type NarrativeTemplateSpineParsed = z.infer<typeof narrativeTemplateSpineSchema>
export type NarrativeTemplateSummaryParsed = z.infer<typeof narrativeTemplateSummarySchema>
export type CreateNarrativeTemplateInputParsed = z.infer<typeof createNarrativeTemplateInputSchema>
export type UpdateNarrativeTemplateInputParsed = z.infer<typeof updateNarrativeTemplateInputSchema>

// ---------------------------------------------------------------------------
// Parse helpers — safe parse with typed results
// ---------------------------------------------------------------------------

/** Parse a NarrativeTemplate row from unknown data (e.g., Prisma result). */
export function parseNarrativeTemplateSpine(data: unknown) {
  return narrativeTemplateSpineSchema.safeParse(data)
}

/** Parse a NarrativeTemplate summary from unknown data. */
export function parseNarrativeTemplateSummary(data: unknown) {
  return narrativeTemplateSummarySchema.safeParse(data)
}

/**
 * Full validation: parse spine + validate configBlob for the parsed kind.
 * Returns the spine parse result plus a separate configBlob result.
 */
export function parseNarrativeTemplateWithConfig(data: unknown) {
  const spineResult = narrativeTemplateSpineSchema.safeParse(data)
  if (!spineResult.success) {
    return { success: false as const, spineError: spineResult.error, configError: null }
  }

  const { kind, configBlob } = spineResult.data
  const configResult = parseConfigBlob(kind, configBlob)

  if (!configResult.success) {
    return { success: false as const, spineError: null, configError: configResult.error }
  }

  return {
    success: true as const,
    data: {
      ...spineResult.data,
      configBlob: configResult.data,
    },
  }
}

/** Parse a CreateNarrativeTemplateInput, then validate configBlob for the declared kind. */
export function parseCreateInput(data: unknown) {
  const inputResult = createNarrativeTemplateInputSchema.safeParse(data)
  if (!inputResult.success) {
    return { success: false as const, inputError: inputResult.error, configError: null }
  }

  const { kind, configBlob } = inputResult.data
  const configResult = parseConfigBlob(kind, configBlob)

  if (!configResult.success) {
    return { success: false as const, inputError: null, configError: configResult.error }
  }

  return {
    success: true as const,
    data: {
      ...inputResult.data,
      configBlob: configResult.data,
    },
  }
}
