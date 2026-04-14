/**
 * NarrativeTemplate — Backwards-Compatibility Shims
 *
 * Adapter functions and view-layer shims that allow existing code referencing
 * QuestTemplate and AdventureTemplate shapes to work transparently against
 * NarrativeTemplate data.
 *
 * This module provides:
 * 1. Type aliases mapping legacy shapes to NarrativeTemplate
 * 2. Adapter functions converting NarrativeTemplate rows → legacy shapes
 * 3. Unified query helpers that read from NarrativeTemplate but return
 *    legacy-compatible objects
 *
 * Existing consumers:
 * - src/lib/modular-cyoa-graph/generator.ts → inflateTemplateToGraph(AdventureTemplate, ...)
 * - src/lib/template-library/index.ts → listTemplates(), generateFromTemplate()
 * - src/actions/quest-templates.ts → getQuestTemplates()
 * - src/components/quest-creation/QuestWizard.tsx → QuestTemplate type
 * - src/actions/composer-step-overrides.ts → AdventureTemplate.composerStepOverrides
 * - src/lib/quest-template-seeds.ts → QuestTemplateSeedData
 *
 * Pattern: adapter at TypeScript boundary — no DB schema changes needed.
 *
 * @see src/lib/narrative-template/types.ts — canonical NarrativeTemplate types
 * @see src/actions/narrative-template-migration.ts — data migration (QT/AT → NT)
 * @see prisma/schema.prisma — all three models coexist during migration window
 */

import type {
  NarrativeTemplateRow,
  NarrativeTemplateKind,
  CustomConfig,
  TypedNarrativeTemplate,
} from './types'
import { narrowConfigBlob } from './narrow'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Legacy shape: AdventureTemplate (Prisma-compatible view)
// ---------------------------------------------------------------------------

/**
 * Legacy AdventureTemplate shape — mirrors the Prisma AdventureTemplate model.
 *
 * Existing code (e.g., inflateTemplateToGraph) expects this shape.
 * The adapter below produces it from a NarrativeTemplate row whose
 * configBlob contains the original AdventureTemplate fields (set by
 * the migration action for `at-*` keyed templates, or by CUSTOM kind).
 */
export interface LegacyAdventureTemplate {
  id: string
  key: string
  name: string
  description: string | null
  passageSlots: string
  startNodeId: string
  ownership: string
  composerStepOverrides: unknown
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Legacy shape: QuestTemplateSeedData (campaign wizard)
// ---------------------------------------------------------------------------

/**
 * Legacy QuestTemplateSeedData shape — mirrors src/lib/quest-template-seeds.ts.
 *
 * Used by the campaign creation wizard and quest template seeding system.
 */
export interface LegacyQuestTemplateSeed {
  key: string
  name: string
  description: string
  category: string
  defaultSettings: Record<string, unknown>
  copyTemplate: Record<string, unknown>
  narrativeHooks: Record<string, unknown> | null
  sortOrder: number
}

// ---------------------------------------------------------------------------
// Kind → legacy category mapping (reverse of migration)
// ---------------------------------------------------------------------------

const KIND_TO_CATEGORY: Record<NarrativeTemplateKind, string> = {
  ORIENTATION: 'onboarding',
  EPIPHANY: 'fundraising', // default; may be awareness — check faceAffinities
  KOTTER: 'direct_action', // default; may be community — check faceAffinities
  CUSTOM: 'custom',
}

/**
 * Refine the category based on kind + face affinities.
 * Mirrors the forward mapping in narrative-template-migration.ts.
 */
function refineCategoryFromFaceAffinities(
  kind: NarrativeTemplateKind,
  faceAffinities: GameMasterFace[],
): string {
  if (kind === 'EPIPHANY') {
    // awareness templates have shaman or diplomat affinity
    if (faceAffinities.includes('shaman') && faceAffinities.includes('diplomat')) {
      return 'awareness'
    }
    return 'fundraising'
  }
  if (kind === 'KOTTER') {
    // community templates have diplomat + regent affinity
    if (faceAffinities.includes('diplomat') && faceAffinities.includes('regent')) {
      return 'community'
    }
    return 'direct_action'
  }
  return KIND_TO_CATEGORY[kind]
}

// ---------------------------------------------------------------------------
// Adapter: NarrativeTemplate → LegacyAdventureTemplate
// ---------------------------------------------------------------------------

/**
 * Convert a NarrativeTemplate row (CUSTOM kind with AdventureTemplate source)
 * into a LegacyAdventureTemplate shape.
 *
 * For templates migrated from AdventureTemplate (key prefix `at-`), the
 * configBlob contains: { sourceType, passageSlots, startNodeId, ownership,
 * composerStepOverrides }.
 *
 * For non-migrated NarrativeTemplates, synthesizes reasonable defaults.
 *
 * @returns LegacyAdventureTemplate or null if the template cannot be adapted
 */
export function toAdventureTemplateView(
  row: NarrativeTemplateRow,
): LegacyAdventureTemplate | null {
  // Attempt to extract adventure-specific fields from configBlob
  const config = typeof row.configBlob === 'object' && row.configBlob !== null
    ? (row.configBlob as Record<string, unknown>)
    : {}

  // Check if this was migrated from an AdventureTemplate
  const isMigratedAdventure =
    config.sourceType === 'AdventureTemplate' || row.key.startsWith('at-')

  // For migrated adventure templates, extract original fields
  if (isMigratedAdventure) {
    const passageSlots = config.passageSlots != null
      ? (typeof config.passageSlots === 'string'
        ? config.passageSlots
        : JSON.stringify(config.passageSlots))
      : '[]'

    return {
      id: row.id,
      key: row.key.startsWith('at-') ? row.key.slice(3) : row.key,
      name: row.name,
      description: row.description,
      passageSlots,
      startNodeId: typeof config.startNodeId === 'string' ? config.startNodeId : 'context_1',
      ownership: typeof config.ownership === 'string' ? config.ownership : 'system',
      composerStepOverrides: config.composerStepOverrides ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  // For native NarrativeTemplates (CUSTOM kind), synthesize a minimal shape
  if (row.kind === 'CUSTOM') {
    // Build a linear passage slot sequence from stepCount
    const slots = Array.from({ length: row.stepCount }, (_, i) => ({
      nodeId: `step_${i + 1}`,
      label: `Step ${i + 1}`,
      order: i,
    }))

    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      passageSlots: JSON.stringify(slots),
      startNodeId: 'step_1',
      ownership: 'system',
      composerStepOverrides: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  // Non-CUSTOM kinds (EPIPHANY, KOTTER, ORIENTATION) don't map cleanly
  // to AdventureTemplate — return null to signal the caller should use
  // the NarrativeTemplate API instead.
  return null
}

// ---------------------------------------------------------------------------
// Adapter: NarrativeTemplate → LegacyQuestTemplateSeed
// ---------------------------------------------------------------------------

/**
 * Convert a NarrativeTemplate row into a LegacyQuestTemplateSeed shape.
 *
 * For templates migrated from QuestTemplate (key prefix `qt-`), reconstructs
 * the original seed shape from the NarrativeTemplate configBlob.
 *
 * For native NarrativeTemplates, synthesizes reasonable defaults.
 */
export function toQuestTemplateSeedView(
  row: NarrativeTemplateRow,
): LegacyQuestTemplateSeed {
  const config = typeof row.configBlob === 'object' && row.configBlob !== null
    ? (row.configBlob as Record<string, unknown>)
    : {}

  // Determine category from kind + face affinities
  const category = refineCategoryFromFaceAffinities(row.kind, row.faceAffinities)

  // For migrated QuestTemplates, try to recover sourceDefaultSettings and sourceCopyTemplate
  const isMigratedQuest = row.key.startsWith('qt-')

  let defaultSettings: Record<string, unknown>
  let copyTemplate: Record<string, unknown>

  if (isMigratedQuest && config.sourceDefaultSettings) {
    // CUSTOM fallback during migration preserved original settings
    defaultSettings = config.sourceDefaultSettings as Record<string, unknown>
    copyTemplate = (config.sourceCopyTemplate as Record<string, unknown>) ?? {}
  } else {
    // Reconstruct defaultSettings from NarrativeTemplate fields
    defaultSettings = {
      questModel: row.questModel,
      faceAffinities: row.faceAffinities,
    }

    // Add kind-specific fields to defaultSettings
    if (row.kind === 'EPIPHANY') {
      const typed = narrowConfigBlob('EPIPHANY', row.configBlob)
      if (typed) {
        defaultSettings.moveType = typed.moveType
        defaultSettings.segment = typed.defaultSegment
        defaultSettings.spineLength = typed.spineLength
        if (typed.beatOverrides) {
          defaultSettings.beatOverrides = typed.beatOverrides
        }
      }
    } else if (row.kind === 'KOTTER') {
      const typed = narrowConfigBlob('KOTTER', row.configBlob)
      if (typed) {
        defaultSettings.moveType = typed.moveType
        defaultSettings.segment = typed.defaultSegment
        if (typed.beatOverrides) {
          defaultSettings.beatOverrides = typed.beatOverrides
        }
      }
    }

    copyTemplate = {}
  }

  return {
    key: isMigratedQuest ? row.key.slice(3) : row.key,
    name: row.name,
    description: row.description ?? '',
    category,
    defaultSettings,
    copyTemplate,
    narrativeHooks: null,
    sortOrder: row.sortOrder,
  }
}

// ---------------------------------------------------------------------------
// Adapter: NarrativeTemplate → composer-step-overrides shape
// ---------------------------------------------------------------------------

/**
 * Extract composerStepOverrides from a NarrativeTemplate row.
 *
 * Used by composer-step-overrides actions that previously queried
 * AdventureTemplate.composerStepOverrides directly.
 *
 * Returns the overrides JSON or null if not present.
 */
export function extractComposerStepOverrides(
  row: NarrativeTemplateRow,
): unknown {
  const config = typeof row.configBlob === 'object' && row.configBlob !== null
    ? (row.configBlob as Record<string, unknown>)
    : {}

  return config.composerStepOverrides ?? null
}

// ---------------------------------------------------------------------------
// Adapter: NarrativeTemplate → in-app QuestTemplate (QuestWizard shape)
// ---------------------------------------------------------------------------

/**
 * In-app QuestTemplate shape used by QuestWizard component.
 * @see src/lib/quest-templates.ts
 */
export interface LegacyQuestTemplate {
  id: string
  category: string
  categoryDisplay?: string
  title: string
  description: string
  examples: string[]
  lifecycleFraming?: boolean
  approaches?: string[]
  directions?: string[]
  inputs: LegacyQuestInputConfig[]
}

export interface LegacyQuestInputConfig {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select'
  placeholder?: string
  options?: string[]
  optional?: boolean
}

/** Category display name mapping. */
const CATEGORY_DISPLAY: Record<string, string> = {
  onboarding: 'ONBOARDING',
  fundraising: 'CAMPAIGN',
  awareness: 'AWARENESS',
  direct_action: 'ACTION',
  community: 'COMMUNITY',
  custom: 'CUSTOM',
}

/**
 * Convert a NarrativeTemplate row into the in-app QuestTemplate shape
 * used by QuestWizard and the quest creation flow.
 *
 * This is a presentation adapter — it generates sensible wizard inputs
 * from the NarrativeTemplate's kind and config.
 */
export function toQuestWizardTemplate(
  row: NarrativeTemplateRow,
): LegacyQuestTemplate {
  const category = refineCategoryFromFaceAffinities(row.kind, row.faceAffinities)

  // Build inputs based on kind
  const inputs: LegacyQuestInputConfig[] = buildWizardInputs(row.kind)

  // Build examples based on kind
  const examples = buildWizardExamples(row.kind)

  return {
    id: row.key.startsWith('qt-') ? row.key.slice(3) : row.key,
    category,
    categoryDisplay: CATEGORY_DISPLAY[category],
    title: row.name,
    description: row.description ?? '',
    examples,
    lifecycleFraming: row.kind === 'EPIPHANY',
    approaches: row.kind === 'KOTTER'
      ? ['Freeform', 'Kotter Framework']
      : undefined,
    inputs,
  }
}

function buildWizardInputs(kind: NarrativeTemplateKind): LegacyQuestInputConfig[] {
  switch (kind) {
    case 'EPIPHANY':
      return [
        { key: 'exploration', label: 'What will you explore?', type: 'textarea', placeholder: 'Describe your experiment...' },
        { key: 'framing', label: 'Lifecycle Framing', type: 'select', options: ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up'], optional: true },
      ]
    case 'KOTTER':
      return [
        { key: 'vision', label: 'Your Vision', type: 'textarea', placeholder: 'Describe what you want to build...' },
        { key: 'approach', label: 'Approach', type: 'select', options: ['Freeform', 'Kotter Framework'] },
        {
          key: 'kotterStage', label: 'Kotter Stage (if applicable)', type: 'select',
          options: [
            '1. Create Urgency', '2. Build Coalition', '3. Form Vision', '4. Enlist Army',
            '5. Enable Action', '6. Generate Wins', '7. Sustain Acceleration', '8. Institute Change',
          ],
          optional: true,
        },
      ]
    case 'ORIENTATION':
      return [
        { key: 'intention', label: 'Set your intention', type: 'textarea', placeholder: 'What are you curious about?' },
      ]
    case 'CUSTOM':
      return [
        { key: 'goal', label: 'Goal', type: 'textarea', placeholder: 'What needs to be done?' },
      ]
  }
}

function buildWizardExamples(kind: NarrativeTemplateKind): string[] {
  switch (kind) {
    case 'EPIPHANY':
      return ['Try something new', 'Develop a skill', 'Build capacity in an area']
    case 'KOTTER':
      return ['Launch a collaborative project', 'Build a multi-stage vision', 'Create urgency for change']
    case 'ORIENTATION':
      return ['Meet the six faces', 'Discover your starting path', 'Set your intention']
    case 'CUSTOM':
      return ['Anything you can imagine']
  }
}

// ---------------------------------------------------------------------------
// Batch adapters — convert collections for list views
// ---------------------------------------------------------------------------

/**
 * Convert an array of NarrativeTemplate rows to LegacyAdventureTemplate views.
 * Filters out rows that cannot be adapted (non-CUSTOM, non-migrated-adventure).
 */
export function toAdventureTemplateViews(
  rows: NarrativeTemplateRow[],
): LegacyAdventureTemplate[] {
  return rows
    .map(toAdventureTemplateView)
    .filter((t): t is LegacyAdventureTemplate => t !== null)
}

/**
 * Convert an array of NarrativeTemplate rows to LegacyQuestTemplateSeed views.
 */
export function toQuestTemplateSeedViews(
  rows: NarrativeTemplateRow[],
): LegacyQuestTemplateSeed[] {
  return rows.map(toQuestTemplateSeedView)
}

/**
 * Convert an array of NarrativeTemplate rows to LegacyQuestTemplate views
 * (for QuestWizard).
 */
export function toQuestWizardTemplates(
  rows: NarrativeTemplateRow[],
): LegacyQuestTemplate[] {
  return rows.map(toQuestWizardTemplate)
}

// ---------------------------------------------------------------------------
// Utility: check if a NarrativeTemplate was migrated from a specific source
// ---------------------------------------------------------------------------

/**
 * Returns true if the NarrativeTemplate key indicates it was migrated
 * from a QuestTemplate (prefix `qt-`).
 */
export function isMigratedFromQuestTemplate(key: string): boolean {
  return key.startsWith('qt-')
}

/**
 * Returns true if the NarrativeTemplate key indicates it was migrated
 * from an AdventureTemplate (prefix `at-`).
 */
export function isMigratedFromAdventureTemplate(key: string): boolean {
  return key.startsWith('at-')
}

/**
 * Strip the migration prefix from a NarrativeTemplate key to recover
 * the original source key.
 *
 * Returns the key unchanged if no migration prefix is present.
 */
export function stripMigrationPrefix(key: string): string {
  if (key.startsWith('qt-') || key.startsWith('at-')) {
    return key.slice(3)
  }
  return key
}
