'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getCampaignMilestoneGuidance } from '@/actions/campaign-milestone-guidance'
import { emitBarFromPassage } from '@/actions/emit-bar-from-passage'
import { plantKernelFromBar } from '@/actions/spoke-move-seeds'
import type { GeneratedSpokeInputs, GscpProgressBundle } from '@/lib/generated-spoke-cyoa/types'
import {
  buildStubGscpPassages,
  generateGscpPassagesAi,
  normalizeGscpAiResult,
  validateGscpGraph,
  type GscpAiResult,
} from '@/lib/generated-spoke-cyoa/generate-passages'
import {
  isCampaignHubStateV1,
  hubStateMatchesKotter,
} from '@/lib/campaign-hub/types'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'

export type GscpWizardData = {
  campaignRef: string
  spokeIndex: number
  instanceName: string
  kotterStage: number
  allyshipDomain: string | null
  hexagramId?: number
  changingLines?: number[]
  milestoneSummary: string | null
  fundraisingNote: string | null
}

/**
 * Server data for the GSCP wizard (opening beat — FR1).
 */
export async function getGscpWizardData(
  campaignRef: string,
  spokeIndex: number
): Promise<GscpWizardData | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: {
      name: true,
      kotterStage: true,
      allyshipDomain: true,
      campaignHubState: true,
      stripeOneTimeUrl: true,
      venmoUrl: true,
      paypalUrl: true,
      cashappUrl: true,
    },
  })
  if (!inst) return { error: 'Campaign instance not found' }

  const ks = inst.kotterStage ?? 1
  let hexagramId: number | undefined
  let changingLines: number[] | undefined
  const hub = inst.campaignHubState
  if (isCampaignHubStateV1(hub) && hubStateMatchesKotter(hub, ks)) {
    const spoke = hub.spokes[spokeIndex]
    hexagramId = spoke?.hexagramId
    changingLines = spoke?.changingLines
  }

  let milestoneSummary: string | null = null
  try {
    const g = await getCampaignMilestoneGuidance(player.id, { campaignRef })
    if (g?.snapshot) {
      const s = g.snapshot
      milestoneSummary = [
        `${s.kotterEmoji} ${s.kotterStageName}`,
        s.stageActionLine,
        s.fundraisingLine,
      ]
        .filter((x) => x && String(x).trim())
        .join(' · ')
    }
  } catch {
    /* honest omission */
  }
  if (!milestoneSummary) {
    milestoneSummary = `Collective stage ${ks} · ${inst.name?.trim() ?? campaignRef}`
  }

  const hasPay =
    !!(inst.stripeOneTimeUrl || inst.venmoUrl || inst.paypalUrl || inst.cashappUrl)
  const fundraisingNote = hasPay
    ? 'This residency accepts contributions — use the campaign donate flow when you are ready.'
    : null

  return {
    campaignRef,
    spokeIndex,
    instanceName: inst.name?.trim() || campaignRef,
    kotterStage: ks,
    allyshipDomain: inst.allyshipDomain ?? null,
    hexagramId,
    changingLines,
    milestoneSummary,
    fundraisingNote,
  }
}

function blueprintKeyFor(gmFace: GameMasterFace, move: SpokeMoveBedMoveType): string {
  return `face_${gmFace}_move_${move}`
}

/**
 * Generate passages (AI or stub), validate, persist Adventure + Passages, seed progress with GSCP bundle.
 */
export async function generateAndPersistGscpAdventure(
  input: GeneratedSpokeInputs
): Promise<
  | { success: true; adventureId: string; slug: string; startNodeId: string }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  if (input.chargeText.trim().length < 3) {
    return { error: 'Charge text is too short — say a little more about what you feel on this spoke.' }
  }

  let content: GscpAiResult | null = await generateGscpPassagesAi(input)
  if (!content) {
    content = buildStubGscpPassages(input)
  } else {
    content = normalizeGscpAiResult(content)
  }

  let terminalId =
    content.passages.find((p) => p.isTerminal || p.choices.length === 0)?.nodeId ?? null
  if (!terminalId) {
    content = buildStubGscpPassages(input)
    terminalId = 'GSCP_Terminal'
  }

  let valid = validateGscpGraph(content, terminalId)
  if (!valid.ok) {
    content = buildStubGscpPassages(input)
    terminalId = 'GSCP_Terminal'
    valid = validateGscpGraph(content, terminalId)
    if (!valid.ok) {
      return { error: `Could not build a valid journey: ${valid.message}` }
    }
  }

  const slug = `gscp-${player.id.slice(0, 10)}-${input.spokeIndex}-${Date.now()}`
  const blueprintKey = blueprintKeyFor(input.gmFace, input.moveFocus)

  const bundle: GscpProgressBundle = {
    campaignRef: input.campaignRef,
    spokeIndex: input.spokeIndex,
    kotterStage: input.kotterStage,
    moveType: input.moveFocus,
    gmFace: input.gmFace,
    chargeText: input.chargeText.trim(),
    hexagramId: input.hexagramId,
    blueprintKey,
    terminalNodeId: terminalId,
    createdAt: new Date().toISOString(),
  }

  try {
    const adventure = await db.adventure.create({
      data: {
        slug,
        title: content.title,
        description: content.description,
        adventureType: 'CYOA_SPOKE_GENERATED',
        campaignRef: input.campaignRef,
        status: 'ACTIVE',
        visibility: 'PRIVATE_QUEST',
        startNodeId: content.startNodeId,
        playbookTemplate: JSON.stringify({
          gscp: { version: 1, ...bundle },
        }),
        passages: {
          create: content.passages.map((p) => {
            const isTerm = p.nodeId === terminalId
            return {
              nodeId: p.nodeId,
              text: p.text,
              choices: JSON.stringify(
                isTerm
                  ? []
                  : p.choices.map((c) => ({
                      text: c.text,
                      targetId: c.targetId,
                    })),
              ),
              metadata: isTerm
                ? { actionType: 'gscp_terminal' }
                : undefined,
            }
          }),
        },
      },
      select: { id: true },
    })

    await db.playerAdventureProgress.upsert({
      where: {
        playerId_adventureId: { playerId: player.id, adventureId: adventure.id },
      },
      create: {
        playerId: player.id,
        adventureId: adventure.id,
        currentNodeId: content.startNodeId,
        stateData: JSON.stringify({ gscp: bundle }),
      },
      update: {
        currentNodeId: content.startNodeId,
        stateData: JSON.stringify({ gscp: bundle }),
      },
    })

    revalidatePath('/campaign')
    revalidatePath('/adventure')

    return {
      success: true,
      adventureId: adventure.id,
      slug,
      startNodeId: content.startNodeId,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save adventure'
    return { error: msg }
  }
}

/**
 * Terminal completion: achievement BAR (charge-parameterized) + nursery plant (SMB additional).
 */
export async function completeGscpAdventureTerminal(adventureId: string): Promise<
  | { success: true; barId: string; kernel: 'additional' | 'anchor' }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const progress = await db.playerAdventureProgress.findUnique({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
  })
  if (!progress?.stateData) return { error: 'No journey state' }

  type StateShape = { gscp?: GscpProgressBundle; gscpCompleted?: boolean; gscpBarId?: string }
  let state: StateShape
  try {
    state = JSON.parse(progress.stateData) as StateShape
  } catch {
    return { error: 'Invalid journey state' }
  }
  if (!state.gscp) return { error: 'Missing GSCP bundle' }
  if (state.gscpCompleted && state.gscpBarId) {
    return { success: true, barId: state.gscpBarId, kernel: 'additional' }
  }

  const bundle = state.gscp
  const passageNodeId = bundle.terminalNodeId || 'GSCP_Terminal'

  const faceLabel = FACE_META[bundle.gmFace]?.label ?? bundle.gmFace
  const title = `Achievement · ${faceLabel} · Spoke ${bundle.spokeIndex + 1}`
  const description = [
    `**Your charge on this spoke:**`,
    bundle.chargeText,
    '',
    `Move: **${bundle.moveType}** · Guide: **${faceLabel}** · Collective stage ${bundle.kotterStage}.`,
  ].join('\n')

  const emit = await emitBarFromPassage({
    title,
    description,
    adventureId,
    passageNodeId,
    campaignRef: bundle.campaignRef,
    blueprintKey: bundle.blueprintKey,
    spokeIndex: bundle.spokeIndex,
  })
  if ('error' in emit) return emit

  const plant = await plantKernelFromBar({
    campaignRef: bundle.campaignRef,
    spokeIndex: bundle.spokeIndex,
    moveType: bundle.moveType,
    barId: emit.barId,
    intent: 'additional',
  })
  if ('error' in plant) {
    return { error: plant.error }
  }

  const merged = { ...state, gscpCompleted: true, gscpBarId: emit.barId }
  await db.playerAdventureProgress.update({
    where: { playerId_adventureId: { playerId: player.id, adventureId } },
    data: { stateData: JSON.stringify(merged) },
  })

  revalidatePath('/hand')
  revalidatePath('/campaign/hub')
  revalidatePath(`/campaign/${bundle.campaignRef}/spoke/${bundle.spokeIndex}/seeds`)

  return {
    success: true,
    barId: emit.barId,
    kernel: plant.kind === 'anchor' ? 'anchor' : 'additional',
  }
}
