'use server'

/**
 * NarrativeTemplate Data Migration Action
 *
 * Transforms and inserts existing QuestTemplate and AdventureTemplate records
 * into the unified NarrativeTemplate model, including field mapping, enum
 * translation, and foreign-key re-linking.
 *
 * This action is idempotent: it skips keys that already exist in NarrativeTemplate,
 * making it safe to run multiple times.
 *
 * Requires GM authorization (checkGM pattern).
 *
 * @see src/actions/narrative-template.ts — NarrativeTemplate CRUD actions
 * @see src/lib/narrative-template/types.ts — type definitions
 * @see src/lib/narrative-template/schemas.ts — Zod validation
 * @see prisma/schema.prisma — QuestTemplate, AdventureTemplate, NarrativeTemplate models
 */

import type { Prisma } from '@prisma/client'

import { checkGM } from '@/actions/admin'
import { db } from '@/lib/db'
import { parseConfigBlob } from '@/lib/narrative-template/schemas'
import type {
  EpiphanyConfig,
  KotterConfig,
  CustomConfig,
  NarrativeTemplateKind,
} from '@/lib/narrative-template/types'
import type {
  EpiphanyBeatType,
  GameMasterFace,
  KotterBeatType,
  PersonalMoveType,
} from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Canonical Epiphany beat order (personal arc, 6 beats). */
const CANONICAL_EPIPHANY_BEATS: EpiphanyBeatType[] = [
  'orientation',
  'rising_engagement',
  'tension',
  'integration',
  'transcendence',
  'consequence',
]

/** Canonical Kotter stage order (communal arc, 8 stages). */
const CANONICAL_KOTTER_BEATS: KotterBeatType[] = [
  'urgency',
  'coalition',
  'vision',
  'communicate',
  'obstacles',
  'wins',
  'build_on',
  'anchor',
]

/** Maps QuestTemplate.category → NarrativeTemplateKind. */
const CATEGORY_TO_KIND: Record<string, NarrativeTemplateKind> = {
  onboarding: 'ORIENTATION',
  fundraising: 'EPIPHANY',
  awareness: 'EPIPHANY',
  direct_action: 'KOTTER',
  community: 'KOTTER',
  custom: 'CUSTOM',
}

/** Maps QuestTemplate.category to a default questModel. */
const CATEGORY_TO_QUEST_MODEL: Record<string, 'personal' | 'communal'> = {
  onboarding: 'personal',
  fundraising: 'personal',
  awareness: 'personal',
  direct_action: 'communal',
  community: 'communal',
  custom: 'personal',
}

/** Maps QuestTemplate.category to default face affinities. */
const CATEGORY_TO_FACE_AFFINITIES: Record<string, GameMasterFace[]> = {
  onboarding: ['sage', 'diplomat'],
  fundraising: ['architect', 'challenger'],
  awareness: ['shaman', 'diplomat'],
  direct_action: ['challenger', 'regent'],
  community: ['diplomat', 'regent'],
  custom: [],
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-record migration result. */
interface MigrationRecord {
  sourceType: 'QuestTemplate' | 'AdventureTemplate'
  sourceId: string
  sourceKey: string
  targetKey: string
  targetKind: NarrativeTemplateKind
  status: 'created' | 'skipped' | 'error'
  error?: string
}

/** Full migration report returned by the action. */
export interface NarrativeTemplateMigrationReport {
  success: boolean
  timestamp: string
  totalProcessed: number
  created: number
  skipped: number
  errors: number
  records: MigrationRecord[]
}

// ---------------------------------------------------------------------------
// Helpers — QuestTemplate field mapping
// ---------------------------------------------------------------------------

/**
 * Extracts questModel from QuestTemplate.defaultSettings JSON blob.
 * Falls back to category-based inference.
 */
function extractQuestModel(
  defaultSettings: Record<string, unknown>,
  category: string,
): 'personal' | 'communal' {
  if (
    typeof defaultSettings.questModel === 'string' &&
    (defaultSettings.questModel === 'personal' || defaultSettings.questModel === 'communal')
  ) {
    return defaultSettings.questModel
  }
  return CATEGORY_TO_QUEST_MODEL[category] ?? 'personal'
}

/**
 * Extracts moveType from QuestTemplate.defaultSettings JSON blob.
 * Returns undefined if not set or not a valid PersonalMoveType.
 */
function extractMoveType(
  defaultSettings: Record<string, unknown>,
): PersonalMoveType | undefined {
  const validMoves: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']
  if (
    typeof defaultSettings.moveType === 'string' &&
    validMoves.includes(defaultSettings.moveType as PersonalMoveType)
  ) {
    return defaultSettings.moveType as PersonalMoveType
  }
  return undefined
}

/**
 * Extracts segment variant from QuestTemplate.defaultSettings JSON blob.
 * Defaults to 'player'.
 */
function extractSegment(
  defaultSettings: Record<string, unknown>,
): 'player' | 'sponsor' {
  if (
    typeof defaultSettings.segment === 'string' &&
    (defaultSettings.segment === 'player' || defaultSettings.segment === 'sponsor')
  ) {
    return defaultSettings.segment
  }
  return 'player'
}

/**
 * Extracts spineLength from QuestTemplate.defaultSettings JSON blob.
 */
function extractSpineLength(
  defaultSettings: Record<string, unknown>,
): 'short' | 'full' | undefined {
  if (
    typeof defaultSettings.spineLength === 'string' &&
    (defaultSettings.spineLength === 'short' || defaultSettings.spineLength === 'full')
  ) {
    return defaultSettings.spineLength
  }
  return undefined
}

/**
 * Extracts beat overrides from QuestTemplate.defaultSettings or copyTemplate.
 */
function extractBeatOverrides(
  defaultSettings: Record<string, unknown>,
  copyTemplate: Record<string, unknown>,
): Record<string, { choiceType?: 'altitudinal' | 'horizontal'; enabledFaces?: GameMasterFace[]; enabledHorizontal?: PersonalMoveType[] }> | undefined {
  // Check both blobs for nodeOverrides / beatOverrides
  const raw = defaultSettings.beatOverrides ?? defaultSettings.nodeOverrides ?? copyTemplate.beatOverrides ?? copyTemplate.nodeOverrides
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, { choiceType?: 'altitudinal' | 'horizontal'; enabledFaces?: GameMasterFace[]; enabledHorizontal?: PersonalMoveType[] }>
  }
  return undefined
}

/**
 * Extracts face affinities from QuestTemplate.defaultSettings or copyTemplate.
 * Falls back to category-based defaults.
 */
function extractFaceAffinities(
  defaultSettings: Record<string, unknown>,
  copyTemplate: Record<string, unknown>,
  category: string,
): GameMasterFace[] {
  // Check for explicit face affinities
  for (const blob of [defaultSettings, copyTemplate]) {
    const faces = blob.faceAffinities ?? blob.faces ?? blob.developmentalLens
    if (Array.isArray(faces) && faces.length > 0) {
      const validFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
      return faces.filter((f): f is GameMasterFace =>
        typeof f === 'string' && validFaces.includes(f as GameMasterFace),
      )
    }
    // Single face string → array
    if (typeof faces === 'string') {
      const validFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
      if (validFaces.includes(faces as GameMasterFace)) {
        return [faces as GameMasterFace]
      }
    }
  }
  return CATEGORY_TO_FACE_AFFINITIES[category] ?? []
}

/**
 * Translates QuestTemplate.category → NarrativeTemplateKind.
 */
function resolveKind(category: string): NarrativeTemplateKind {
  return CATEGORY_TO_KIND[category] ?? 'CUSTOM'
}

/**
 * Builds a configBlob for a given NarrativeTemplateKind from QuestTemplate fields.
 */
function buildConfigBlobFromQuestTemplate(
  kind: NarrativeTemplateKind,
  defaultSettings: Record<string, unknown>,
  copyTemplate: Record<string, unknown>,
): EpiphanyConfig | KotterConfig | CustomConfig {
  const segment = extractSegment(defaultSettings)
  const moveType = extractMoveType(defaultSettings)
  const beatOverrides = extractBeatOverrides(defaultSettings, copyTemplate)

  switch (kind) {
    case 'EPIPHANY': {
      const spineLength = extractSpineLength(defaultSettings)
      const config: EpiphanyConfig = {
        beats: CANONICAL_EPIPHANY_BEATS,
        defaultSegment: segment,
        ...(spineLength ? { spineLength } : {}),
        ...(moveType ? { moveType } : {}),
        ...(beatOverrides ? { beatOverrides } : {}),
      }
      return config
    }

    case 'KOTTER': {
      const config: KotterConfig = {
        beats: CANONICAL_KOTTER_BEATS,
        defaultSegment: segment,
        ...(moveType ? { moveType } : {}),
        ...(beatOverrides ? { beatOverrides } : {}),
      }
      return config
    }

    case 'ORIENTATION': {
      // Orientation uses face affinities as its face list.
      // Build minimal sub-packets for each face.
      const validFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
      const faces: GameMasterFace[] = Array.isArray(defaultSettings.faces)
        ? (defaultSettings.faces as string[]).filter((f): f is GameMasterFace =>
            validFaces.includes(f as GameMasterFace),
          )
        : validFaces

      return {
        faces,
        subPackets: faces.map((face) => ({
          face,
          label: face.charAt(0).toUpperCase() + face.slice(1),
        })),
      }
    }

    case 'CUSTOM': {
      // Preserve original defaultSettings + copyTemplate as merged config
      return {
        sourceDefaultSettings: defaultSettings,
        sourceCopyTemplate: copyTemplate,
        ...(moveType ? { moveType } : {}),
        ...(segment ? { segment } : {}),
      } satisfies CustomConfig
    }
  }
}

/**
 * Computes stepCount from kind.
 */
function stepCountForKind(kind: NarrativeTemplateKind): number {
  switch (kind) {
    case 'EPIPHANY':
      return 6
    case 'KOTTER':
      return 8
    case 'ORIENTATION':
      return 6 // one per face
    case 'CUSTOM':
      return 1 // freeform — 1 is minimum
  }
}

// ---------------------------------------------------------------------------
// Helpers — AdventureTemplate field mapping
// ---------------------------------------------------------------------------

/**
 * Parses AdventureTemplate.passageSlots JSON to count steps.
 */
function countPassageSlots(passageSlots: string): number {
  try {
    const parsed = JSON.parse(passageSlots)
    if (Array.isArray(parsed)) {
      return Math.max(parsed.length, 1)
    }
  } catch {
    // Fallback: cannot parse
  }
  return 1
}

/**
 * Extracts composerStepOverrides from AdventureTemplate to derive face affinities.
 */
function extractAdventureFaceAffinities(
  composerStepOverrides: unknown,
): GameMasterFace[] {
  if (!composerStepOverrides || typeof composerStepOverrides !== 'object') {
    return []
  }
  const overrides = composerStepOverrides as Record<string, unknown>
  if (Array.isArray(overrides.faceAffinities)) {
    const validFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
    return (overrides.faceAffinities as string[]).filter((f): f is GameMasterFace =>
      validFaces.includes(f as GameMasterFace),
    )
  }
  return []
}

// ---------------------------------------------------------------------------
// Core migration transforms
// ---------------------------------------------------------------------------

/**
 * Transforms a single QuestTemplate record into a NarrativeTemplate create input.
 */
function transformQuestTemplate(row: {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  defaultSettings: unknown
  copyTemplate: unknown
  status: string
  sortOrder: number
}): {
  key: string
  name: string
  description: string | null
  kind: NarrativeTemplateKind
  stepCount: number
  faceAffinities: GameMasterFace[]
  questModel: 'personal' | 'communal'
  configBlob: Prisma.InputJsonValue
  status: string
  sortOrder: number
} {
  const defaultSettings = (row.defaultSettings && typeof row.defaultSettings === 'object'
    ? row.defaultSettings
    : {}) as Record<string, unknown>
  const copyTemplate = (row.copyTemplate && typeof row.copyTemplate === 'object'
    ? row.copyTemplate
    : {}) as Record<string, unknown>

  const kind = resolveKind(row.category)
  const questModel = extractQuestModel(defaultSettings, row.category)
  const faceAffinities = extractFaceAffinities(defaultSettings, copyTemplate, row.category)
  const configBlob = buildConfigBlobFromQuestTemplate(kind, defaultSettings, copyTemplate)

  // Validate configBlob through Zod — fall back to CUSTOM if it fails
  const validationResult = parseConfigBlob(kind, configBlob)
  const finalKind = validationResult.success ? kind : 'CUSTOM'
  const finalConfigBlob = validationResult.success
    ? (configBlob as Prisma.InputJsonValue)
    : ({
        migrationFallback: true,
        originalKind: kind,
        sourceDefaultSettings: defaultSettings,
        sourceCopyTemplate: copyTemplate,
      } as Prisma.InputJsonValue)

  // Key: prefix to avoid collision with AdventureTemplate keys
  const targetKey = `qt-${row.key}`

  return {
    key: targetKey,
    name: row.name,
    description: row.description,
    kind: finalKind,
    stepCount: stepCountForKind(finalKind),
    faceAffinities,
    questModel,
    configBlob: finalConfigBlob,
    status: row.status === 'active' ? 'active' : 'archived',
    sortOrder: row.sortOrder,
  }
}

/**
 * Transforms a single AdventureTemplate record into a NarrativeTemplate create input.
 */
function transformAdventureTemplate(row: {
  id: string
  key: string
  name: string
  description: string | null
  passageSlots: string
  startNodeId: string
  ownership: string
  composerStepOverrides: unknown
}): {
  key: string
  name: string
  description: string | null
  kind: NarrativeTemplateKind
  stepCount: number
  faceAffinities: GameMasterFace[]
  questModel: 'personal' | 'communal'
  configBlob: Prisma.InputJsonValue
  status: string
  sortOrder: number
} {
  const stepCount = countPassageSlots(row.passageSlots)
  const faceAffinities = extractAdventureFaceAffinities(row.composerStepOverrides)

  // AdventureTemplates map to CUSTOM kind — they are freeform passage-based templates
  const kind: NarrativeTemplateKind = 'CUSTOM'
  const configBlob: CustomConfig = {
    sourceType: 'AdventureTemplate',
    passageSlots: safeJsonParse(row.passageSlots),
    startNodeId: row.startNodeId,
    ownership: row.ownership,
    composerStepOverrides: row.composerStepOverrides ?? null,
  }

  // Validate through Zod
  const validationResult = parseConfigBlob(kind, configBlob)
  const finalConfigBlob = validationResult.success
    ? (configBlob as Prisma.InputJsonValue)
    : ({ migrationFallback: true, raw: configBlob } as Prisma.InputJsonValue)

  // Key: prefix to avoid collision with QuestTemplate keys
  const targetKey = `at-${row.key}`

  return {
    key: targetKey,
    name: row.name,
    description: row.description,
    kind,
    stepCount,
    faceAffinities,
    questModel: 'personal',
    configBlob: finalConfigBlob,
    status: 'active',
    sortOrder: 0,
  }
}

/**
 * Safely parse JSON string. Returns parsed value or the original string as-is.
 */
function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// ---------------------------------------------------------------------------
// Main migration action
// ---------------------------------------------------------------------------

/**
 * Migrates existing QuestTemplate and AdventureTemplate records into the
 * unified NarrativeTemplate model.
 *
 * This action is idempotent:
 * - Records whose derived key already exists in NarrativeTemplate are skipped.
 * - No existing NarrativeTemplate records are modified.
 * - Source QuestTemplate and AdventureTemplate records are NOT modified or deleted.
 *
 * Requires GM authorization.
 *
 * @param options.dryRun - If true, performs all transforms and validation but
 *   does not write to the database. Default: false.
 * @returns Migration report with per-record status.
 */
export async function migrateTemplatesToNarrativeTemplate(
  options: { dryRun?: boolean } = {},
): Promise<NarrativeTemplateMigrationReport> {
  await checkGM()

  const { dryRun = false } = options
  const records: MigrationRecord[] = []

  // -------------------------------------------------------------------------
  // 1. Fetch all source records
  // -------------------------------------------------------------------------

  const [questTemplates, adventureTemplates, existingNarrativeKeys] = await Promise.all([
    db.questTemplate.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        category: true,
        defaultSettings: true,
        copyTemplate: true,
        status: true,
        sortOrder: true,
      },
    }),
    db.adventureTemplate.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        passageSlots: true,
        startNodeId: true,
        ownership: true,
        composerStepOverrides: true,
      },
    }),
    // Fetch existing NarrativeTemplate keys for idempotency check
    db.narrativeTemplate.findMany({
      select: { key: true },
    }).then((rows) => new Set(rows.map((r) => r.key))),
  ])

  // -------------------------------------------------------------------------
  // 2. Transform QuestTemplate records
  // -------------------------------------------------------------------------

  const questCreateInputs: Array<{
    data: ReturnType<typeof transformQuestTemplate>
    sourceId: string
    sourceKey: string
  }> = []

  for (const qt of questTemplates) {
    try {
      const transformed = transformQuestTemplate(qt)

      if (existingNarrativeKeys.has(transformed.key)) {
        records.push({
          sourceType: 'QuestTemplate',
          sourceId: qt.id,
          sourceKey: qt.key,
          targetKey: transformed.key,
          targetKind: transformed.kind,
          status: 'skipped',
        })
        continue
      }

      questCreateInputs.push({
        data: transformed,
        sourceId: qt.id,
        sourceKey: qt.key,
      })
    } catch (err) {
      records.push({
        sourceType: 'QuestTemplate',
        sourceId: qt.id,
        sourceKey: qt.key,
        targetKey: `qt-${qt.key}`,
        targetKind: 'CUSTOM',
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // -------------------------------------------------------------------------
  // 3. Transform AdventureTemplate records
  // -------------------------------------------------------------------------

  const adventureCreateInputs: Array<{
    data: ReturnType<typeof transformAdventureTemplate>
    sourceId: string
    sourceKey: string
  }> = []

  for (const at of adventureTemplates) {
    try {
      const transformed = transformAdventureTemplate(at)

      if (existingNarrativeKeys.has(transformed.key)) {
        records.push({
          sourceType: 'AdventureTemplate',
          sourceId: at.id,
          sourceKey: at.key,
          targetKey: transformed.key,
          targetKind: transformed.kind,
          status: 'skipped',
        })
        continue
      }

      adventureCreateInputs.push({
        data: transformed,
        sourceId: at.id,
        sourceKey: at.key,
      })
    } catch (err) {
      records.push({
        sourceType: 'AdventureTemplate',
        sourceId: at.id,
        sourceKey: at.key,
        targetKey: `at-${at.key}`,
        targetKind: 'CUSTOM',
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // -------------------------------------------------------------------------
  // 4. Persist (unless dry run)
  // -------------------------------------------------------------------------

  if (!dryRun) {
    // Use a transaction for atomicity — all-or-nothing insert.
    await db.$transaction(async (tx) => {
      // Insert QuestTemplate-derived NarrativeTemplates
      for (const input of questCreateInputs) {
        try {
          await tx.narrativeTemplate.create({
            data: {
              key: input.data.key,
              name: input.data.name,
              description: input.data.description,
              kind: input.data.kind,
              stepCount: input.data.stepCount,
              faceAffinities: input.data.faceAffinities as Prisma.InputJsonValue,
              questModel: input.data.questModel,
              configBlob: input.data.configBlob,
              status: input.data.status,
              sortOrder: input.data.sortOrder,
            },
          })
          records.push({
            sourceType: 'QuestTemplate',
            sourceId: input.sourceId,
            sourceKey: input.sourceKey,
            targetKey: input.data.key,
            targetKind: input.data.kind,
            status: 'created',
          })
        } catch (err) {
          records.push({
            sourceType: 'QuestTemplate',
            sourceId: input.sourceId,
            sourceKey: input.sourceKey,
            targetKey: input.data.key,
            targetKind: input.data.kind,
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      // Insert AdventureTemplate-derived NarrativeTemplates
      for (const input of adventureCreateInputs) {
        try {
          await tx.adventureTemplate.findUnique({ where: { id: input.sourceId } }) // Verify source still exists
          await tx.narrativeTemplate.create({
            data: {
              key: input.data.key,
              name: input.data.name,
              description: input.data.description,
              kind: input.data.kind,
              stepCount: input.data.stepCount,
              faceAffinities: input.data.faceAffinities as Prisma.InputJsonValue,
              questModel: input.data.questModel,
              configBlob: input.data.configBlob,
              status: input.data.status,
              sortOrder: input.data.sortOrder,
            },
          })
          records.push({
            sourceType: 'AdventureTemplate',
            sourceId: input.sourceId,
            sourceKey: input.sourceKey,
            targetKey: input.data.key,
            targetKind: input.data.kind,
            status: 'created',
          })
        } catch (err) {
          records.push({
            sourceType: 'AdventureTemplate',
            sourceId: input.sourceId,
            sourceKey: input.sourceKey,
            targetKey: input.data.key,
            targetKind: input.data.kind,
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    })
  } else {
    // Dry run: mark all pending inputs as 'created' (would-be)
    for (const input of questCreateInputs) {
      records.push({
        sourceType: 'QuestTemplate',
        sourceId: input.sourceId,
        sourceKey: input.sourceKey,
        targetKey: input.data.key,
        targetKind: input.data.kind,
        status: 'created',
      })
    }
    for (const input of adventureCreateInputs) {
      records.push({
        sourceType: 'AdventureTemplate',
        sourceId: input.sourceId,
        sourceKey: input.sourceKey,
        targetKey: input.data.key,
        targetKind: input.data.kind,
        status: 'created',
      })
    }
  }

  // -------------------------------------------------------------------------
  // 5. Build report
  // -------------------------------------------------------------------------

  const created = records.filter((r) => r.status === 'created').length
  const skipped = records.filter((r) => r.status === 'skipped').length
  const errors = records.filter((r) => r.status === 'error').length

  return {
    success: errors === 0,
    timestamp: new Date().toISOString(),
    totalProcessed: records.length,
    created,
    skipped,
    errors,
    records,
  }
}

// ---------------------------------------------------------------------------
// Reverse lookup: find the original source for a migrated NarrativeTemplate
// ---------------------------------------------------------------------------

/**
 * Given a NarrativeTemplate key, determines its source type and original key.
 * Returns null if the key does not follow the migration key convention.
 */
export function parseMigratedTemplateKey(key: string): {
  sourceType: 'QuestTemplate' | 'AdventureTemplate'
  originalKey: string
} | null {
  if (key.startsWith('qt-')) {
    return { sourceType: 'QuestTemplate', originalKey: key.slice(3) }
  }
  if (key.startsWith('at-')) {
    return { sourceType: 'AdventureTemplate', originalKey: key.slice(3) }
  }
  return null
}

/**
 * Fetches the original source record for a migrated NarrativeTemplate.
 * Useful for building foreign-key re-linking reports.
 *
 * Requires GM authorization.
 */
export async function getMigrationSource(narrativeTemplateKey: string): Promise<
  | { found: true; sourceType: 'QuestTemplate'; sourceId: string; sourceKey: string }
  | { found: true; sourceType: 'AdventureTemplate'; sourceId: string; sourceKey: string }
  | { found: false; reason: string }
> {
  await checkGM()

  const parsed = parseMigratedTemplateKey(narrativeTemplateKey)
  if (!parsed) {
    return { found: false, reason: 'Key does not match migration convention (qt-* or at-*)' }
  }

  if (parsed.sourceType === 'QuestTemplate') {
    const source = await db.questTemplate.findUnique({
      where: { key: parsed.originalKey },
      select: { id: true, key: true },
    })
    if (!source) {
      return { found: false, reason: `QuestTemplate with key "${parsed.originalKey}" not found` }
    }
    return { found: true, sourceType: 'QuestTemplate', sourceId: source.id, sourceKey: source.key }
  }

  const source = await db.adventureTemplate.findUnique({
    where: { key: parsed.originalKey },
    select: { id: true, key: true },
  })
  if (!source) {
    return { found: false, reason: `AdventureTemplate with key "${parsed.originalKey}" not found` }
  }
  return { found: true, sourceType: 'AdventureTemplate', sourceId: source.id, sourceKey: source.key }
}

/**
 * Returns a full foreign-key re-linking report: for each migrated NarrativeTemplate,
 * lists the source record and any dependent records (e.g., Adventures referencing
 * AdventureTemplates, Campaigns referencing QuestTemplates).
 *
 * Requires GM authorization.
 */
export async function getMigrationRelinkReport(): Promise<{
  entries: Array<{
    narrativeTemplateId: string
    narrativeTemplateKey: string
    sourceType: 'QuestTemplate' | 'AdventureTemplate' | 'native'
    originalKey: string | null
    dependentCount: number
  }>
}> {
  await checkGM()

  const narrativeTemplates = await db.narrativeTemplate.findMany({
    select: { id: true, key: true },
    orderBy: { key: 'asc' },
  })

  const entries = await Promise.all(
    narrativeTemplates.map(async (nt) => {
      const parsed = parseMigratedTemplateKey(nt.key)

      if (!parsed) {
        return {
          narrativeTemplateId: nt.id,
          narrativeTemplateKey: nt.key,
          sourceType: 'native' as const,
          originalKey: null,
          dependentCount: 0,
        }
      }

      let dependentCount = 0

      if (parsed.sourceType === 'AdventureTemplate') {
        // Count CmaGeneratorDrafts that reference this AdventureTemplate
        const at = await db.adventureTemplate.findUnique({
          where: { key: parsed.originalKey },
          select: { _count: { select: { cmaGeneratorDrafts: true } } },
        })
        dependentCount = at?._count.cmaGeneratorDrafts ?? 0
      }

      return {
        narrativeTemplateId: nt.id,
        narrativeTemplateKey: nt.key,
        sourceType: parsed.sourceType,
        originalKey: parsed.originalKey,
        dependentCount,
      }
    }),
  )

  return { entries }
}
