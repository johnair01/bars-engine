'use server'

/**
 * NarrativeTemplate CRUD Server Actions
 *
 * GM-facing actions for managing the unified NarrativeTemplate registry.
 * All mutations require GM authorization (checkGM pattern).
 * configBlob is validated per-kind at the TypeScript boundary using Zod schemas.
 *
 * Follows existing patterns:
 * @see src/actions/admin.ts — checkGM() auth pattern
 * @see src/actions/npc-constitution.ts — CRUD action pattern with JSON blob fields
 * @see src/lib/narrative-template/schemas.ts — Zod validation for configBlob per kind
 */

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { checkGM } from '@/actions/admin'
import { db } from '@/lib/db'
import {
  parseConfigBlob,
  createNarrativeTemplateInputSchema,
  updateNarrativeTemplateInputSchema,
  narrativeTemplateKindSchema,
  templateStatusSchema,
} from '@/lib/narrative-template/schemas'
import type {
  NarrativeTemplateKind,
  NarrativeTemplateRow,
  NarrativeTemplateSummary,
} from '@/lib/narrative-template/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Prisma result to a typed NarrativeTemplateRow.
 * faceAffinities is stored as Json in Prisma; cast to GameMasterFace[] here.
 */
function toRow(row: Record<string, unknown>): NarrativeTemplateRow {
  return {
    id: row.id as string,
    key: row.key as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    kind: row.kind as NarrativeTemplateRow['kind'],
    stepCount: row.stepCount as number,
    faceAffinities: (row.faceAffinities ?? []) as NarrativeTemplateRow['faceAffinities'],
    questModel: (row.questModel as NarrativeTemplateRow['questModel']) ?? 'personal',
    configBlob: row.configBlob,
    status: (row.status as NarrativeTemplateRow['status']) ?? 'active',
    sortOrder: (row.sortOrder as number) ?? 0,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  }
}

/** Maps a Prisma result to a lightweight summary projection. */
function toSummary(row: Record<string, unknown>): NarrativeTemplateSummary {
  return {
    id: row.id as string,
    key: row.key as string,
    name: row.name as string,
    kind: row.kind as NarrativeTemplateSummary['kind'],
    faceAffinities: (row.faceAffinities ?? []) as NarrativeTemplateSummary['faceAffinities'],
    questModel: (row.questModel as NarrativeTemplateSummary['questModel']) ?? 'personal',
    stepCount: row.stepCount as number,
    status: (row.status as NarrativeTemplateSummary['status']) ?? 'active',
  }
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

/**
 * Create a new NarrativeTemplate.
 * Validates the shared spine and kind-specific configBlob before persisting.
 * Requires GM authorization.
 */
export async function createNarrativeTemplate(input: unknown): Promise<
  | { success: true; data: NarrativeTemplateRow }
  | { success: false; error: string }
> {
  await checkGM()

  // 1. Validate shared spine input
  const inputResult = createNarrativeTemplateInputSchema.safeParse(input)
  if (!inputResult.success) {
    return {
      success: false,
      error: `Invalid input: ${inputResult.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  const parsed = inputResult.data

  // 2. Validate configBlob against the declared kind
  const configResult = parseConfigBlob(parsed.kind, parsed.configBlob)
  if (!configResult.success) {
    return {
      success: false,
      error: `Invalid configBlob for kind "${parsed.kind}": ${configResult.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  // 3. Check for key uniqueness
  const existing = await db.narrativeTemplate.findUnique({
    where: { key: parsed.key },
  })
  if (existing) {
    return { success: false, error: `Template key "${parsed.key}" already exists` }
  }

  // 4. Persist
  const created = await db.narrativeTemplate.create({
    data: {
      key: parsed.key,
      name: parsed.name,
      description: parsed.description ?? null,
      kind: parsed.kind,
      stepCount: parsed.stepCount,
      faceAffinities: parsed.faceAffinities,
      questModel: parsed.questModel,
      configBlob: configResult.data as Prisma.InputJsonValue,
      status: parsed.status,
      sortOrder: parsed.sortOrder,
    },
  })

  revalidatePath('/admin')
  return { success: true, data: toRow(created as unknown as Record<string, unknown>) }
}

// ---------------------------------------------------------------------------
// READ (single)
// ---------------------------------------------------------------------------

/**
 * Get a single NarrativeTemplate by ID.
 * Returns null if not found.
 * Requires GM authorization.
 */
export async function getNarrativeTemplate(
  id: string,
): Promise<NarrativeTemplateRow | null> {
  await checkGM()

  const row = await db.narrativeTemplate.findUnique({ where: { id } })
  if (!row) return null

  return toRow(row as unknown as Record<string, unknown>)
}

/**
 * Get a single NarrativeTemplate by unique key.
 * Returns null if not found.
 * Requires GM authorization.
 */
export async function getNarrativeTemplateByKey(
  key: string,
): Promise<NarrativeTemplateRow | null> {
  await checkGM()

  const row = await db.narrativeTemplate.findUnique({ where: { key } })
  if (!row) return null

  return toRow(row as unknown as Record<string, unknown>)
}

// ---------------------------------------------------------------------------
// LIST (with filtering)
// ---------------------------------------------------------------------------

/** Filter options for listing NarrativeTemplates. */
export interface NarrativeTemplateListFilter {
  /** Filter by template kind (EPIPHANY, KOTTER, ORIENTATION, CUSTOM). */
  kind?: NarrativeTemplateKind
  /** Filter by status (active, archived). Default: active only. */
  status?: 'active' | 'archived' | 'all'
  /** Filter to templates with a specific face in faceAffinities. */
  faceAffinity?: string
}

/**
 * List NarrativeTemplates with filtering.
 * Returns lightweight summary projections sorted by sortOrder, then name.
 * Requires GM authorization.
 *
 * Default: returns only active templates. Pass status='all' for everything.
 */
export async function listNarrativeTemplates(
  filter?: NarrativeTemplateListFilter,
): Promise<NarrativeTemplateSummary[]> {
  await checkGM()

  // Build where clause
  const where: Record<string, unknown> = {}

  // Kind filter — validate if provided
  if (filter?.kind) {
    const kindResult = narrativeTemplateKindSchema.safeParse(filter.kind)
    if (kindResult.success) {
      where.kind = kindResult.data
    }
  }

  // Status filter — default to 'active'
  if (filter?.status === 'all') {
    // No status filter — return all
  } else if (filter?.status) {
    const statusResult = templateStatusSchema.safeParse(filter.status)
    if (statusResult.success) {
      where.status = statusResult.data
    }
  } else {
    where.status = 'active'
  }

  const rows = await db.narrativeTemplate.findMany({
    where,
    select: {
      id: true,
      key: true,
      name: true,
      kind: true,
      faceAffinities: true,
      questModel: true,
      stepCount: true,
      status: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  let summaries = rows.map((r) => toSummary(r as unknown as Record<string, unknown>))

  // Post-filter by face affinity (Json array containment — done in app layer
  // since Prisma Json filtering varies by adapter and faceAffinities is a
  // simple array, not a deep nested structure)
  if (filter?.faceAffinity) {
    const targetFace = filter.faceAffinity
    summaries = summaries.filter((s) =>
      s.faceAffinities.includes(targetFace as NarrativeTemplateSummary['faceAffinities'][number]),
    )
  }

  return summaries
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

/**
 * Update an existing NarrativeTemplate by ID.
 * Only provided fields are updated. If configBlob is provided, it is
 * validated against the template's current kind (kind itself is immutable
 * after creation).
 * Requires GM authorization.
 */
export async function updateNarrativeTemplate(
  id: string,
  input: unknown,
): Promise<
  | { success: true; data: NarrativeTemplateRow }
  | { success: false; error: string }
> {
  await checkGM()

  // 1. Validate update input spine
  const inputResult = updateNarrativeTemplateInputSchema.safeParse(input)
  if (!inputResult.success) {
    return {
      success: false,
      error: `Invalid input: ${inputResult.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  const parsed = inputResult.data

  // 2. Fetch existing template to get its kind (immutable)
  const existing = await db.narrativeTemplate.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: `NarrativeTemplate not found: ${id}` }
  }

  // 3. If configBlob is being updated, validate against the existing kind
  let validatedConfigBlob: Prisma.InputJsonValue | undefined
  if (parsed.configBlob !== undefined) {
    const configResult = parseConfigBlob(
      existing.kind as Parameters<typeof parseConfigBlob>[0],
      parsed.configBlob,
    )
    if (!configResult.success) {
      return {
        success: false,
        error: `Invalid configBlob for kind "${existing.kind}": ${configResult.error.issues.map((i) => i.message).join(', ')}`,
      }
    }
    validatedConfigBlob = configResult.data as Prisma.InputJsonValue
  }

  // 4. Build update data — only include provided fields
  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.description !== undefined) updateData.description = parsed.description
  if (parsed.stepCount !== undefined) updateData.stepCount = parsed.stepCount
  if (parsed.faceAffinities !== undefined) updateData.faceAffinities = parsed.faceAffinities
  if (parsed.questModel !== undefined) updateData.questModel = parsed.questModel
  if (validatedConfigBlob !== undefined) updateData.configBlob = validatedConfigBlob
  if (parsed.status !== undefined) updateData.status = parsed.status
  if (parsed.sortOrder !== undefined) updateData.sortOrder = parsed.sortOrder

  // 5. Persist
  const updated = await db.narrativeTemplate.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/admin')
  return { success: true, data: toRow(updated as unknown as Record<string, unknown>) }
}

// ---------------------------------------------------------------------------
// SOFT-DELETE (archive)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a NarrativeTemplate by setting its status to 'archived'.
 * Does not physically remove the row — archived templates are excluded from
 * default list queries but remain queryable with status='archived' or 'all'.
 * Requires GM authorization.
 */
export async function archiveNarrativeTemplate(
  id: string,
): Promise<
  | { success: true; data: NarrativeTemplateRow }
  | { success: false; error: string }
> {
  await checkGM()

  const existing = await db.narrativeTemplate.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: `NarrativeTemplate not found: ${id}` }
  }

  if (existing.status === 'archived') {
    return { success: false, error: 'Template is already archived' }
  }

  const updated = await db.narrativeTemplate.update({
    where: { id },
    data: { status: 'archived' },
  })

  revalidatePath('/admin')
  return { success: true, data: toRow(updated as unknown as Record<string, unknown>) }
}

/**
 * Restore an archived NarrativeTemplate back to 'active' status.
 * Requires GM authorization.
 */
export async function restoreNarrativeTemplate(
  id: string,
): Promise<
  | { success: true; data: NarrativeTemplateRow }
  | { success: false; error: string }
> {
  await checkGM()

  const existing = await db.narrativeTemplate.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: `NarrativeTemplate not found: ${id}` }
  }

  if (existing.status === 'active') {
    return { success: false, error: 'Template is already active' }
  }

  const updated = await db.narrativeTemplate.update({
    where: { id },
    data: { status: 'active' },
  })

  revalidatePath('/admin')
  return { success: true, data: toRow(updated as unknown as Record<string, unknown>) }
}
