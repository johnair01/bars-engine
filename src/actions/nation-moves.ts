'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
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
  | { success: true; quest: { id: string; title: string; status: string; isSystem: boolean }; nation: { id: string; name: string }; moves: Array<{ key: string; name: string; description: string; unlocked: boolean; applicable: boolean; appliesToStatus: string[]; requirements: RequirementsSchemaV1; effects: EffectsSchemaV1 }>; collaborators: Array<{ id: string; name: string }>; canMoveToGraveyard: boolean }
  | { error: string }

export type ApplyNationMoveState =
  | { ok: true; questId: string; barId: string; moveKey: string }
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
// Metal Nation MVP content (idempotent upsert)
// ---------------------------------------------------------------------------

const METAL_NATION_NAME = 'Metal'

async function ensureMetalNationMoves() {
  // Note: this is safe to call on every request. It only upserts.
  const metalNation = await db.nation.upsert({
    where: { name: METAL_NATION_NAME },
    update: {
      description: 'Metal Nation. Standards, craft, clarity, recycling.'
    },
    create: {
      name: METAL_NATION_NAME,
      description: 'Metal Nation. Standards, craft, clarity, recycling.',
      wakeUp: 'Call the Standard: Define the clarity BAR for what "good" means.',
      cleanUp: 'Cut the Noise: Remove distraction and return to signal.',
      growUp: 'Forge a Template: Turn craft into reusable form.',
      showUp: 'Highlight the Craft: Name the prestige BAR and deliver it.'
    }
  })

  const [clarity, prestige, framework] = await Promise.all([
    db.polarity.upsert({
      where: { key: 'clarity' },
      update: { name: 'Clarity', icon: 'compass' },
      create: { key: 'clarity', name: 'Clarity', description: 'Reduce ambiguity into a standard.', icon: 'compass' }
    }),
    db.polarity.upsert({
      where: { key: 'prestige' },
      update: { name: 'Prestige', icon: 'medal' },
      create: { key: 'prestige', name: 'Prestige', description: 'Highlight craft and raise the bar.', icon: 'medal' }
    }),
    db.polarity.upsert({
      where: { key: 'framework' },
      update: { name: 'Framework', icon: 'tools' },
      create: { key: 'framework', name: 'Framework', description: 'Turn lessons into reusable templates.', icon: 'tools' }
    })
  ])

  const emptyReq: RequirementsSchemaV1 = { version: 1, fields: [] }

  const reforgeReq: RequirementsSchemaV1 = {
    version: 1,
    fields: [
      { key: 'objectiveRewrite', label: 'Objective rewrite', type: 'string', required: true, minLength: 3, maxLength: 500 },
      { key: 'collaboratorId', label: 'Collaborator', type: 'player_id', required: true },
    ]
  }

  const moves: Array<{
    key: string
    name: string
    description: string
    isStartingUnlocked: boolean
    appliesToStatus: string[]
    requirementsSchema: RequirementsSchemaV1
    effectsSchema: EffectsSchemaV1
    polarityId: string
    sortOrder: number
  }> = [
    {
      key: 'metal_call_the_standard',
      name: 'Call the Standard',
      description: 'Generate a Clarity BAR: define the standard and reduce ambiguity.',
      isStartingUnlocked: true,
      appliesToStatus: ['active'],
      requirementsSchema: emptyReq,
      effectsSchema: { version: 1, barKind: 'clarity' },
      polarityId: clarity.id,
      sortOrder: 10,
    },
    {
      key: 'metal_highlight_the_craft',
      name: 'Highlight the Craft',
      description: 'Generate a Prestige BAR: spotlight the craft and raise the bar.',
      isStartingUnlocked: true,
      appliesToStatus: ['active'],
      requirementsSchema: emptyReq,
      effectsSchema: { version: 1, barKind: 'prestige' },
      polarityId: prestige.id,
      sortOrder: 20,
    },
    {
      key: 'metal_forge_a_template',
      name: 'Forge a Template',
      description: 'Generate a Framework BAR: turn craft into reusable template. (Locked by default in MVP.)',
      isStartingUnlocked: false,
      appliesToStatus: ['active'],
      requirementsSchema: emptyReq,
      effectsSchema: { version: 1, barKind: 'framework' },
      polarityId: framework.id,
      sortOrder: 30,
    },
    {
      key: 'metal_reforge_the_relic',
      name: 'Reforge the Relic',
      description: 'Recycle a dormant quest back to ACTIVE with an objective rewrite and a collaborator.',
      isStartingUnlocked: true, // MVP: keep unlocked to ensure recycling works
      appliesToStatus: ['dormant'],
      requirementsSchema: reforgeReq,
      effectsSchema: { version: 1, setQuestStatus: 'active', barKind: 'framework' },
      polarityId: framework.id,
      sortOrder: 90,
    },
  ]

  await Promise.all(
    moves.map((m) =>
      db.nationMove.upsert({
        where: { key: m.key },
        update: {
          nationId: metalNation.id,
          polarityId: m.polarityId,
          name: m.name,
          description: m.description,
          isStartingUnlocked: m.isStartingUnlocked,
          appliesToStatus: JSON.stringify(m.appliesToStatus),
          requirementsSchema: JSON.stringify(m.requirementsSchema),
          effectsSchema: JSON.stringify(m.effectsSchema),
          sortOrder: m.sortOrder,
        },
        create: {
          key: m.key,
          nationId: metalNation.id,
          polarityId: m.polarityId,
          name: m.name,
          description: m.description,
          isStartingUnlocked: m.isStartingUnlocked,
          appliesToStatus: JSON.stringify(m.appliesToStatus),
          requirementsSchema: JSON.stringify(m.requirementsSchema),
          effectsSchema: JSON.stringify(m.effectsSchema),
          sortOrder: m.sortOrder,
        }
      })
    )
  )

  return metalNation
}

// ---------------------------------------------------------------------------
// Read: available moves for quest (UI helper)
// ---------------------------------------------------------------------------

export async function getNationMovePanelData(questId: string): Promise<NationMovePanelData> {
  try {
    // Seed Metal Nation content (MVP reference implementation).
    await ensureMetalNationMoves()

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

    const moves = await db.nationMove.findMany({
      where: { nationId: player.nationId },
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
    await ensureMetalNationMoves()

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

    if (move.nationId !== player.nationId) {
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

    return { ok: true, questId, barId: result.barId, moveKey }
  } catch (error) {
    console.error('[nation-moves] applyNationMoveWithState failed:', error)
    return { error: userSafeError(error) }
  }
}

