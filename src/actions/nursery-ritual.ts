'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import {
  resolveNurseryMoves,
  nurseryTypeToWcgs,
  type MoveDefinition,
  type WcgsStage,
} from '@/lib/nation/move-library-accessor'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import {
  isCampaignHubStateV1,
  type CampaignHubStateV1,
  type CompletedBuildReceipt,
} from '@/lib/campaign-hub/types'

// ─── Key resolution helpers ─────────────────────────────────────────────────

const ARCHETYPE_NAME_TO_KEY: Record<string, string> = {
  'heaven (qian)': 'bold_heart', 'bold heart': 'bold_heart',
  'earth (kun)': 'devoted_guardian', 'devoted guardian': 'devoted_guardian',
  'mountain (gen)': 'still_point', 'still point': 'still_point',
  'fire (li)': 'truth_seer', 'truth seer': 'truth_seer',
  'lake (dui)': 'joyful_connector', 'joyful connector': 'joyful_connector',
  'water (kan)': 'danger_walker', 'danger walker': 'danger_walker',
  'thunder (zhen)': 'decisive_storm', 'decisive storm': 'decisive_storm',
  'wind (xun)': 'subtle_influence', 'subtle influence': 'subtle_influence',
}

function resolveArchetypeKey(name: string | undefined | null): string | null {
  if (!name) return null
  return ARCHETYPE_NAME_TO_KEY[name.toLowerCase()] ?? null
}

const ELEMENT_TO_NATION_KEY: Record<string, string> = {
  metal: 'argyra', water: 'lamenth', wood: 'virelune', fire: 'pyrakanth', earth: 'meridia',
}

/** Map WCGS stage (wake_up) to SpokeMoveBed moveType (wakeUp). */
function wcgsToMoveType(stage: WcgsStage): string {
  const map: Record<WcgsStage, string> = {
    wake_up: 'wakeUp', clean_up: 'cleanUp', grow_up: 'growUp', show_up: 'showUp',
  }
  return map[stage]
}

// ─── launchNurseryRitual ────────────────────────────────────────────────────

export type NurseryRitualContext = {
  nationMove: MoveDefinition
  archetypeMove?: MoveDefinition
  face: GameMasterFace
  domain?: string
  playerName: string
}

export async function launchNurseryRitual(
  nurseryType: string,
  face: GameMasterFace
): Promise<
  | { success: true; context: NurseryRitualContext }
  | { success: false; error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  const wcgsStage = nurseryTypeToWcgs(nurseryType)
  if (!wcgsStage) return { success: false, error: `Invalid nursery type: ${nurseryType}` }

  const nationElement = player.nation?.element
  if (!nationElement) return { success: false, error: 'Player has no nation assigned' }
  const nationKey = ELEMENT_TO_NATION_KEY[nationElement]
  if (!nationKey) return { success: false, error: `Unknown nation element: ${nationElement}` }

  const archetypeKey = resolveArchetypeKey(player.archetype?.name)
  const { nationMove, archetypeMove } = resolveNurseryMoves(nationKey, archetypeKey, wcgsStage)
  if (!nationMove) {
    return { success: false, error: `No nation move found for ${nationKey} / ${wcgsStage}` }
  }

  return {
    success: true,
    context: {
      nationMove,
      archetypeMove: archetypeMove ?? undefined,
      face,
      domain: 'gather_resources',
      playerName: player.name ?? 'Player',
    },
  }
}

// ─── completeNurseryRitual ──────────────────────────────────────────────────

export type CompleteNurseryResult = {
  success: true
  barId: string
  barTitle: string
  vibeulonsAwarded: number
  planted: boolean
}

export async function completeNurseryRitual(input: {
  moveId: string
  barText: string
  reflectionFields: Record<string, string>
  coreResponse: unknown
  face: GameMasterFace
  spokeIndex: number
  instanceId: string
  nurseryType: string
}): Promise<CompleteNurseryResult | { success: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // Resolve move data from effectsSchema
  const moveRow = await dbBase.nationMove.findFirst({
    where: { key: input.moveId },
    select: { id: true, name: true, effectsSchema: true },
  })

  let barType = 'insight'
  let vibeulonBase = 1
  if (moveRow?.effectsSchema) {
    try {
      const schema = JSON.parse(moveRow.effectsSchema)
      barType = schema.bar_integration?.bar_type ?? 'insight'
      vibeulonBase = schema.vibeulon_rules?.base_reward ?? 1
    } catch { /* use defaults */ }
  }

  const moveName = moveRow?.name ?? 'Ritual'
  const barTitle = `${moveName}: ${input.barText.slice(0, 60)}`

  // Resolve campaign context
  const instance = await dbBase.instance.findFirst({
    where: { slug: input.instanceId },
    select: {
      id: true,
      campaignRef: true,
      campaignHubState: true,
      allyshipDomain: true,
    },
  })
  const campaignRef = instance?.campaignRef ?? input.instanceId

  // ── 1. Create the BAR ──────────────────────────────────────────────────
  const bar = await dbBase.customBar.create({
    data: {
      title: barTitle,
      description: input.barText,
      type: barType === 'vibe' ? 'vibe' : 'bar',
      creatorId: player.id,
      claimedById: player.id,
      campaignRef,
      allyshipDomain: instance?.allyshipDomain ?? null,
      visibility: 'private',
      status: 'active',
      storyContent: JSON.stringify({
        source: 'nursery_ritual',
        moveId: input.moveId,
        face: input.face,
        barType,
        nurseryType: input.nurseryType,
        reflectionFields: input.reflectionFields,
        coreResponse: input.coreResponse,
        spokeIndex: input.spokeIndex,
      }),
      agentMetadata: JSON.stringify({
        sourceType: 'nursery_ritual',
        spokeIndex: input.spokeIndex,
        moveId: input.moveId,
        nurseryType: input.nurseryType,
        face: input.face,
        plantedAt: new Date().toISOString(),
      }),
      gameMasterFace: input.face,
    },
  })

  // ── 2. Plant on SpokeMoveBed ───────────────────────────────────────────
  const wcgsStage = nurseryTypeToWcgs(input.nurseryType)
  const moveType = wcgsStage ? wcgsToMoveType(wcgsStage) : input.nurseryType.replace(/-/g, '')
  let planted = false

  try {
    const existing = await dbBase.spokeMoveBed.findUnique({
      where: {
        campaignRef_spokeIndex_moveType: {
          campaignRef,
          spokeIndex: input.spokeIndex,
          moveType,
        },
      },
    })

    if (existing && !existing.anchorBarId) {
      // Slot exists but no anchor — claim it
      await dbBase.spokeMoveBed.update({
        where: { id: existing.id },
        data: {
          anchorBarId: bar.id,
          anchoredByPlayerId: player.id,
          anchoredAt: new Date(),
        },
      })
      planted = true
    } else if (!existing) {
      // Create the slot and anchor it
      await dbBase.spokeMoveBed.create({
        data: {
          campaignRef,
          spokeIndex: input.spokeIndex,
          moveType,
          anchorBarId: bar.id,
          anchoredByPlayerId: player.id,
          anchoredAt: new Date(),
        },
      })
      planted = true
    }
    // If existing.anchorBarId is set → first-mover wins, don't overwrite
  } catch {
    // SpokeMoveBed upsert failed — non-critical, BAR still created
  }

  // ── 3. Award vibeulons ─────────────────────────────────────────────────
  await dbBase.vibulonEvent.create({
    data: {
      playerId: player.id,
      source: 'nursery_ritual',
      amount: vibeulonBase,
      notes: `${moveName} (${input.face}, spoke ${input.spokeIndex})`,
    },
  })

  // ── 4. Write CompletedBuildReceipt to hub ledger ───────────────────────
  if (instance) {
    try {
      const raw = instance.campaignHubState
      const hubState: CampaignHubStateV1 = isCampaignHubStateV1(raw)
        ? raw
        : {
            v: 1,
            kotterStage: 1,
            spokes: [],
            completedBuilds: [],
            updatedAt: new Date().toISOString(),
          }

      const receipt: CompletedBuildReceipt = {
        buildId: bar.id,
        spokeIndex: input.spokeIndex,
        face: input.face,
        templateKind: 'nursery_ritual',
        templateKey: input.moveId,
        emotionalVector: {
          channelFrom: 'Fear',
          altitudeFrom: 'dissatisfied',
          channelTo: 'Joy',
          altitudeTo: 'neutral',
        },
        chargeText: input.barText.slice(0, 120),
        terminalNodeId: 'ritual_complete',
        blueprintKey: `nursery_${input.nurseryType}_${input.face}`,
        barSummaries: [{ barId: bar.id, title: barTitle, type: barType as 'vibe' | 'story' | 'insight', vibeulons: vibeulonBase }],
        totalVibeulons: vibeulonBase,
        completedAt: new Date().toISOString(),
      }

      const builds = hubState.completedBuilds ?? []
      builds.push(receipt)

      const updatedState: CampaignHubStateV1 = {
        ...hubState,
        completedBuilds: builds,
        updatedAt: new Date().toISOString(),
      }

      await dbBase.instance.update({
        where: { id: instance.id },
        data: { campaignHubState: updatedState as unknown as Prisma.InputJsonValue },
      })
    } catch {
      // Hub state update failed — non-critical
    }
  }

  revalidatePath('/campaign/hub')
  revalidatePath(`/world/${input.instanceId}`)

  return {
    success: true,
    barId: bar.id,
    barTitle,
    vibeulonsAwarded: vibeulonBase,
    planted,
  }
}

// ─── getNurseryCompletionState ──────────────────────────────────────────────

export type NurseryCompletionState = {
  completed: boolean
  barId?: string
  barTitle?: string
  completedAt?: string
  face?: string
}

export async function getNurseryCompletionState(
  instanceSlug: string,
  spokeIndex: number,
  nurseryType: string
): Promise<NurseryCompletionState> {
  const player = await getCurrentPlayer()
  if (!player) return { completed: false }

  // Resolve campaignRef from instance
  const instance = await dbBase.instance.findFirst({
    where: { slug: instanceSlug },
    select: { campaignRef: true },
  })
  const campaignRef = instance?.campaignRef ?? instanceSlug

  const wcgsStage = nurseryTypeToWcgs(nurseryType)
  const moveType = wcgsStage ? wcgsToMoveType(wcgsStage) : nurseryType.replace(/-/g, '')

  // Check if this player has anchored a BAR on this spoke bed
  const bed = await dbBase.spokeMoveBed.findUnique({
    where: {
      campaignRef_spokeIndex_moveType: {
        campaignRef,
        spokeIndex,
        moveType,
      },
    },
    include: {
      anchorBar: { select: { id: true, title: true, createdAt: true, gameMasterFace: true } },
    },
  })

  if (bed?.anchorBarId && bed.anchoredByPlayerId === player.id && bed.anchorBar) {
    return {
      completed: true,
      barId: bed.anchorBar.id,
      barTitle: bed.anchorBar.title,
      completedAt: bed.anchoredAt?.toISOString() ?? bed.anchorBar.createdAt.toISOString(),
      face: bed.anchorBar.gameMasterFace ?? undefined,
    }
  }

  return { completed: false }
}
