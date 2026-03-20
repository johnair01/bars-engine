'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveDaemonMoves } from '@/actions/daemons'
import { getAppConfig } from '@/actions/config'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types (MVP schemas stored in DB as JSON strings)
// ---------------------------------------------------------------------------

type RequirementsFieldType = 'string' | 'player_id'

type RequirementsSchemaV1 = {
  version: 1
  fields: Array<{
    key: string
    label?: string
    type: RequirementsFieldType
    required?: boolean
    minLength?: number
    maxLength?: number
  }>
}

type EffectsSchemaV1 = {
  version: 1
  setQuestStatus?: string
  barKind?: 'clarity' | 'prestige' | 'framework'
}

export type NationMovePanelData =
  | { success: true; quest: { id: string; title: string; status: string; isSystem: boolean }; nation: { id: string; name: string }; moves: Array<{ id: string; key: string; name: string; description: string; unlocked: boolean; applicable: boolean; appliesToStatus: string[]; requirements: RequirementsSchemaV1; effects: EffectsSchemaV1 }>; collaborators: Array<{ id: string; name: string }>; canMoveToGraveyard: boolean }
  | { error: string }

export type ApplyNationMoveState =
  | { ok: true; questId: string; barId: string; barTitle: string; questStatus: string; moveKey: string }
  | { ok?: false; error: string }

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function userSafeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021' || error.code === 'P2022') {
      return 'Database schema is not updated yet. Run Prisma db push, then retry.'
    }
  }
  return error instanceof Error ? (error.message || 'Unknown error') : 'Unknown error'
}

// ---------------------------------------------------------------------------
// Book extraction / library: metal nation anchor for NationMove rows
// ---------------------------------------------------------------------------

/**
 * Resolve the canonical **metal** nation (Argyra) for book-derived moves and pools.
 * Does not mutate; callers use returned `id` as `NationMove.nationId`.
 */
export async function ensureMetalNationMoves(): Promise<{ id: string }> {
  const byElement = await db.nation.findFirst({
    where: { element: 'metal', archived: false },
    select: { id: true },
  })
  if (byElement) return byElement
  const byName = await db.nation.findFirst({
    where: { name: 'Argyra', archived: false },
    select: { id: true },
  })
  if (byName) return byName
  throw new Error(
    'ensureMetalNationMoves: no metal nation found — seed nations (expect Argyra / element metal)'
  )
}

// ---------------------------------------------------------------------------
// Read: available moves for quest (UI helper)
// ---------------------------------------------------------------------------

export async function getNationMovePanelData(questId: string): Promise<NationMovePanelData> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    if (!player.nationId) return { error: 'Profile incomplete: nation missing' }

    const quest = await db.customBar.findUnique({
      where: { id: questId },
      select: {
        id: true,
        title: true,
        status: true,
        isSystem: true,
        creatorId: true,
        claimedById: true,
      }
    })

    if (!quest) return { error: 'Quest not found' }

    const hasDirectAccess = quest.creatorId === player.id || quest.claimedById === player.id

    let hasAssignment = false
    if (!hasDirectAccess) {
      const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId } },
        select: { status: true }
      })
      hasAssignment = pq?.status === 'assigned'
    }

    if (!hasDirectAccess && !hasAssignment) {
      return { error: 'Not authorized to modify this quest' }
    }

    const nation = await db.nation.findUnique({
      where: { id: player.nationId },
      select: { id: true, name: true }
    })
    if (!nation) return { error: 'Nation not found' }

    let moves = await db.nationMove.findMany({
      where: {
        OR: [
          { nationId: player.nationId },
          ...(player.archetypeId ? [{ archetypeId: player.archetypeId }] : []),
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isStartingUnlocked: true,
        appliesToStatus: true,
        requirementsSchema: true,
        effectsSchema: true,
      }
    })

    // Campaign move pool: when active instance has moveIds, filter to that pool
    const config = await getAppConfig()
    const activeInstanceId = (config as { activeInstanceId?: string | null }).activeInstanceId
    if (activeInstanceId) {
      const instance = await db.instance.findUnique({
        where: { id: activeInstanceId },
        select: { moveIds: true },
      })
      const poolIds = instance?.moveIds ? (safeParseJson<string[]>(instance.moveIds, []) as string[]) : []
      if (poolIds.length > 0) {
        const poolSet = new Set(poolIds)
        moves = moves.filter((m) => poolSet.has(m.id))
      }
    }

    const unlockedRows = await db.playerNationMoveUnlock.findMany({
      where: {
        playerId: player.id,
        moveId: { in: moves.map((m) => m.id) }
      },
      select: { moveId: true }
    })
    const unlockedSet = new Set(unlockedRows.map((r) => r.moveId))

    const collaborators = await db.player.findMany({
      where: { id: { not: player.id } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    })

    const mapped = moves.map((m) => {
      const applies = safeParseJson<string[]>(m.appliesToStatus, [])
      const requirements = safeParseJson<RequirementsSchemaV1>(m.requirementsSchema, { version: 1, fields: [] })
      const effects = safeParseJson<EffectsSchemaV1>(m.effectsSchema, { version: 1 })
      const unlocked = m.isStartingUnlocked || unlockedSet.has(m.id)
      const applicable = applies.length === 0 ? true : applies.includes(quest.status)

      return {
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        unlocked,
        applicable,
        appliesToStatus: applies,
        requirements,
        effects,
      }
    })

    // Add daemon moves when summoned
    const daemonMoves = await getActiveDaemonMoves(player.id)
    const existingIds = new Set(mapped.map((m) => m.id))
    for (const pm of daemonMoves) {
      if (existingIds.has(pm.id)) continue
      const applies = safeParseJson<string[]>(pm.appliesToStatus, [])
      const requirements = safeParseJson<RequirementsSchemaV1>(pm.requirementsSchema, { version: 1, fields: [] })
      const effects = safeParseJson<EffectsSchemaV1>(pm.effectsSchema, { version: 1 })
      mapped.push({
        id: pm.id,
        key: pm.key,
        name: pm.name,
        description: pm.description,
        unlocked: true,
        applicable: applies.length === 0 ? true : applies.includes(quest.status),
        appliesToStatus: applies,
        requirements,
        effects,
      })
    }

    return {
      success: true,
      quest: {
        id: quest.id,
        title: quest.title,
        status: quest.status,
        isSystem: quest.isSystem,
      },
      nation,
      moves: mapped,
      collaborators,
      canMoveToGraveyard: !quest.isSystem,
    }
  } catch (error) {
    console.error('[nation-moves] getNationMovePanelData failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// Write: move quest to graveyard (DORMANT)
// ---------------------------------------------------------------------------

export async function moveQuestToGraveyard(questId: string, confirmCostPaid: boolean): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    if (!confirmCostPaid) {
      return { error: 'Missing confirm_cost_paid flag' }
    }

    const quest = await db.customBar.findUnique({
      where: { id: questId },
      select: { id: true, isSystem: true, creatorId: true, claimedById: true, status: true, title: true }
    })
    if (!quest) return { error: 'Quest not found' }
    if (quest.isSystem) return { error: 'System quests cannot be moved to graveyard' }

    const hasAccess = quest.creatorId === player.id || quest.claimedById === player.id
    if (!hasAccess) {
      const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId } },
        select: { status: true }
      })
      if (pq?.status !== 'assigned') return { error: 'Not authorized to modify this quest' }
    }

    await db.$transaction(async (tx) => {
      await tx.customBar.update({
        where: { id: questId },
        data: { status: 'dormant' }
      })

      // Remove any active assignments so it disappears from active loops.
      await tx.playerQuest.deleteMany({
        where: { questId, status: 'assigned' }
      })

      await tx.auditLog.create({
        data: {
          actorAdminId: player.id,
          action: 'MOVE_TO_GRAVEYARD',
          targetType: 'quest',
          targetId: questId,
          payloadJson: JSON.stringify({ questTitle: quest.title, fromStatus: quest.status, toStatus: 'dormant' })
        }
      })
    })

    revalidatePath('/')
    revalidatePath('/bars/available')
    revalidatePath('/hand')
    return { success: true }
  } catch (error) {
    console.error('[nation-moves] moveQuestToGraveyard failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// Write: apply nation move to quest
// ---------------------------------------------------------------------------

function validateAgainstRequirements(
  schema: RequirementsSchemaV1,
  raw: Record<string, string>
): { ok: true; inputs: Record<string, string> } | { ok: false; error: string } {
  for (const field of schema.fields) {
    const value = (raw[field.key] ?? '').toString()
    const required = field.required !== false
    if (required && !value.trim()) {
      return { ok: false, error: `Missing required field: ${field.label || field.key}` }
    }
    if (field.type === 'string') {
      const trimmed = value.trim()
      if (required && !trimmed) return { ok: false, error: `Missing required field: ${field.label || field.key}` }
      if (field.minLength != null && trimmed.length > 0 && trimmed.length < field.minLength) {
        return { ok: false, error: `${field.label || field.key} must be at least ${field.minLength} characters` }
      }
      if (field.maxLength != null && trimmed.length > field.maxLength) {
        return { ok: false, error: `${field.label || field.key} must be at most ${field.maxLength} characters` }
      }
    }
    if (field.type === 'player_id') {
      // Validation against DB happens in the main apply function.
      continue
    }
  }
  return { ok: true, inputs: raw }
}

function buildBarFromMove(opts: {
  questTitle: string
  questDescription: string
  moveName: string
  effects: EffectsSchemaV1
  inputs: Record<string, string>
  collaboratorName?: string | null
}) {
  const kind = opts.effects.barKind || 'framework'

  const titlePrefix = kind === 'clarity'
    ? 'Clarity BAR'
    : kind === 'prestige'
      ? 'Prestige BAR'
      : 'Framework BAR'

  const lines: string[] = []
  lines.push(`${opts.moveName} -> ${titlePrefix}`)
  lines.push('')
  lines.push(`Quest: ${opts.questTitle}`)
  lines.push('')
  if (opts.questDescription) {
    lines.push('Original prompt:')
    lines.push(opts.questDescription)
    lines.push('')
  }

  if (opts.inputs.objectiveRewrite) {
    lines.push('Objective rewrite:')
    lines.push(opts.inputs.objectiveRewrite)
    lines.push('')
  }

  if (opts.inputs.collaboratorId) {
    lines.push(`Collaborator: ${opts.collaboratorName || opts.inputs.collaboratorId}`)
    lines.push('')
  }

  return {
    title: `${titlePrefix}: ${opts.questTitle}`,
    description: lines.join('\n'),
    kind,
  }
}

export async function applyNationMoveWithState(_prev: ApplyNationMoveState | null, formData: FormData): Promise<ApplyNationMoveState> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    if (!player.nationId) return { error: 'Profile incomplete: nation missing' }

    const questId = (formData.get('questId') as string | null)?.trim() || ''
    const moveKey = (formData.get('moveKey') as string | null)?.trim() || ''

    if (!questId) return { error: 'Missing questId' }
    if (!moveKey) return { error: 'Missing moveKey' }

    const quest = await db.customBar.findUnique({
      where: { id: questId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        isSystem: true,
        creatorId: true,
        claimedById: true,
      }
    })
    if (!quest) return { error: 'Quest not found' }
    if (quest.isSystem) return { error: 'System quests cannot receive nation moves' }

    // Access: creator, claimer, or assigned
    const hasDirectAccess = quest.creatorId === player.id || quest.claimedById === player.id
    if (!hasDirectAccess) {
      const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId } },
        select: { status: true }
      })
      if (pq?.status !== 'assigned') return { error: 'Not authorized to modify this quest' }
    }

    const move = await db.nationMove.findUnique({
      where: { key: moveKey },
      select: {
        id: true,
        key: true,
        name: true,
        nationId: true,
        isStartingUnlocked: true,
        appliesToStatus: true,
        requirementsSchema: true,
        effectsSchema: true,
      }
    })
    if (!move) return { error: 'Unknown move' }

    const inNation = move.nationId === player.nationId
    const inArchetype = !!player.archetypeId && (move as { archetypeId?: string | null }).archetypeId === player.archetypeId
    if (!inNation && !inArchetype) {
      return { error: 'Player is not aligned with this nation move' }
    }

    if (!move.isStartingUnlocked) {
      const unlock = await db.playerNationMoveUnlock.findUnique({
        where: { playerId_moveId: { playerId: player.id, moveId: move.id } },
        select: { id: true }
      })
      if (!unlock) return { error: 'Move is locked for this player' }
    }

    const applies = safeParseJson<string[]>(move.appliesToStatus, [])
    if (applies.length > 0 && !applies.includes(quest.status)) {
      return { error: `Move cannot be applied when quest status is "${quest.status}"` }
    }

    const requirements = safeParseJson<RequirementsSchemaV1>(move.requirementsSchema, { version: 1, fields: [] })
    const effects = safeParseJson<EffectsSchemaV1>(move.effectsSchema, { version: 1 })

    // Collect only fields described by schema (MVP).
    const rawInputs: Record<string, string> = {}
    for (const f of requirements.fields) {
      rawInputs[f.key] = ((formData.get(f.key) as string | null) || '').trim()
    }

    const validated = validateAgainstRequirements(requirements, rawInputs)
    if (!validated.ok) return { error: validated.error }

    let collaboratorName: string | null = null
    if (validated.inputs.collaboratorId) {
      const collaborator = await db.player.findUnique({
        where: { id: validated.inputs.collaboratorId },
        select: { id: true, name: true }
      })
      if (!collaborator) return { error: 'Collaborator not found' }
      if (collaborator.id === player.id) return { error: 'Collaborator cannot be yourself' }
      collaboratorName = collaborator.name
    }

    const barTemplate = buildBarFromMove({
      questTitle: quest.title,
      questDescription: quest.description,
      moveName: move.name,
      effects,
      inputs: validated.inputs,
      collaboratorName,
    })

    const result = await db.$transaction(async (tx) => {
      // Apply lightweight effects
      let updatedQuestStatus: string | null = null
      if (effects.setQuestStatus) {
        updatedQuestStatus = effects.setQuestStatus
        await tx.customBar.update({
          where: { id: questId },
          data: { status: updatedQuestStatus }
        })
      }

      // Create BAR instance (CustomBar of type "bar") attached to quest via parentId.
      const bar = await tx.customBar.create({
        data: {
          creatorId: player.id,
          title: barTemplate.title,
          description: barTemplate.description,
          type: 'bar',
          reward: 0,
          visibility: 'private',
          status: 'active',
          storyContent: `nation_move:${move.key},bar_kind:${barTemplate.kind}`,
          inputs: '[]',
          parentId: questId,
          rootId: 'temp',
        }
      })

      await tx.customBar.update({
        where: { id: bar.id },
        data: { rootId: bar.id }
      })

      // Log move
      await tx.questMoveLog.create({
        data: {
          questId,
          moveId: move.id,
          playerId: player.id,
          createdBarId: bar.id,
          inputsJson: JSON.stringify(validated.inputs),
          effectsJson: JSON.stringify(effects),
        }
      })

      // If this move re-activated a dormant quest, re-attach it to the player's active loop.
      if (quest.status === 'dormant' && updatedQuestStatus === 'active') {
        await tx.playerQuest.upsert({
          where: { playerId_questId: { playerId: player.id, questId } },
          update: { status: 'assigned', assignedAt: new Date(), completedAt: null },
          create: { playerId: player.id, questId, status: 'assigned', assignedAt: new Date() }
        })

        await tx.customBar.update({
          where: { id: questId },
          data: { claimedById: player.id }
        })
      }

      return { barId: bar.id }
    })

    revalidatePath('/')
    revalidatePath('/bars')
    revalidatePath('/bars/available')
    revalidatePath('/hand')

    return {
      ok: true,
      questId,
      questStatus: (effects.setQuestStatus || quest.status),
      barId: result.barId,
      barTitle: barTemplate.title,
      moveKey
    }
  } catch (error) {
    console.error('[nation-moves] applyNationMoveWithState failed:', error)
    return { error: userSafeError(error) }
  }
}

