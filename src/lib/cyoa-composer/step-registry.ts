/**
 * CYOA Composer — Default Step Registry
 *
 * Defines the universal default step ordering for the composer wizard.
 * Priorities are spaced by 10 to allow GM insertion of custom steps.
 *
 * Default flow:
 *   1. Emotional Check-in  (priority 10)  — channel + altitude → vector
 *   2. Face Selection       (priority 20)  — lock a GameMasterFace
 *   3. Narrative Template   (priority 30)  — pick quest template
 *   4. Charge Text          (priority 40)  — player intention
 *   5. Confirmation         (priority 50)  — freeze receipt
 *
 * Steps adapt: if daily check-in is already completed, emotional_checkin
 * is auto-skipped. If face was pre-determined by spoke draw, face_selection
 * is skipped. The composer always ends with confirmation.
 */

import type {
  StepDefinition,
  ComposerStepId,
  ComposerStepOverrides,
  ComposerStepOverrideEntry,
  ComposerStepOverridesDb,
  ComposerDataBag,
  ResolvedStep,
} from './types'

// ─── Default Step Definitions ────────────────────────────────────────────────

const emotionalCheckin: StepDefinition = {
  id: 'emotional_checkin',
  label: 'How are you feeling?',
  priority: 10,
  requiredData: [],
  producesData: ['emotionalVector', 'channel', 'altitude', 'dailyCheckInId'],
  skipCondition: (data) =>
    data.emotionalVector != null &&
    data.channel != null &&
    data.altitude != null,
}

const faceSelection: StepDefinition = {
  id: 'face_selection',
  label: 'Choose your guide',
  priority: 20,
  requiredData: [],
  producesData: ['lockedFace'],
  skipCondition: (data) => data.lockedFace != null,
}

const narrativeTemplate: StepDefinition = {
  id: 'narrative_template',
  label: 'Select your path',
  priority: 30,
  requiredData: [],
  producesData: ['narrativeTemplateId'],
  skipCondition: (data) => data.narrativeTemplateId != null,
}

const chargeText: StepDefinition = {
  id: 'charge_text',
  label: 'Set your intention',
  priority: 40,
  requiredData: [],
  producesData: ['chargeText'],
  skipCondition: (data) =>
    data.chargeText != null && data.chargeText.length > 0,
}

const confirmation: StepDefinition = {
  id: 'confirmation',
  label: 'Confirm your build',
  priority: 50,
  requiredData: [
    'emotionalVector',
    'lockedFace',
    'narrativeTemplateId',
    'chargeText',
  ],
  producesData: [],
  // Confirmation is never auto-skipped — player must explicitly freeze
  skipCondition: undefined,
}

/**
 * The canonical default step registry.
 * Immutable — callers receive a copy via getDefaultSteps().
 */
const DEFAULT_STEPS: readonly StepDefinition[] = Object.freeze([
  emotionalCheckin,
  faceSelection,
  narrativeTemplate,
  chargeText,
  confirmation,
])

// ─── Public API ──────────────────────────────────────────────────────────────

/** Returns a mutable copy of the default step definitions. */
export function getDefaultSteps(): StepDefinition[] {
  return DEFAULT_STEPS.map((s) => ({ ...s }))
}

/** Look up a single default step by ID. Returns undefined if not found. */
export function getDefaultStep(id: ComposerStepId): StepDefinition | undefined {
  return DEFAULT_STEPS.find((s) => s.id === id)
}

/**
 * Extract the effective priority from a GM override value.
 * Handles both legacy number format and new object format.
 */
function getOverridePriority(
  override: number | ComposerStepOverrideEntry | undefined,
  defaultPriority: number,
): number {
  if (override == null) return defaultPriority
  if (typeof override === 'number') return override
  return override.priority ?? defaultPriority
}

/**
 * Extract the enabled flag from a GM override value.
 * Legacy number format and missing entries are treated as enabled.
 */
function getOverrideEnabled(
  override: number | ComposerStepOverrideEntry | undefined,
): boolean {
  if (override == null) return true
  if (typeof override === 'number') return true
  return override.enabled !== false
}

/**
 * Resolve step ordering with optional GM overrides.
 *
 * 1. Applies GM priority overrides (unmentioned steps keep defaults).
 * 2. Filters out disabled steps (enabled: false in override).
 * 3. Sorts by effective priority (stable sort — ties preserve insertion order).
 * 4. Evaluates skipConditions against the current data bag.
 *
 * Returns ordered ResolvedStep[] ready for the composer UI to render.
 */
export function resolveStepOrder(
  dataBag: ComposerDataBag,
  overrides?: ComposerStepOverrides | null,
): ResolvedStep[] {
  const steps = getDefaultSteps()

  const resolved: ResolvedStep[] = steps.map((step) => {
    const override = overrides?.[step.id]
    const effectivePriority = getOverridePriority(override, step.priority)
    const enabled = getOverrideEnabled(override)
    const skipByCondition = step.skipCondition ? step.skipCondition(dataBag) : false
    const skipped = !enabled || skipByCondition
    return {
      ...step,
      effectivePriority,
      skipped,
    }
  })

  // Stable sort by effective priority
  resolved.sort((a, b) => a.effectivePriority - b.effectivePriority)

  return resolved
}

/**
 * Returns the next actionable (non-skipped) step given current data.
 * Returns null when all steps are either skipped or the composer is complete.
 */
export function getNextActiveStep(
  dataBag: ComposerDataBag,
  overrides?: ComposerStepOverrides | null,
): ResolvedStep | null {
  const ordered = resolveStepOrder(dataBag, overrides)
  return ordered.find((s) => !s.skipped) ?? null
}

/**
 * Returns the count of remaining (non-skipped) steps.
 * Useful for progress indicators.
 */
export function getRemainingStepCount(
  dataBag: ComposerDataBag,
  overrides?: ComposerStepOverrides | null,
): number {
  const ordered = resolveStepOrder(dataBag, overrides)
  return ordered.filter((s) => !s.skipped).length
}

/**
 * Validates that a ComposerStepOverrides object contains only known step IDs
 * and valid priority/enabled values. Returns an array of error messages (empty = valid).
 *
 * Accepts both formats:
 * - Legacy: { [stepId]: number }
 * - Extended: { [stepId]: number | { priority?: number, enabled?: boolean } }
 */
export function validateStepOverrides(
  overrides: unknown,
): string[] {
  const errors: string[] = []
  if (overrides == null) return errors
  if (typeof overrides !== 'object' || Array.isArray(overrides)) {
    errors.push('Step overrides must be a plain object')
    return errors
  }
  const knownIds = new Set<string>(DEFAULT_STEPS.map((s) => s.id))
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (!knownIds.has(key)) {
      errors.push(`Unknown step ID: "${key}"`)
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        errors.push(`Priority for "${key}" must be a finite number`)
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const entry = value as Record<string, unknown>
      if (entry.priority != null && (typeof entry.priority !== 'number' || !Number.isFinite(entry.priority))) {
        errors.push(`Priority for "${key}" must be a finite number`)
      }
      if (entry.enabled != null && typeof entry.enabled !== 'boolean') {
        errors.push(`Enabled flag for "${key}" must be a boolean`)
      }
    } else {
      errors.push(`Override for "${key}" must be a number or { priority?: number, enabled?: boolean }`)
    }
  }
  return errors
}

/**
 * Parse the DB JSON column value into a ComposerStepOverrides map.
 * Accepts both the canonical DB array format (ComposerStepOverridesDb)
 * and the flat map format (ComposerStepOverrides).
 * Returns null for invalid/empty input.
 */
export function parseComposerStepOverrides(
  raw: unknown,
): ComposerStepOverrides | null {
  if (raw == null) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) return null

  const obj = raw as Record<string, unknown>

  // Canonical DB format: { steps: [{ key, enabled, order }] }
  if (Array.isArray(obj.steps)) {
    const result: ComposerStepOverrides = {}
    for (const item of obj.steps as unknown[]) {
      if (typeof item !== 'object' || item == null) continue
      const entry = item as Record<string, unknown>
      const key = entry.key as ComposerStepId
      if (typeof key !== 'string') continue
      result[key] = {
        priority: typeof entry.order === 'number' ? entry.order : undefined,
        enabled: typeof entry.enabled === 'boolean' ? entry.enabled : true,
      }
    }
    return Object.keys(result).length > 0 ? result : null
  }

  // Flat map format — validate and return as-is
  const errors = validateStepOverrides(raw)
  if (errors.length > 0) return null
  return raw as ComposerStepOverrides
}

/**
 * Serialize a ComposerStepOverrides map into the canonical DB JSON format.
 * Returns the ComposerStepOverridesDb shape for Prisma JSON storage.
 */
export function serializeComposerStepOverrides(
  overrides: ComposerStepOverrides | null | undefined,
): ComposerStepOverridesDb | null {
  if (overrides == null) return null
  const steps: ComposerStepOverridesDb['steps'] = []
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) continue
    const stepId = key as ComposerStepId
    if (typeof value === 'number') {
      steps.push({ key: stepId, enabled: true, order: value })
    } else {
      steps.push({
        key: stepId,
        enabled: value.enabled !== false,
        order: value.priority ?? getDefaultStep(stepId)?.priority ?? 50,
      })
    }
  }
  // Sort by order for readability
  steps.sort((a, b) => a.order - b.order)
  return { steps }
}
