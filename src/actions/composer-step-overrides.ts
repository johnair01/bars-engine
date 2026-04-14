'use server'

/**
 * CYOA Composer — Campaign-Level Step Override CRUD Actions
 *
 * GM-facing server actions to read, reorder, and disable composer steps
 * at the campaign (Instance) and template (AdventureTemplate) levels.
 *
 * Precedence chain: Instance.composerStepOverrides > AdventureTemplate.composerStepOverrides > defaults
 *
 * @see src/lib/cyoa-composer/step-registry.ts — step definitions, serialization, validation
 * @see src/lib/cyoa-composer/types.ts — ComposerStepOverrides, ComposerStepOverridesDb
 * @see src/actions/admin.ts — checkGM() auth pattern
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { checkGM } from '@/actions/admin'
import type {
  ComposerStepId,
  ComposerStepOverrides,
  ComposerStepOverridesDb,
  ComposerStepOverrideEntry,
} from '@/lib/cyoa-composer/types'
import {
  getDefaultSteps,
  parseComposerStepOverrides,
  serializeComposerStepOverrides,
  validateStepOverrides,
} from '@/lib/cyoa-composer/step-registry'

// ─── Result Types ───────────────────────────────────────────────────────────

/**
 * A single resolved step entry returned by the read action.
 * Merges the default definition with any GM override.
 */
export interface ComposerStepEntry {
  /** Step identifier */
  key: ComposerStepId
  /** Display label */
  label: string
  /** Effective sort order (GM override or default) */
  order: number
  /** Whether the step is enabled (GM can disable) */
  enabled: boolean
  /** The default order from the step registry */
  defaultOrder: number
  /** True if this step has a GM override applied */
  hasOverride: boolean
}

/**
 * Full configuration returned by the read action.
 * Includes resolved steps plus metadata about the override source.
 */
export interface ComposerStepConfig {
  /** The resolved step entries in order */
  steps: ComposerStepEntry[]
  /** Where the override is stored */
  source: 'instance' | 'adventure_template' | 'defaults'
  /** The entity ID the override is stored on (null for defaults) */
  sourceId: string | null
}

/**
 * Standard action result envelope.
 * Follows existing codebase error-handling pattern (throw for auth, return for validation).
 */
export type ComposerStepActionResult =
  | { success: true; config: ComposerStepConfig }
  | { success: false; error: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Merge default step definitions with GM overrides into resolved entries.
 * Returns entries sorted by effective order.
 */
function resolveStepEntries(
  overrides: ComposerStepOverrides | null,
): ComposerStepEntry[] {
  const defaults = getDefaultSteps()

  const entries: ComposerStepEntry[] = defaults.map((step) => {
    const override = overrides?.[step.id]
    let order = step.priority
    let enabled = true
    let hasOverride = false

    if (override != null) {
      hasOverride = true
      if (typeof override === 'number') {
        order = override
      } else {
        order = override.priority ?? step.priority
        enabled = override.enabled !== false
      }
    }

    return {
      key: step.id,
      label: step.label,
      order,
      enabled,
      defaultOrder: step.priority,
      hasOverride,
    }
  })

  // Sort by effective order (stable — ties preserve registry order)
  entries.sort((a, b) => a.order - b.order)
  return entries
}

/**
 * Build a ComposerStepOverrides map from an array of step entries.
 * Only includes entries that differ from defaults.
 */
function entriesToOverrides(
  entries: Array<{ key: ComposerStepId; order: number; enabled: boolean }>,
): ComposerStepOverrides {
  const defaults = getDefaultSteps()
  const defaultMap = new Map(defaults.map((s) => [s.id, s.priority]))
  const overrides: ComposerStepOverrides = {}

  for (const entry of entries) {
    const defaultPriority = defaultMap.get(entry.key)
    const orderDiffers = entry.order !== defaultPriority
    const disabledDiffers = entry.enabled === false

    if (orderDiffers || disabledDiffers) {
      overrides[entry.key] = {
        priority: entry.order,
        enabled: entry.enabled,
      }
    }
  }

  return overrides
}

// ─── READ: Get Composer Step Configuration ──────────────────────────────────

/**
 * Get the resolved composer step configuration for an Instance (campaign-level).
 *
 * Returns the merged step ordering with the source annotation.
 * If the Instance has no override, falls back to default step ordering.
 */
export async function getInstanceComposerSteps(
  instanceId: string,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!instance) {
    return { success: false, error: 'Instance not found' }
  }

  const overrides = parseComposerStepOverrides(instance.composerStepOverrides)
  const steps = resolveStepEntries(overrides)

  return {
    success: true,
    config: {
      steps,
      source: overrides ? 'instance' : 'defaults',
      sourceId: overrides ? instance.id : null,
    },
  }
}

/**
 * Get the resolved composer step configuration for an AdventureTemplate.
 *
 * Returns the merged step ordering with the source annotation.
 * If the template has no override, falls back to default step ordering.
 */
export async function getAdventureTemplateComposerSteps(
  templateId: string,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!template) {
    return { success: false, error: 'Adventure template not found' }
  }

  const overrides = parseComposerStepOverrides(template.composerStepOverrides)
  const steps = resolveStepEntries(overrides)

  return {
    success: true,
    config: {
      steps,
      source: overrides ? 'adventure_template' : 'defaults',
      sourceId: overrides ? template.id : null,
    },
  }
}

// ─── UPDATE: Reorder Steps ──────────────────────────────────────────────────

/**
 * Input for reordering composer steps.
 * GM provides the full step order as an array of { key, order } pairs.
 * Steps not included keep their current or default ordering.
 */
export interface ReorderStepsInput {
  steps: Array<{
    key: ComposerStepId
    order: number
  }>
}

/**
 * Reorder composer steps for an Instance (campaign-level).
 *
 * Merges the new ordering with existing enabled/disabled state.
 * Validates all step keys and priorities before persisting.
 */
export async function reorderInstanceComposerSteps(
  instanceId: string,
  input: ReorderStepsInput,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!instance) {
    return { success: false, error: 'Instance not found' }
  }

  // Parse existing overrides to preserve enabled/disabled state
  const existing = parseComposerStepOverrides(instance.composerStepOverrides) ?? {}

  // Build merged overrides: new order + existing enabled state
  const merged: ComposerStepOverrides = { ...existing }
  for (const { key, order } of input.steps) {
    const prev = merged[key]
    const prevEnabled = prev == null
      ? true
      : typeof prev === 'number'
        ? true
        : prev.enabled !== false
    merged[key] = { priority: order, enabled: prevEnabled }
  }

  // Validate
  const errors = validateStepOverrides(merged)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  // Persist
  const serialized = serializeComposerStepOverrides(merged)
  await db.instance.update({
    where: { id: instanceId },
    data: { composerStepOverrides: toPrismaJson(serialized) },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(merged)
  return {
    success: true,
    config: {
      steps,
      source: 'instance',
      sourceId: instanceId,
    },
  }
}

/**
 * Reorder composer steps for an AdventureTemplate.
 *
 * Merges the new ordering with existing enabled/disabled state.
 * Validates all step keys and priorities before persisting.
 */
export async function reorderAdventureTemplateComposerSteps(
  templateId: string,
  input: ReorderStepsInput,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!template) {
    return { success: false, error: 'Adventure template not found' }
  }

  const existing = parseComposerStepOverrides(template.composerStepOverrides) ?? {}

  const merged: ComposerStepOverrides = { ...existing }
  for (const { key, order } of input.steps) {
    const prev = merged[key]
    const prevEnabled = prev == null
      ? true
      : typeof prev === 'number'
        ? true
        : prev.enabled !== false
    merged[key] = { priority: order, enabled: prevEnabled }
  }

  const errors = validateStepOverrides(merged)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  const serialized = serializeComposerStepOverrides(merged)
  await db.adventureTemplate.update({
    where: { id: templateId },
    data: { composerStepOverrides: toPrismaJson(serialized) },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(merged)
  return {
    success: true,
    config: {
      steps,
      source: 'adventure_template',
      sourceId: templateId,
    },
  }
}

// ─── UPDATE: Toggle Step Enabled/Disabled ───────────────────────────────────

/**
 * Toggle whether a specific composer step is enabled or disabled
 * for an Instance (campaign-level).
 *
 * Disabled steps are forcibly skipped in the composer wizard regardless
 * of their skipCondition.
 */
export async function toggleInstanceComposerStep(
  instanceId: string,
  stepKey: ComposerStepId,
  enabled: boolean,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!instance) {
    return { success: false, error: 'Instance not found' }
  }

  // Confirmation step cannot be disabled — it's the receipt freeze point
  if (stepKey === 'confirmation' && !enabled) {
    return { success: false, error: 'The confirmation step cannot be disabled' }
  }

  const existing = parseComposerStepOverrides(instance.composerStepOverrides) ?? {}
  const prev = existing[stepKey]
  const currentPriority = prev == null
    ? undefined
    : typeof prev === 'number'
      ? prev
      : prev.priority

  // Build updated entry
  const entry: ComposerStepOverrideEntry = {
    priority: currentPriority,
    enabled,
  }
  const merged: ComposerStepOverrides = { ...existing, [stepKey]: entry }

  const errors = validateStepOverrides(merged)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  const serialized = serializeComposerStepOverrides(merged)
  await db.instance.update({
    where: { id: instanceId },
    data: { composerStepOverrides: toPrismaJson(serialized) },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(merged)
  return {
    success: true,
    config: {
      steps,
      source: 'instance',
      sourceId: instanceId,
    },
  }
}

/**
 * Toggle whether a specific composer step is enabled or disabled
 * for an AdventureTemplate.
 */
export async function toggleAdventureTemplateComposerStep(
  templateId: string,
  stepKey: ComposerStepId,
  enabled: boolean,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, composerStepOverrides: true },
  })

  if (!template) {
    return { success: false, error: 'Adventure template not found' }
  }

  if (stepKey === 'confirmation' && !enabled) {
    return { success: false, error: 'The confirmation step cannot be disabled' }
  }

  const existing = parseComposerStepOverrides(template.composerStepOverrides) ?? {}
  const prev = existing[stepKey]
  const currentPriority = prev == null
    ? undefined
    : typeof prev === 'number'
      ? prev
      : prev.priority

  const entry: ComposerStepOverrideEntry = {
    priority: currentPriority,
    enabled,
  }
  const merged: ComposerStepOverrides = { ...existing, [stepKey]: entry }

  const errors = validateStepOverrides(merged)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  const serialized = serializeComposerStepOverrides(merged)
  await db.adventureTemplate.update({
    where: { id: templateId },
    data: { composerStepOverrides: toPrismaJson(serialized) },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(merged)
  return {
    success: true,
    config: {
      steps,
      source: 'adventure_template',
      sourceId: templateId,
    },
  }
}

// ─── UPDATE: Bulk Update Steps ──────────────────────────────────────────────

/**
 * Full bulk update input — GM provides complete step configuration.
 * This is the "save all" action from the admin editor UI.
 */
export interface BulkUpdateStepsInput {
  steps: Array<{
    key: ComposerStepId
    order: number
    enabled: boolean
  }>
}

/**
 * Bulk update all composer steps for an Instance (campaign-level).
 *
 * Replaces the entire composerStepOverrides JSON with the provided configuration.
 * Only persists entries that differ from defaults (keeps JSON lean).
 */
export async function bulkUpdateInstanceComposerSteps(
  instanceId: string,
  input: BulkUpdateStepsInput,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true },
  })

  if (!instance) {
    return { success: false, error: 'Instance not found' }
  }

  // Validate: confirmation cannot be disabled
  const confirmationEntry = input.steps.find((s) => s.key === 'confirmation')
  if (confirmationEntry && !confirmationEntry.enabled) {
    return { success: false, error: 'The confirmation step cannot be disabled' }
  }

  // Build overrides (only entries that differ from defaults)
  const overrides = entriesToOverrides(input.steps)

  const errors = validateStepOverrides(overrides)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  // If no overrides needed, set to null (use defaults)
  const hasOverrides = Object.keys(overrides).length > 0
  const serialized = hasOverrides
    ? serializeComposerStepOverrides(overrides)
    : null

  await db.instance.update({
    where: { id: instanceId },
    data: {
      composerStepOverrides: toPrismaJson(serialized),
    },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(hasOverrides ? overrides : null)
  return {
    success: true,
    config: {
      steps,
      source: hasOverrides ? 'instance' : 'defaults',
      sourceId: hasOverrides ? instanceId : null,
    },
  }
}

/**
 * Bulk update all composer steps for an AdventureTemplate.
 *
 * Replaces the entire composerStepOverrides JSON with the provided configuration.
 * Only persists entries that differ from defaults (keeps JSON lean).
 */
export async function bulkUpdateAdventureTemplateComposerSteps(
  templateId: string,
  input: BulkUpdateStepsInput,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  })

  if (!template) {
    return { success: false, error: 'Adventure template not found' }
  }

  const confirmationEntry = input.steps.find((s) => s.key === 'confirmation')
  if (confirmationEntry && !confirmationEntry.enabled) {
    return { success: false, error: 'The confirmation step cannot be disabled' }
  }

  const overrides = entriesToOverrides(input.steps)

  const errors = validateStepOverrides(overrides)
  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  const hasOverrides = Object.keys(overrides).length > 0
  const serialized = hasOverrides
    ? serializeComposerStepOverrides(overrides)
    : null

  await db.adventureTemplate.update({
    where: { id: templateId },
    data: {
      composerStepOverrides: toPrismaJson(serialized),
    },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(hasOverrides ? overrides : null)
  return {
    success: true,
    config: {
      steps,
      source: hasOverrides ? 'adventure_template' : 'defaults',
      sourceId: hasOverrides ? templateId : null,
    },
  }
}

// ─── DELETE: Reset to Defaults ──────────────────────────────────────────────

/**
 * Reset composer step overrides to defaults for an Instance.
 * Clears the composerStepOverrides JSON to null.
 */
export async function resetInstanceComposerSteps(
  instanceId: string,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true },
  })

  if (!instance) {
    return { success: false, error: 'Instance not found' }
  }

  await db.instance.update({
    where: { id: instanceId },
    data: { composerStepOverrides: Prisma.JsonNull },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(null)
  return {
    success: true,
    config: {
      steps,
      source: 'defaults',
      sourceId: null,
    },
  }
}

/**
 * Reset composer step overrides to defaults for an AdventureTemplate.
 * Clears the composerStepOverrides JSON to null.
 */
export async function resetAdventureTemplateComposerSteps(
  templateId: string,
): Promise<ComposerStepActionResult> {
  await checkGM()

  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  })

  if (!template) {
    return { success: false, error: 'Adventure template not found' }
  }

  await db.adventureTemplate.update({
    where: { id: templateId },
    data: { composerStepOverrides: Prisma.JsonNull },
  })

  revalidatePath('/admin')

  const steps = resolveStepEntries(null)
  return {
    success: true,
    config: {
      steps,
      source: 'defaults',
      sourceId: null,
    },
  }
}

// ─── READ: Resolved Configuration (Player-facing) ──────────────────────────

/**
 * Get the effective composer step configuration for a player session.
 *
 * Resolves the precedence chain:
 *   Instance.composerStepOverrides > AdventureTemplate.composerStepOverrides > defaults
 *
 * This is the read action used by the player-facing composer to determine
 * step ordering. It does NOT require GM auth — any authenticated player
 * can resolve the config for their campaign context.
 */
export async function getEffectiveComposerSteps(
  instanceId: string,
  adventureTemplateId?: string | null,
): Promise<ComposerStepConfig> {
  // Check Instance-level override first (highest precedence)
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { composerStepOverrides: true },
  })

  const instanceOverrides = instance
    ? parseComposerStepOverrides(instance.composerStepOverrides)
    : null

  if (instanceOverrides) {
    return {
      steps: resolveStepEntries(instanceOverrides),
      source: 'instance',
      sourceId: instanceId,
    }
  }

  // Fall back to AdventureTemplate-level override
  if (adventureTemplateId) {
    const template = await db.adventureTemplate.findUnique({
      where: { id: adventureTemplateId },
      select: { composerStepOverrides: true },
    })

    const templateOverrides = template
      ? parseComposerStepOverrides(template.composerStepOverrides)
      : null

    if (templateOverrides) {
      return {
        steps: resolveStepEntries(templateOverrides),
        source: 'adventure_template',
        sourceId: adventureTemplateId,
      }
    }
  }

  // Default ordering
  return {
    steps: resolveStepEntries(null),
    source: 'defaults',
    sourceId: null,
  }
}

// ─── Prisma import for JsonNull + JSON coercion ────────────────────────────

import { Prisma } from '@prisma/client'

/**
 * Coerce a ComposerStepOverridesDb into a Prisma-compatible InputJsonValue.
 * Prisma requires an index-signature-compatible type for JSON columns;
 * our typed interface lacks one. JSON round-trip produces a plain object.
 */
function toPrismaJson(
  value: ComposerStepOverridesDb | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) return Prisma.JsonNull
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
