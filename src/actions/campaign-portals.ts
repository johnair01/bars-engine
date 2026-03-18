'use server'

import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import {
  contextualizeHexagramForPortal,
  getFaceForLine,
} from '@/lib/portal-context'
import type { AllyshipDomain } from '@/lib/kotter'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

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
 * Cast a single hexagram with simulated changing lines (1–3 lines).
 * Only portals with changing lines are revealed per spec.
 */
function castHexagramWithChangingLines(): CastResult {
  const lines = Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1))
  const hexagramId = 1 + lines.reduce<number>((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
  const clampedId = Math.max(1, Math.min(64, hexagramId))

  const changeCount = 1 + Math.floor(Math.random() * 3)
  const indices: number[] = []
  while (indices.length < changeCount) {
    const i = Math.floor(Math.random() * 6)
    if (!indices.includes(i)) indices.push(i)
  }
  indices.sort((a, b) => a - b)
  const changingLines = indices.map((i) => i + 1)
  const primaryFace = getFaceForLine(changingLines[0]!)

  return { hexagramId: clampedId, changingLines, primaryFace }
}

/**
 * Draw 8 portal casts, each with changing lines. Only paths with changing lines are shown.
 */
function draw8PortalCasts(): CastResult[] {
  return Array.from({ length: 8 }, () => castHexagramWithChangingLines())
}

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

export async function get8PortalsForCampaign(
  campaignRef: string
): Promise<
  | {
      portals: PortalData[]
      campaignName: string
      kotterStage: number
      portalAdventureId: string | null
      portalStartNodeIds: string[]
    }
  | { error: string }
> {
  try {
    const instance = await db.instance.findFirst({
      where: {
        OR: [{ campaignRef }, { slug: campaignRef }],
      },
    })

    const activeInstance = await getActiveInstance()
    const inst = instance ?? activeInstance

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

    const casts = draw8PortalCasts()
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

    return {
      portals,
      campaignName: inst.name ?? campaignRef,
      kotterStage,
      portalAdventureId: inst.portalAdventureId ?? null,
      portalStartNodeIds: PORTAL_START_NODE_IDS,
    }
  } catch (e) {
    console.error('[get8PortalsForCampaign]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to load portals',
    }
  }
}
