'use server'

/**
 * Campaign Quest Template Server Actions — CRUD + Filtering + Duplication
 *
 * Provides the data layer for the L1 campaign wizard's quest template
 * selection and customization workflow.
 *
 * Auth model:
 *  - Listing/reading templates: any authenticated user (templates are public config)
 *  - Creating/updating/deleting/duplicating: admin only (templates are system resources)
 *  - Applying templates to campaigns: Steward+ on the campaign's instance
 *
 * Pattern: follows campaign-crud.ts auth helpers and ActionResult convention.
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Auth helpers (shared pattern with campaign-crud.ts)
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  return !!row
}

async function isStewardPlusForInstance(
  playerId: string,
  instanceId: string
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true
  const membership = await db.instanceMembership.findUnique({
    where: { instanceId_playerId: { instanceId, playerId } },
  })
  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; message: string }
  | { error: string }

export type QuestTemplateListItem = {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  defaultSettings: unknown
  copyTemplate: unknown
  narrativeHooks: unknown
  status: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type QuestTemplateDetail = QuestTemplateListItem

export type CreateQuestTemplateInput = {
  key: string
  name: string
  description?: string
  category: string
  defaultSettings?: Record<string, unknown>
  copyTemplate?: Record<string, unknown>
  narrativeHooks?: Record<string, unknown>
  sortOrder?: number
}

export type UpdateQuestTemplateInput = Partial<Omit<CreateQuestTemplateInput, 'key'>>

export type DuplicateQuestTemplateInput = {
  /** ID of the template to duplicate */
  sourceTemplateId: string
  /** New unique key for the duplicated template */
  newKey: string
  /** New display name */
  newName?: string
  /** Override settings on the copy */
  settingsOverrides?: Record<string, unknown>
  /** Override copy template fields */
  copyTemplateOverrides?: Record<string, unknown>
  /** Override category */
  category?: string
}

export type ListQuestTemplatesFilter = {
  /** Filter by category */
  category?: string
  /** Filter by status (default: "active") */
  status?: string
  /** Search by name (case-insensitive contains) */
  search?: string
}

// ---------------------------------------------------------------------------
// SELECT clause (reusable)
// ---------------------------------------------------------------------------

const TEMPLATE_SELECT = {
  id: true,
  key: true,
  name: true,
  description: true,
  category: true,
  defaultSettings: true,
  copyTemplate: true,
  narrativeHooks: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const

// ---------------------------------------------------------------------------
// List / Filter Quest Templates (authenticated users)
// ---------------------------------------------------------------------------

/**
 * List quest templates with optional filtering.
 * Available to any authenticated user — templates are public configuration.
 * Defaults to active templates, sorted by category then sortOrder.
 */
export async function listQuestTemplates(
  filter?: ListQuestTemplatesFilter
): Promise<QuestTemplateListItem[]> {
  const playerId = await getPlayerId()
  if (!playerId) return []

  const where: Prisma.QuestTemplateWhereInput = {
    status: filter?.status ?? 'active',
  }

  if (filter?.category) {
    where.category = filter.category
  }

  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
      { key: { contains: filter.search, mode: 'insensitive' } },
    ]
  }

  return db.questTemplate.findMany({
    where,
    select: TEMPLATE_SELECT,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })
}

/**
 * List templates grouped by category.
 * Returns a map of category → templates[], ordered by sortOrder.
 */
export async function listQuestTemplatesByCategory(
  filter?: Omit<ListQuestTemplatesFilter, 'category'>
): Promise<Record<string, QuestTemplateListItem[]>> {
  const templates = await listQuestTemplates(filter)

  const grouped: Record<string, QuestTemplateListItem[]> = {}
  for (const template of templates) {
    if (!grouped[template.category]) {
      grouped[template.category] = []
    }
    grouped[template.category].push(template)
  }

  return grouped
}

// ---------------------------------------------------------------------------
// Get single Quest Template
// ---------------------------------------------------------------------------

/**
 * Get a single quest template by ID or key.
 * Available to any authenticated user.
 */
export async function getQuestTemplate(
  idOrKey: string
): Promise<{ template: QuestTemplateDetail } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const template = await db.questTemplate.findFirst({
    where: {
      OR: [{ id: idOrKey }, { key: idOrKey }],
    },
    select: TEMPLATE_SELECT,
  })

  if (!template) return { error: 'Quest template not found' }

  return { template }
}

// ---------------------------------------------------------------------------
// Create Quest Template (admin only)
// ---------------------------------------------------------------------------

/**
 * Create a new quest template. Admin only — templates are system resources.
 */
export async function createQuestTemplate(
  input: CreateQuestTemplateInput
): Promise<{ success: true; templateId: string; key: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const admin = await isGlobalAdmin(playerId)
  if (!admin) return { error: 'Not authorized — admin role required' }

  // Validate required fields
  if (!input.key?.trim()) return { error: 'Template key is required' }
  if (!input.name?.trim()) return { error: 'Template name is required' }
  if (!input.category?.trim()) return { error: 'Template category is required' }

  // Sanitize key: lowercase, alphanumeric + hyphens
  const key = input.key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!key) return { error: 'Invalid key — must contain at least one alphanumeric character' }

  // Check key uniqueness
  const existing = await db.questTemplate.findUnique({
    where: { key },
    select: { id: true },
  })
  if (existing) return { error: `A template with key "${key}" already exists` }

  const template = await db.questTemplate.create({
    data: {
      key,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category.trim(),
      defaultSettings: (input.defaultSettings ?? {}) as Prisma.InputJsonValue,
      copyTemplate: (input.copyTemplate ?? {}) as Prisma.InputJsonValue,
      narrativeHooks: input.narrativeHooks
        ? (input.narrativeHooks as Prisma.InputJsonValue)
        : undefined,
      sortOrder: input.sortOrder ?? 0,
      status: 'active',
    },
  })

  revalidatePath('/admin/campaigns')

  return { success: true, templateId: template.id, key: template.key }
}

// ---------------------------------------------------------------------------
// Update Quest Template (admin only)
// ---------------------------------------------------------------------------

/**
 * Update an existing quest template. Admin only.
 * Partial update — only passed fields are modified.
 */
export async function updateQuestTemplate(
  templateId: string,
  input: UpdateQuestTemplateInput
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const admin = await isGlobalAdmin(playerId)
  if (!admin) return { error: 'Not authorized — admin role required' }

  const existing = await db.questTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  })
  if (!existing) return { error: 'Quest template not found' }

  // Build update data — only include explicitly passed fields
  const data: Prisma.QuestTemplateUpdateInput = {}

  if (input.name !== undefined) data.name = input.name.trim()
  if (input.description !== undefined) data.description = input.description?.trim() || null
  if (input.category !== undefined) data.category = input.category.trim()
  if (input.defaultSettings !== undefined) {
    data.defaultSettings = input.defaultSettings as Prisma.InputJsonValue
  }
  if (input.copyTemplate !== undefined) {
    data.copyTemplate = input.copyTemplate as Prisma.InputJsonValue
  }
  if (input.narrativeHooks !== undefined) {
    data.narrativeHooks = input.narrativeHooks
      ? (input.narrativeHooks as Prisma.InputJsonValue)
      : Prisma.DbNull
  }
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder

  if (Object.keys(data).length === 0) {
    return { error: 'No fields to update' }
  }

  await db.questTemplate.update({
    where: { id: templateId },
    data,
  })

  revalidatePath('/admin/campaigns')

  return { success: true, message: 'Quest template updated' }
}

// ---------------------------------------------------------------------------
// Archive Quest Template (admin only — soft delete)
// ---------------------------------------------------------------------------

/**
 * Archive a quest template (soft delete). Admin only.
 * Archived templates remain in the DB but are excluded from active listings.
 */
export async function archiveQuestTemplate(
  templateId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const admin = await isGlobalAdmin(playerId)
  if (!admin) return { error: 'Not authorized — admin role required' }

  const existing = await db.questTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true },
  })
  if (!existing) return { error: 'Quest template not found' }
  if (existing.status === 'archived') return { error: 'Template is already archived' }

  await db.questTemplate.update({
    where: { id: templateId },
    data: { status: 'archived' },
  })

  revalidatePath('/admin/campaigns')

  return { success: true, message: 'Quest template archived' }
}

/**
 * Restore an archived quest template. Admin only.
 */
export async function restoreQuestTemplate(
  templateId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const admin = await isGlobalAdmin(playerId)
  if (!admin) return { error: 'Not authorized — admin role required' }

  const existing = await db.questTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true },
  })
  if (!existing) return { error: 'Quest template not found' }
  if (existing.status === 'active') return { error: 'Template is already active' }

  await db.questTemplate.update({
    where: { id: templateId },
    data: { status: 'active' },
  })

  revalidatePath('/admin/campaigns')

  return { success: true, message: 'Quest template restored' }
}

// ---------------------------------------------------------------------------
// Duplicate Quest Template (admin only)
// ---------------------------------------------------------------------------

/**
 * Duplicate a quest template with optional overrides.
 *
 * Creates a new template by cloning the source template's settings and
 * copyTemplate, applying any provided overrides. This is the "template+customize"
 * pattern from the spec: configuration tool, not authoring tool.
 *
 * Admin only — creates a new system-level template.
 */
export async function duplicateQuestTemplate(
  input: DuplicateQuestTemplateInput
): Promise<{ success: true; templateId: string; key: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const admin = await isGlobalAdmin(playerId)
  if (!admin) return { error: 'Not authorized — admin role required' }

  // Validate new key
  if (!input.newKey?.trim()) return { error: 'New template key is required' }

  const newKey = input.newKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!newKey) return { error: 'Invalid key — must contain at least one alphanumeric character' }

  // Check key uniqueness
  const keyExists = await db.questTemplate.findUnique({
    where: { key: newKey },
    select: { id: true },
  })
  if (keyExists) return { error: `A template with key "${newKey}" already exists` }

  // Fetch source template
  const source = await db.questTemplate.findUnique({
    where: { id: input.sourceTemplateId },
    select: TEMPLATE_SELECT,
  })
  if (!source) return { error: 'Source template not found' }

  // Merge settings with overrides
  const mergedSettings = {
    ...(source.defaultSettings as Record<string, unknown>),
    ...(input.settingsOverrides ?? {}),
  }

  const mergedCopyTemplate = {
    ...(source.copyTemplate as Record<string, unknown>),
    ...(input.copyTemplateOverrides ?? {}),
  }

  const template = await db.questTemplate.create({
    data: {
      key: newKey,
      name: input.newName?.trim() || `${source.name} (Copy)`,
      description: source.description,
      category: input.category?.trim() || source.category,
      defaultSettings: mergedSettings as Prisma.InputJsonValue,
      copyTemplate: mergedCopyTemplate as Prisma.InputJsonValue,
      narrativeHooks: source.narrativeHooks ?? undefined,
      sortOrder: source.sortOrder + 1,
      status: 'active',
    },
  })

  revalidatePath('/admin/campaigns')

  return { success: true, templateId: template.id, key: template.key }
}

// ---------------------------------------------------------------------------
// Apply Template to Campaign (Steward+)
// ---------------------------------------------------------------------------

/**
 * Clone a quest template's copyTemplate into a campaign's questTemplateConfig.
 *
 * This is the Steward-facing action: select a template, optionally customize
 * the copy, and add it to the campaign's quest lineup.
 *
 * Requires Steward+ on the campaign's instance.
 * Campaign must be in DRAFT or REJECTED status (editable).
 */
export type ApplyTemplateInput = {
  /** Campaign to apply the template to */
  campaignId: string
  /** Template to apply (ID or key) */
  templateIdOrKey: string
  /** Optional copy overrides (title, description, etc.) */
  copyOverrides?: Record<string, unknown>
  /** Optional settings overrides (moveType, reward, etc.) */
  settingsOverrides?: Record<string, unknown>
}

export async function applyTemplateToCampaign(
  input: ApplyTemplateInput
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  // Fetch campaign
  const campaign = await db.campaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, instanceId: true, status: true, questTemplateConfig: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // Steward+ guard
  const allowed = await isStewardPlusForInstance(playerId, campaign.instanceId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  // Editable status guard
  const editableStatuses = ['DRAFT', 'REJECTED']
  if (!editableStatuses.includes(campaign.status)) {
    return { error: `Cannot modify quests on a ${campaign.status} campaign` }
  }

  // Fetch template
  const template = await db.questTemplate.findFirst({
    where: {
      OR: [{ id: input.templateIdOrKey }, { key: input.templateIdOrKey }],
      status: 'active',
    },
    select: {
      key: true,
      name: true,
      copyTemplate: true,
      defaultSettings: true,
    },
  })
  if (!template) return { error: 'Quest template not found or archived' }

  // Build quest config entry by cloning template + applying overrides
  const questEntry = {
    templateKey: template.key,
    templateName: template.name,
    settings: {
      ...(template.defaultSettings as Record<string, unknown>),
      ...(input.settingsOverrides ?? {}),
    },
    copy: {
      ...(template.copyTemplate as Record<string, unknown>),
      ...(input.copyOverrides ?? {}),
    },
    addedAt: new Date().toISOString(),
    addedBy: playerId,
  }

  // Append to existing questTemplateConfig array (or create new array)
  const existingConfig = Array.isArray(campaign.questTemplateConfig)
    ? (campaign.questTemplateConfig as Record<string, unknown>[])
    : []

  const updatedConfig = [...existingConfig, questEntry]

  await db.campaign.update({
    where: { id: input.campaignId },
    data: {
      questTemplateConfig: updatedConfig as unknown as Prisma.InputJsonValue,
    },
  })

  revalidatePath('/campaigns')
  revalidatePath('/admin/campaigns')

  return { success: true, message: `Quest "${template.name}" added to campaign` }
}

/**
 * Remove a quest from a campaign's questTemplateConfig by index.
 * Steward+ on the campaign's instance, campaign must be editable.
 */
export async function removeQuestFromCampaign(
  campaignId: string,
  questIndex: number
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, instanceId: true, status: true, questTemplateConfig: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  const allowed = await isStewardPlusForInstance(playerId, campaign.instanceId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  const editableStatuses = ['DRAFT', 'REJECTED']
  if (!editableStatuses.includes(campaign.status)) {
    return { error: `Cannot modify quests on a ${campaign.status} campaign` }
  }

  const existingConfig = Array.isArray(campaign.questTemplateConfig)
    ? (campaign.questTemplateConfig as Record<string, unknown>[])
    : []

  if (questIndex < 0 || questIndex >= existingConfig.length) {
    return { error: 'Invalid quest index' }
  }

  const updatedConfig = existingConfig.filter((_, i) => i !== questIndex)

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      questTemplateConfig: updatedConfig as unknown as Prisma.InputJsonValue,
    },
  })

  revalidatePath('/campaigns')
  revalidatePath('/admin/campaigns')

  return { success: true, message: 'Quest removed from campaign' }
}

/**
 * Reorder quests in a campaign's questTemplateConfig.
 * Steward+ on the campaign's instance, campaign must be editable.
 */
export async function reorderCampaignQuests(
  campaignId: string,
  newOrder: number[]
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, instanceId: true, status: true, questTemplateConfig: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  const allowed = await isStewardPlusForInstance(playerId, campaign.instanceId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  const editableStatuses = ['DRAFT', 'REJECTED']
  if (!editableStatuses.includes(campaign.status)) {
    return { error: `Cannot modify quests on a ${campaign.status} campaign` }
  }

  const existingConfig = Array.isArray(campaign.questTemplateConfig)
    ? (campaign.questTemplateConfig as Record<string, unknown>[])
    : []

  // Validate newOrder is a permutation of [0..n-1]
  if (newOrder.length !== existingConfig.length) {
    return { error: 'Order array length must match number of quests' }
  }
  const sorted = [...newOrder].sort((a, b) => a - b)
  const expected = existingConfig.map((_, i) => i)
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    return { error: 'Order array must be a valid permutation of quest indices' }
  }

  const reordered = newOrder.map((oldIndex) => existingConfig[oldIndex])

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      questTemplateConfig: reordered as unknown as Prisma.InputJsonValue,
    },
  })

  revalidatePath('/campaigns')
  revalidatePath('/admin/campaigns')

  return { success: true, message: 'Campaign quests reordered' }
}
