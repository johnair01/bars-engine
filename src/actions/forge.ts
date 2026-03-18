'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { mintVibulon } from '@/actions/economy'
import {
  DEFAULT_COOLDOWN_DAYS,
  DISTORTION_THRESHOLD,
  FRICTION_DELTA_MINT_THRESHOLD,
  getCooldownDays,
  type ForgeStage,
} from '@/lib/forge-types'
import { extractValues } from '@/lib/forge-extract-values'

async function requireAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin')
  if (!isAdmin) throw new Error('Admin access required')
  return player
}

export type ForgeEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: 'BLOCKED_COOLDOWN' | 'BLOCKED_LOW_DISTORTION'; message: string }

/** Check if admin can start a Forge session. GM consult: use fallback for DeftnessScore; distortion from admin self-report. */
export async function checkForgeEligibility(
  distortionIntensity?: number
): Promise<ForgeEligibilityResult> {
  const admin = await requireAdmin()

  const intensity = distortionIntensity ?? DISTORTION_THRESHOLD
  if (intensity < DISTORTION_THRESHOLD) {
    return {
      eligible: false,
      reason: 'BLOCKED_LOW_DISTORTION',
      message: `Distortion intensity must be at least ${DISTORTION_THRESHOLD}. You reported ${intensity}.`,
    }
  }

  const lastForge = admin.lastForgeTimestamp
  if (!lastForge) return { eligible: true }

  const deftnessScore: number | null = null // GM consult: use fallback when absent
  const cooldownDays = getCooldownDays(deftnessScore)
  const cooldownEnd = new Date(lastForge)
  cooldownEnd.setDate(cooldownEnd.getDate() + cooldownDays)
  if (new Date() < cooldownEnd) {
    return {
      eligible: false,
      reason: 'BLOCKED_COOLDOWN',
      message: `Cooldown expires ${cooldownEnd.toLocaleDateString()}. Wait ${cooldownDays} days from last Forge.`,
    }
  }

  return { eligible: true }
}

/** Start a new Forge session. Sets stage to THIRD_PERSON. Optionally capture friction at start. */
export async function startForgeSession(frictionStart?: number): Promise<{ sessionId: string } | { error: string }> {
  try {
    const admin = await requireAdmin()
    const eligibility = await checkForgeEligibility(DISTORTION_THRESHOLD)
    if (!eligibility.eligible) {
      return { error: eligibility.message }
    }

    const session = await db.forgeSession.create({
      data: {
        adminId: admin.id,
        stage: 'THIRD_PERSON',
        frictionStart: frictionStart != null ? Math.max(0, Math.min(10, frictionStart)) : undefined,
      },
    })
    revalidatePath('/admin/forge')
    return { sessionId: session.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to start Forge session' }
  }
}

export type ForgeStageData = {
  stage: ForgeStage
  partDescription?: string
  triggerContext?: string
  observedPattern?: string
  desiredExperience?: string
  desiredSatisfaction?: string
  currentGameState?: string
  currentDissatisfaction?: string
  underlyingBelief?: string
  sabotageBelief?: string
  firstPersonVoice?: string
  reclaimedIntent?: string
  alignedStep?: string
  frictionStart?: number
  frictionEnd?: number
  outputType?: 'NEW_AGENT' | 'APPEND_EXISTING'
  routingTargetType?: string
  routingTargetId?: string
  allocationWeight?: number
}

/** Advance Forge session stage and persist data. */
export async function advanceForgeSession(
  sessionId: string,
  data: ForgeStageData
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const session = await db.forgeSession.findUnique({
      where: { id: sessionId },
      select: { id: true, adminId: true, stage: true },
    })
    if (!session) return { error: 'Forge session not found' }

    const stageOrder = ['THIRD_PERSON', 'SECOND_PERSON', 'FIRST_PERSON', 'FRICTION_REASSESS', 'ROUTING', 'COMPLETE']
    const currentIdx = stageOrder.indexOf(session.stage)
    const nextIdx = stageOrder.indexOf(data.stage)
    if (nextIdx <= currentIdx) return { error: 'Cannot go back or repeat stage' }
    if (nextIdx !== currentIdx + 1) return { error: 'Stages must be sequential' }

    const update: Record<string, unknown> = { stage: data.stage }

    if (data.stage === 'THIRD_PERSON' || data.partDescription != null) {
      if (data.partDescription != null) update.partDescription = data.partDescription
      if (data.triggerContext != null) update.triggerContext = data.triggerContext
      if (data.observedPattern != null) update.observedPattern = data.observedPattern
    }
    if (data.stage === 'SECOND_PERSON') {
      if (data.desiredExperience != null) update.desiredExperience = data.desiredExperience
      if (data.desiredSatisfaction != null) update.desiredSatisfaction = data.desiredSatisfaction
      if (data.currentGameState != null) update.currentGameState = data.currentGameState
      if (data.currentDissatisfaction != null) update.currentDissatisfaction = data.currentDissatisfaction
      if (data.underlyingBelief != null) update.underlyingBelief = data.underlyingBelief
      if (data.sabotageBelief != null) update.sabotageBelief = data.sabotageBelief
    }
    if (data.stage === 'FIRST_PERSON') {
      if (data.firstPersonVoice != null) update.firstPersonVoice = data.firstPersonVoice
      if (data.reclaimedIntent != null) update.reclaimedIntent = data.reclaimedIntent
      if (data.alignedStep != null) {
        update.alignedStep = data.alignedStep
        const { mintedValues, mintedConstraints } = extractValues(
          data.alignedStep,
          data.reclaimedIntent ?? ''
        )
        update.mintedValues = JSON.stringify(mintedValues)
        update.mintedConstraints = JSON.stringify(mintedConstraints)
      }
    }
    if (data.stage === 'FRICTION_REASSESS') {
      if (data.frictionStart != null) update.frictionStart = Math.max(0, Math.min(10, data.frictionStart))
      if (data.frictionEnd != null) {
        const frictionEnd = Math.max(0, Math.min(10, data.frictionEnd))
        update.frictionEnd = frictionEnd
        const existing = await db.forgeSession.findUnique({
          where: { id: sessionId },
          select: { frictionStart: true },
        })
        const frictionStart = existing?.frictionStart ?? data.frictionStart ?? 5
        const delta = frictionStart - frictionEnd
        update.frictionDelta = delta
        update.vibeulonMinted = delta > FRICTION_DELTA_MINT_THRESHOLD
      }
    }
    if (data.stage === 'ROUTING' || data.outputType != null) {
      if (data.outputType != null) update.outputType = data.outputType
      if (data.routingTargetType != null) update.routingTargetType = data.routingTargetType
      if (data.routingTargetId != null) update.routingTargetId = data.routingTargetId
      if (data.allocationWeight != null) update.allocationWeight = data.allocationWeight
    }

    await db.forgeSession.update({
      where: { id: sessionId },
      data: update as Record<string, unknown>,
    })
    revalidatePath('/admin/forge')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to advance Forge session' }
  }
}

export type CompleteForgeInput = {
  outputType?: 'NEW_AGENT' | 'APPEND_EXISTING'
  routingTargetType?: string
  routingTargetId?: string
  allocationWeight?: number
}

/** Complete Forge session: set COMPLETE, trigger cooldown, mint vibeulon if applicable, create AgentSpec/AgentPatch. */
export async function completeForgeSession(
  sessionId: string,
  routing?: CompleteForgeInput
): Promise<{ success: true } | { error: string }> {
  try {
    const admin = await requireAdmin()
    let session = await db.forgeSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        adminId: true,
        stage: true,
        vibeulonMinted: true,
        outputType: true,
        routingTargetType: true,
        routingTargetId: true,
        desiredSatisfaction: true,
        currentDissatisfaction: true,
        mintedValues: true,
        mintedConstraints: true,
        underlyingBelief: true,
        sabotageBelief: true,
      },
    })
    if (!session) return { error: 'Forge session not found' }
    if (session.adminId !== admin.id) return { error: 'Not your Forge session' }
    if (session.stage !== 'ROUTING') return { error: 'Must complete ROUTING stage before completing' }

    if (routing?.outputType != null || routing?.routingTargetType != null) {
      await db.forgeSession.update({
        where: { id: sessionId },
        data: {
          ...(routing.outputType != null && { outputType: routing.outputType }),
          ...(routing.routingTargetType != null && { routingTargetType: routing.routingTargetType }),
          ...(routing.routingTargetId != null && { routingTargetId: routing.routingTargetId }),
          ...(routing.allocationWeight != null && { allocationWeight: routing.allocationWeight }),
        },
      })
      session = (await db.forgeSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          adminId: true,
          stage: true,
          vibeulonMinted: true,
          outputType: true,
          routingTargetType: true,
          routingTargetId: true,
          desiredSatisfaction: true,
          currentDissatisfaction: true,
          mintedValues: true,
          mintedConstraints: true,
          underlyingBelief: true,
          sabotageBelief: true,
        },
      }))!
    }

    if (session.vibeulonMinted && (!session.routingTargetType || !session.routingTargetId)) {
      return { error: 'Routing required when vibeulon was minted' }
    }

    let agentSpecId: string | null = null
    let agentPatchId: string | null = null

    if (session.outputType === 'NEW_AGENT') {
      const spec = await db.agentSpec.create({
        data: {
          name: `Forge Agent ${new Date().toISOString().slice(0, 10)}`,
          nationOrientation: session.desiredSatisfaction ?? undefined,
          distortionSignature: session.currentDissatisfaction ?? undefined,
          coreValues: session.mintedValues ?? '[]',
          constraints: session.mintedConstraints ?? '[]',
          beliefContext: session.underlyingBelief ?? undefined,
          sabotageSignature: session.sabotageBelief ?? undefined,
        },
      })
      agentSpecId = spec.id
    }
    // APPEND_EXISTING would create AgentPatch with targetAgentId from routingTargetId when applicable

    await db.$transaction([
      db.forgeSession.update({
        where: { id: sessionId },
        data: {
          stage: 'COMPLETE',
          completedAt: new Date(),
          agentSpecId: agentSpecId ?? undefined,
          agentPatchId: agentPatchId ?? undefined,
        },
      }),
      db.player.update({
        where: { id: admin.id },
        data: { lastForgeTimestamp: new Date() },
      }),
    ])

    if (session.vibeulonMinted) {
      await mintVibulon(admin.id, 1, {
        source: 'admin_agent_forge',
        id: sessionId,
        title: 'Forge Liberation',
      })
    }

    revalidatePath('/admin/forge')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to complete Forge session' }
  }
}
