/**
 * NarrativeTemplate — Type Narrowing Utilities
 *
 * Runtime type-safe narrowing from raw NarrativeTemplateRow (with opaque
 * configBlob) to TypedNarrativeTemplate (with discriminated config shape).
 *
 * Used at deserialization boundaries:
 * - Server actions returning templates to components
 * - Prisma result → typed app-layer object
 * - JSON import / API ingestion
 *
 * Pattern: validate at TypeScript boundary, not DB level.
 * @see src/lib/narrative-template/schemas.ts — Zod validation schemas
 * @see src/lib/narrative-template/types.ts — TypeScript type definitions
 */

import {
  epiphanyConfigSchema,
  kotterConfigSchema,
  orientationConfigSchema,
  customConfigSchema,
  parseConfigBlob,
} from './schemas'
import type {
  EpiphanyConfig,
  KotterConfig,
  OrientationConfig,
  CustomConfig,
  NarrativeTemplateRow,
  TypedNarrativeTemplate,
  NarrativeTemplateKind,
} from './types'

// ---------------------------------------------------------------------------
// narrowConfigBlob — validate + type-narrow configBlob for a given kind
// ---------------------------------------------------------------------------

/**
 * Validate and narrow a raw configBlob to its typed shape for the given kind.
 *
 * Returns the typed config on success, or null on validation failure.
 * Use this when you have a raw JSON blob and a known kind and want to
 * safely narrow to the correct TypeScript type.
 *
 * @example
 * const config = narrowConfigBlob('EPIPHANY', rawJson)
 * if (config) {
 *   // config is EpiphanyConfig
 *   console.log(config.beats)
 * }
 */
export function narrowConfigBlob(kind: 'EPIPHANY', data: unknown): EpiphanyConfig | null
export function narrowConfigBlob(kind: 'KOTTER', data: unknown): KotterConfig | null
export function narrowConfigBlob(kind: 'ORIENTATION', data: unknown): OrientationConfig | null
export function narrowConfigBlob(kind: 'CUSTOM', data: unknown): CustomConfig | null
export function narrowConfigBlob(kind: NarrativeTemplateKind, data: unknown): EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig | null
export function narrowConfigBlob(
  kind: NarrativeTemplateKind,
  data: unknown,
): EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig | null {
  const result = parseConfigBlob(kind, data)
  if (result.success) {
    return result.data as EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig
  }
  return null
}

// ---------------------------------------------------------------------------
// narrowConfigBlobOrThrow — strict variant that throws on validation failure
// ---------------------------------------------------------------------------

/**
 * Validate and narrow a raw configBlob, throwing on failure.
 *
 * Use this at trust boundaries where invalid data indicates a bug
 * (e.g., data already validated on write, now being read back).
 *
 * @throws Error with descriptive message including kind and Zod issues
 */
export function narrowConfigBlobOrThrow(kind: 'EPIPHANY', data: unknown): EpiphanyConfig
export function narrowConfigBlobOrThrow(kind: 'KOTTER', data: unknown): KotterConfig
export function narrowConfigBlobOrThrow(kind: 'ORIENTATION', data: unknown): OrientationConfig
export function narrowConfigBlobOrThrow(kind: 'CUSTOM', data: unknown): CustomConfig
export function narrowConfigBlobOrThrow(kind: NarrativeTemplateKind, data: unknown): EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig
export function narrowConfigBlobOrThrow(
  kind: NarrativeTemplateKind,
  data: unknown,
): EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig {
  const result = parseConfigBlob(kind, data)
  if (result.success) {
    return result.data as EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig
  }
  const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  throw new Error(`Invalid configBlob for kind "${kind}": ${issues}`)
}

// ---------------------------------------------------------------------------
// narrowNarrativeTemplate — full row narrowing
// ---------------------------------------------------------------------------

/**
 * Narrow a NarrativeTemplateRow to a TypedNarrativeTemplate.
 *
 * Validates the configBlob against the row's `kind` discriminator and
 * returns a fully typed template, or null if validation fails.
 *
 * This is the primary boundary function — call it whenever you receive
 * a NarrativeTemplateRow from Prisma and need typed config access.
 *
 * @example
 * const row = await db.narrativeTemplate.findUnique({ where: { id } })
 * const typed = narrowNarrativeTemplate(toRow(row))
 * if (typed && typed.kind === 'EPIPHANY') {
 *   console.log(typed.configBlob.beats) // EpiphanyConfig
 * }
 */
export function narrowNarrativeTemplate(
  row: NarrativeTemplateRow,
): TypedNarrativeTemplate | null {
  const config = narrowConfigBlob(row.kind, row.configBlob)
  if (!config) return null

  // Spread and replace configBlob with the validated, typed version
  const { configBlob: _raw, ...spine } = row
  return { ...spine, configBlob: config } as TypedNarrativeTemplate
}

/**
 * Strict variant of narrowNarrativeTemplate that throws on invalid configBlob.
 *
 * @throws Error with descriptive message including kind and Zod issues
 */
export function narrowNarrativeTemplateOrThrow(
  row: NarrativeTemplateRow,
): TypedNarrativeTemplate {
  const config = narrowConfigBlobOrThrow(row.kind, row.configBlob)
  const { configBlob: _raw, ...spine } = row
  return { ...spine, configBlob: config } as TypedNarrativeTemplate
}

// ---------------------------------------------------------------------------
// Type guard utilities
// ---------------------------------------------------------------------------

/** Type guard: is the config blob a valid EpiphanyConfig? */
export function isEpiphanyConfig(data: unknown): data is EpiphanyConfig {
  return epiphanyConfigSchema.safeParse(data).success
}

/** Type guard: is the config blob a valid KotterConfig? */
export function isKotterConfig(data: unknown): data is KotterConfig {
  return kotterConfigSchema.safeParse(data).success
}

/** Type guard: is the config blob a valid OrientationConfig? */
export function isOrientationConfig(data: unknown): data is OrientationConfig {
  return orientationConfigSchema.safeParse(data).success
}

/** Type guard: is the config blob a valid CustomConfig? */
export function isCustomConfig(data: unknown): data is CustomConfig {
  return customConfigSchema.safeParse(data).success
}

/**
 * Validate that a configBlob matches the expected shape for a given kind.
 * Returns true if valid, false if not. Use narrowConfigBlob() when you
 * need the typed result, or this when you just need a boolean check.
 */
export function isValidConfigForKind(
  kind: NarrativeTemplateKind,
  data: unknown,
): boolean {
  return parseConfigBlob(kind, data).success
}
