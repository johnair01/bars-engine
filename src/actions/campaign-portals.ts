'use server'

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import { contextualizeHexagramForPortal } from '@/lib/portal-context'
import type { AllyshipDomain } from '@/lib/kotter'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { draw8PortalCasts } from '@/lib/campaign-hub/draw-portal-spokes'
import {
  type CampaignHubStateV1,
  hubStateMatchesKotter,
  isCampaignHubStateV1,
} from '@/lib/campaign-hub/types'
import { getAvailableFaceMovesForStage } from '@/lib/gm-face-moves-availability'
import type { GmFaceStageMove } from '@/lib/gm-face-stage-moves'

export type PortalData = {
  hexagramId: number
  name: string
  tone: string | null
  text: string | null
  flavor: string
  stageAction: string
  stageName: string
  domainLabel: string
  pathHint: string
  resolutionHint?: string
  changingLines?: number[]
  primaryFace?: GameMasterFace
}

type CastResult = { hexagramId: number; changingLines: number[]; primaryFace: GameMasterFace }

/**
 * Cast 8 hexagrams for the campaign lobby portals.
 * Each hexagram has simulated changing lines; path hints are face-voiced and hexagram-specific
 * (portal-context FACE_PATH_HINT_TEMPLATES + primaryFace from changing lines).
 * @see .specify/specs/portal-path-hint-gm-interview/
 */
const PORTAL_START_NODE_IDS = ['Portal_1', 'Portal_2', 'Portal_3', 'Portal_4', 'Portal_5', 'Portal_6', 'Portal_7', 'Portal_8']

/**
 * Resolve schools Adventure id for a campaign. Used when wiring Grow Up from room.
 */
export async function getSchoolsAdventureId(campaignRef: string): Promise<string | null> {
  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { schoolsAdventureId: true },
  })
  return instance?.schoolsAdventureId ?? null
}

const instanceHubSelect = {
  id: true,
  name: true,
  kotterStage: true,
  allyshipDomain: true,
  portalAdventureId: true,
  campaignRef: true,
  slug: true,
  campaignHubState: true,
  donationButtonLabel: true,
} satisfies Prisma.InstanceSelect

async function ensurePersistedHubDraw(inst: {
  id: string
  kotterStage: number
  campaignHubState: Prisma.JsonValue | null
}): Promise<CampaignHubStateV1> {
  const ks = inst.kotterStage ?? 1
  const raw = inst.campaignHubState
  if (isCampaignHubStateV1(raw) && hubStateMatchesKotter(raw, ks)) {
    return raw
  }
  const spokes = draw8PortalCasts().map((c) => ({
    hexagramId: c.hexagramId,
    changingLines: c.changingLines,
    primaryFace: c.primaryFace,
  }))
  const newState: CampaignHubStateV1 = {
    v: 1,
    kotterStage: ks,
    spokes,
    updatedAt: new Date().toISOString(),
  }
  await db.instance.update({
    where: { id: inst.id },
    data: { campaignHubState: newState as unknown as Prisma.InputJsonValue },
  })
  return newState
}

export async function get8PortalsForCampaign(
  campaignRef: string
): Promise<
  | {
      portals: PortalData[]
      campaignName: string
      kotterStage: number
      portalAdventureId: string | null
      portalStartNodeIds: string[]
      campaignRefResolved: string
      /** Six face moves for strict lockstep (current Kotter stage). */
      faceMoves: readonly GmFaceStageMove[]
      /** Optional label for primary donate CTA (e.g. hub). */
      donateButtonLabel: string | null
    }
  | { error: string }
> {
  try {
    let inst = await db.instance.findFirst({
      where: {
        OR: [{ campaignRef }, { slug: campaignRef }],
      },
      select: instanceHubSelect,
    })

    if (!inst) {
      const active = await getActiveInstance()
      if (active) {
        inst = await db.instance.findUnique({
          where: { id: active.id },
          select: instanceHubSelect,
        })
      }
    }

    if (!inst) {
      return { error: 'No campaign instance found. Create an instance with this campaign ref.' }
    }

    const kotterStage = inst.kotterStage ?? 1
    const domain = (inst.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain

    const validDomains: AllyshipDomain[] = [
      'GATHERING_RESOURCES',
      'SKILLFUL_ORGANIZING',
      'RAISE_AWARENESS',
      'DIRECT_ACTION',
    ]
    const allyshipDomain = validDomains.includes(domain) ? domain : 'GATHERING_RESOURCES'

    const hubState = await ensurePersistedHubDraw({
      id: inst.id,
      kotterStage,
      campaignHubState: inst.campaignHubState,
    })
    const casts: CastResult[] = hubState.spokes.map((s) => ({
      hexagramId: s.hexagramId,
      changingLines: s.changingLines,
      primaryFace: s.primaryFace,
    }))
    const hexagramIds = casts.map((c) => c.hexagramId)

    const bars = await db.bar.findMany({
      where: { id: { in: hexagramIds } },
    })

    const barMap = new Map(bars.map((b) => [b.id, b]))

    const portals: PortalData[] = casts.map((cast) => {
      const bar = barMap.get(cast.hexagramId)
      const name = bar?.name ?? `Hexagram ${cast.hexagramId}`
      const tone = bar?.tone ?? null
      const text = bar?.text ?? null

      const ctx = contextualizeHexagramForPortal(
        cast.hexagramId,
        allyshipDomain,
        kotterStage,
        name,
        tone,
        text,
        cast.changingLines,
        cast.primaryFace
      )

      return {
        hexagramId: cast.hexagramId,
        name,
        tone,
        text,
        changingLines: cast.changingLines,
        primaryFace: cast.primaryFace,
        ...ctx,
      }
    })

    const refResolved = inst.campaignRef ?? inst.slug ?? campaignRef
    const faceMoves = getAvailableFaceMovesForStage(kotterStage)

    return {
      portals,
      campaignName: inst.name ?? campaignRef,
      kotterStage,
      portalAdventureId: inst.portalAdventureId ?? null,
      portalStartNodeIds: PORTAL_START_NODE_IDS,
      campaignRefResolved: refResolved,
      faceMoves,
      donateButtonLabel: inst.donationButtonLabel ?? null,
    }
  } catch (e) {
    console.error('[get8PortalsForCampaign]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to load portals',
    }
  }
}

/**
 * Face-move availability for a campaign (strict lockstep: current `Instance.kotterStage` only).
 * `playerId` reserved for future per-player gates; ignored in v1.
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md §D
 */
export async function getGmFaceMoveAvailabilityForCampaign(
  campaignRef: string,
  _playerId?: string | null,
): Promise<
  | {
      kotterStage: number
      campaignRefResolved: string
      moves: readonly GmFaceStageMove[]
    }
  | { error: string }
> {
  const r = await get8PortalsForCampaign(campaignRef)
  if ('error' in r) return r
  return {
    kotterStage: r.kotterStage,
    campaignRefResolved: r.campaignRefResolved,
    moves: r.faceMoves,
  }
}

/** One spoke’s persisted draw + contextual copy — for landing “card” pages. */
export async function getSpokeLandingContext(
  campaignRef: string,
  spokeIndex: number
): Promise<
  | {
      campaignName: string
      kotterStage: number
      campaignRefResolved: string
      spokeIndex: number
      hexagramId: number
      hexagramName: string
      tone: string | null
      text: string | null
      flavor: string
      stageAction: string
      stageName: string
      domainLabel: string
      pathHint: string
      primaryFace?: GameMasterFace
      changingLines?: number[]
    }
  | { error: string }
> {
  if (spokeIndex < 0 || spokeIndex > 7 || !Number.isInteger(spokeIndex)) {
    return { error: 'Invalid spoke index (use 0–7).' }
  }
  try {
    let inst = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: instanceHubSelect,
    })
    if (!inst) {
      const active = await getActiveInstance()
      if (active) {
        inst = await db.instance.findUnique({
          where: { id: active.id },
          select: instanceHubSelect,
        })
      }
    }
    if (!inst) {
      return { error: 'No campaign instance found.' }
    }
    const kotterStage = inst.kotterStage ?? 1
    const domain = (inst.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain
    const validDomains: AllyshipDomain[] = [
      'GATHERING_RESOURCES',
      'SKILLFUL_ORGANIZING',
      'RAISE_AWARENESS',
      'DIRECT_ACTION',
    ]
    const allyshipDomain = validDomains.includes(domain) ? domain : 'GATHERING_RESOURCES'

    const hubState = await ensurePersistedHubDraw({
      id: inst.id,
      kotterStage,
      campaignHubState: inst.campaignHubState,
    })
    const cast = hubState.spokes[spokeIndex]!
    const bars = await db.bar.findMany({
      where: { id: { in: [cast.hexagramId] } },
    })
    const bar = bars[0]
    const name = bar?.name ?? `Hexagram ${cast.hexagramId}`
    const tone = bar?.tone ?? null
    const text = bar?.text ?? null
    const ctx = contextualizeHexagramForPortal(
      cast.hexagramId,
      allyshipDomain,
      kotterStage,
      name,
      tone,
      text,
      cast.changingLines,
      cast.primaryFace
    )
    const refResolved = inst.campaignRef ?? inst.slug ?? campaignRef
    return {
      campaignName: inst.name ?? campaignRef,
      kotterStage,
      campaignRefResolved: refResolved,
      spokeIndex,
      hexagramId: cast.hexagramId,
      hexagramName: name,
      tone,
      text,
      changingLines: cast.changingLines,
      primaryFace: cast.primaryFace,
      ...ctx,
    }
  } catch (e) {
    console.error('[getSpokeLandingContext]', e)
    return { error: e instanceof Error ? e.message : 'Failed to load landing' }
  }
}
