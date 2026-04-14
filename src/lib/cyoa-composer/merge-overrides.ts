/**
 * CYOA Composer — Override Merge Logic
 *
 * Pure utility that layers GM campaign overrides on top of universal default
 * step priorities, producing the final resolved step order for a given campaign.
 *
 * Precedence chain (highest to lowest):
 *   1. Instance-level overrides  (campaign-specific GM customization)
 *   2. Template-level overrides  (adventure template defaults)
 *   3. Universal defaults        (step-registry.ts DEFAULT_STEPS)
 *
 * Each layer is optional. Higher-precedence layers override lower ones per-step.
 * Steps not mentioned in any override retain their universal defaults.
 *
 * This module is intentionally DB-free — it operates on parsed ComposerStepOverrides
 * maps only. DB fetching and parsing happen in the server actions layer.
 *
 * @see src/lib/cyoa-composer/step-registry.ts — default step definitions
 * @see src/lib/cyoa-composer/types.ts — ComposerStepOverrides type
 * @see src/actions/composer-step-overrides.ts — server actions that call this
 */

import type {
  ComposerStepId,
  ComposerStepOverrides,
  ComposerStepOverrideEntry,
  ComposerDataBag,
  ResolvedStep,
} from './types'
import { getDefaultSteps } from './step-registry'

// ─── Override Layer Types ───────────────────────────────────────────────────

/**
 * Named override layer for the merge pipeline.
 * source identifies where the override came from (for debugging/display).
 */
export interface OverrideLayer {
  /** Human-readable source identifier (e.g. "instance", "adventure_template") */
  source: string
  /** The parsed override map. null means "no overrides at this layer". */
  overrides: ComposerStepOverrides | null
}

/**
 * Result of merging multiple override layers.
 * Contains both the merged flat override map and the source that "won"
 * for each step key.
 */
export interface MergedOverrides {
  /** The final merged override map (union of all layers, highest precedence wins per key) */
  merged: ComposerStepOverrides
  /** Per-step attribution: which source layer contributed each override */
  attribution: Partial<Record<ComposerStepId, string>>
  /** True if any layer contributed at least one override */
  hasOverrides: boolean
}

/**
 * A fully resolved step entry with merge attribution.
 * Extends ResolvedStep with source-tracking for the admin UI.
 */
export interface MergedResolvedStep extends ResolvedStep {
  /** The default priority from the step registry */
  defaultPriority: number
  /** Which override source determined this step's effective values (null = defaults) */
  overrideSource: string | null
  /** True if any override was applied to this step */
  hasOverride: boolean
}

// ─── Merge Logic ────────────────────────────────────────────────────────────

/**
 * Normalize a single override value into its priority and enabled parts.
 * Handles both the legacy number format and the full object format.
 */
function normalizeOverrideEntry(
  value: number | ComposerStepOverrideEntry,
): { priority: number | undefined; enabled: boolean } {
  if (typeof value === 'number') {
    return { priority: value, enabled: true }
  }
  return {
    priority: value.priority,
    enabled: value.enabled !== false,
  }
}

/**
 * Merge multiple override layers into a single ComposerStepOverrides map.
 *
 * Layers are provided in **precedence order** (highest-priority first).
 * For each step key, the first layer that mentions it wins.
 *
 * Example:
 *   mergeOverrideLayers([
 *     { source: 'instance', overrides: instanceOverrides },
 *     { source: 'adventure_template', overrides: templateOverrides },
 *   ])
 *
 * If instanceOverrides sets face_selection priority to 5 and templateOverrides
 * sets it to 15, the merged result uses 5 (instance wins).
 *
 * @param layers - Override layers in precedence order (highest first)
 * @returns Merged overrides with per-step attribution
 */
export function mergeOverrideLayers(
  layers: OverrideLayer[],
): MergedOverrides {
  const merged: ComposerStepOverrides = {}
  const attribution: Partial<Record<ComposerStepId, string>> = {}

  // Process layers in precedence order (highest first).
  // First layer to mention a step key wins — subsequent layers are ignored for that key.
  for (const layer of layers) {
    if (layer.overrides == null) continue

    for (const [key, value] of Object.entries(layer.overrides)) {
      const stepId = key as ComposerStepId
      if (value == null) continue

      // Only apply if no higher-precedence layer already set this key
      if (!(stepId in merged)) {
        merged[stepId] = value
        attribution[stepId] = layer.source
      }
    }
  }

  return {
    merged,
    attribution,
    hasOverrides: Object.keys(merged).length > 0,
  }
}

/**
 * Convenience overload: merge exactly two layers (instance + template).
 * This is the most common case for campaign step resolution.
 *
 * @param instanceOverrides  - Campaign instance-level overrides (highest precedence)
 * @param templateOverrides  - Adventure template-level overrides (fallback)
 * @returns Merged overrides with attribution
 */
export function mergeCampaignOverrides(
  instanceOverrides: ComposerStepOverrides | null,
  templateOverrides: ComposerStepOverrides | null,
): MergedOverrides {
  return mergeOverrideLayers([
    { source: 'instance', overrides: instanceOverrides },
    { source: 'adventure_template', overrides: templateOverrides },
  ])
}

// ─── Resolved Step Order ────────────────────────────────────────────────────

/**
 * Produce the final resolved step order for a given campaign.
 *
 * This is the primary merge-and-resolve function. It:
 *   1. Merges override layers (highest precedence first)
 *   2. Applies merged priorities and enabled flags to default steps
 *   3. Evaluates skipConditions against the current data bag
 *   4. Sorts by effective priority (stable sort)
 *   5. Returns MergedResolvedStep[] with full attribution
 *
 * @param dataBag   - Current composer data bag (for skip conditions)
 * @param layers    - Override layers in precedence order (highest first)
 * @returns Ordered array of fully resolved steps with attribution
 */
export function resolveStepOrderWithLayers(
  dataBag: ComposerDataBag,
  layers: OverrideLayer[],
): MergedResolvedStep[] {
  const { merged, attribution } = mergeOverrideLayers(layers)
  const steps = getDefaultSteps()

  const resolved: MergedResolvedStep[] = steps.map((step) => {
    const override = merged[step.id]
    const overrideSource = attribution[step.id] ?? null
    const hasOverride = overrideSource !== null

    let effectivePriority = step.priority
    let enabled = true

    if (override != null) {
      const normalized = normalizeOverrideEntry(override)
      effectivePriority = normalized.priority ?? step.priority
      enabled = normalized.enabled
    }

    const skipByCondition = step.skipCondition
      ? step.skipCondition(dataBag)
      : false
    const skipped = !enabled || skipByCondition

    return {
      ...step,
      effectivePriority,
      skipped,
      defaultPriority: step.priority,
      overrideSource,
      hasOverride,
    }
  })

  // Stable sort by effective priority
  resolved.sort((a, b) => a.effectivePriority - b.effectivePriority)

  return resolved
}

/**
 * Convenience: resolve step order for a campaign with instance + template overrides.
 *
 * @param dataBag             - Current composer data bag
 * @param instanceOverrides   - Campaign instance-level overrides (highest precedence)
 * @param templateOverrides   - Adventure template-level overrides (fallback)
 * @returns Ordered array of fully resolved steps with attribution
 */
export function resolveCampaignStepOrder(
  dataBag: ComposerDataBag,
  instanceOverrides: ComposerStepOverrides | null,
  templateOverrides: ComposerStepOverrides | null,
): MergedResolvedStep[] {
  return resolveStepOrderWithLayers(dataBag, [
    { source: 'instance', overrides: instanceOverrides },
    { source: 'adventure_template', overrides: templateOverrides },
  ])
}

/**
 * Get the next active (non-skipped) step from a multi-layer resolution.
 * Returns null when all steps are skipped or the composer is complete.
 */
export function getNextActiveStepFromLayers(
  dataBag: ComposerDataBag,
  layers: OverrideLayer[],
): MergedResolvedStep | null {
  const ordered = resolveStepOrderWithLayers(dataBag, layers)
  return ordered.find((s) => !s.skipped) ?? null
}

/**
 * Get remaining (non-skipped) step count from a multi-layer resolution.
 */
export function getRemainingStepCountFromLayers(
  dataBag: ComposerDataBag,
  layers: OverrideLayer[],
): number {
  const ordered = resolveStepOrderWithLayers(dataBag, layers)
  return ordered.filter((s) => !s.skipped).length
}
