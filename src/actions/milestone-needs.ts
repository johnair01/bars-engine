'use server'

/**
 * Milestone needs — DB-bound server actions (campaign Phase 3/4, FR9/FR10).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 * Ruling: .specify/specs/mobility-quest-superpower-campaign/STRAND_CONSULT_SIX_FACES.md
 *
 * Thin DB wrappers around the PURE engine in src/lib/superpowers/needs.ts:
 *   • listMilestoneNeedsForPlayer → Tier 1 (superpower+orientation) then Tier 2
 *     (open-aid fallback) + per-unit, orientation-split progress.
 *   • claimMilestoneNeed / completeMilestoneNeed → state + MilestoneContribution +
 *     ContributionRecord (unit-typed, never blended; no per-action multiplier).
 */
import { z } from 'zod'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  matchNeedsForPlayer,
  summarizeNeeds,
  type MilestoneNeed,
  type NeedProgress,
  type NeedStatus,
  type NeedUnit,
  type TieredNeed,
} from '@/lib/superpowers/needs'
import type { Superpower, SuperpowerOrientation } from '@/lib/superpowers/types'

type NeedRow = {
  id: string
  milestoneId: string
  campaignRef: string
  superpower: string
  orientation: string
  cardId: string
  unit: string
  value: number
  status: string
  claimedByPlayerId: string | null
  title: string | null
}

/** Map a DB row to the engine's MilestoneNeed (string columns → unions). */
function rowToNeed(r: NeedRow): MilestoneNeed {
  return {
    id: r.id,
    milestoneId: r.milestoneId,
    superpower: r.superpower as Superpower,
    orientation: r.orientation as SuperpowerOrientation,
    cardId: r.cardId,
    unit: r.unit as NeedUnit,
    value: r.value,
    status: r.status as NeedStatus,
    claimedByPlayerId: r.claimedByPlayerId ?? undefined,
    title: r.title ?? undefined,
  }
}

const NEED_SELECT = {
  id: true,
  milestoneId: true,
  campaignRef: true,
  superpower: true,
  orientation: true,
  cardId: true,
  unit: true,
  value: true,
  status: true,
  claimedByPlayerId: true,
  title: true,
} as const

const listSchema = z.object({
  campaignRef: z.string().trim().min(1).max(64),
  superpower: z
    .enum(['connector', 'storyteller', 'strategist', 'disruptor', 'alchemist', 'escape_artist', 'coach'])
    .optional(),
  orientation: z.enum(['internal', 'external']).nullish(),
})

export type ListMilestoneNeedsResult =
  | { ok: true; tiered: TieredNeed[]; summary: NeedProgress }
  | { ok: false; error: string }

/**
 * List a campaign's needs for a player, tiered. If `superpower` is omitted, the
 * player's per-campaign result (CampaignMembership) is used; with no lens at all,
 * every open need is returned as Tier-2 open aid.
 */
export async function listMilestoneNeedsForPlayer(raw: unknown): Promise<ListMilestoneNeedsResult> {
  const parsed = listSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  const { campaignRef } = parsed.data

  const rows = await db.milestoneNeed.findMany({ where: { campaignRef }, select: NEED_SELECT })
  const needs = rows.map(rowToNeed)

  // Resolve the player's lens: explicit arg → membership result → none.
  let superpower: Superpower | undefined = parsed.data.superpower
  let orientation: SuperpowerOrientation | null = parsed.data.orientation ?? null

  if (!superpower) {
    const player = await getCurrentPlayer()
    if (player) {
      const campaign = await db.campaign.findFirst({
        where: { slug: campaignRef },
        select: { id: true },
      })
      if (campaign) {
        const membership = await db.campaignMembership.findUnique({
          where: { campaignId_playerId: { campaignId: campaign.id, playerId: player.id } },
          select: { superpower: true, superpowerOrientation: true },
        })
        if (membership?.superpower) {
          superpower = membership.superpower as Superpower
          orientation = (membership.superpowerOrientation as SuperpowerOrientation | null) ?? orientation
        }
      }
    }
  }

  const tiered: TieredNeed[] = superpower
    ? matchNeedsForPlayer(needs, { superpower, orientation })
    : needs.filter((n) => n.status === 'open').map((need) => ({ need, tier: 'open' as const }))

  return { ok: true, tiered, summary: summarizeNeeds(needs) }
}

const idSchema = z.object({ needId: z.string().trim().min(1) })

export type ClaimMilestoneNeedResult =
  | { ok: true; needId: string }
  | { ok: false; error: string }

/** Claim an open need for the current player (idempotent if already theirs). */
export async function claimMilestoneNeed(raw: unknown): Promise<ClaimMilestoneNeedResult> {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const need = await db.milestoneNeed.findUnique({
    where: { id: parsed.data.needId },
    select: { id: true, status: true, claimedByPlayerId: true },
  })
  if (!need) return { ok: false, error: 'Need not found.' }
  if (need.status === 'done') return { ok: false, error: 'This need is already complete.' }
  if (need.status === 'claimed' && need.claimedByPlayerId !== player.id) {
    return { ok: false, error: 'Someone else is already on this one.' }
  }

  await db.milestoneNeed.update({
    where: { id: need.id },
    data: { status: 'claimed', claimedByPlayerId: player.id },
  })
  return { ok: true, needId: need.id }
}

export type CompleteMilestoneNeedResult =
  | { ok: true; contributionId: string }
  | { ok: false; error: string }

/**
 * Complete a need: mark done, write a MilestoneContribution (unit-typed value),
 * advance the milestone, and upsert a ContributionRecord. Per Six Faces, the
 * honest per-unit / internal-vs-external view comes from summarizeNeeds — the
 * legacy CampaignMilestone.currentValue is advanced for parity with the existing
 * donation flow only.
 */
export async function completeMilestoneNeed(raw: unknown): Promise<CompleteMilestoneNeedResult> {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const need = await db.milestoneNeed.findUnique({
    where: { id: parsed.data.needId },
    select: { id: true, status: true, claimedByPlayerId: true, milestoneId: true, campaignRef: true, value: true, title: true },
  })
  if (!need) return { ok: false, error: 'Need not found.' }
  if (need.status === 'done') return { ok: false, error: 'Already complete.' }
  if (need.claimedByPlayerId && need.claimedByPlayerId !== player.id) {
    return { ok: false, error: 'This need is claimed by someone else.' }
  }

  const annotation = await db.contributionAnnotation.findUnique({
    where: {
      campaignRef_actionType_actionId: {
        campaignRef: need.campaignRef,
        actionType: 'milestone',
        actionId: need.milestoneId,
      },
    },
    select: { gmLabel: true, status: true },
  })
  const gmLabel = annotation?.status === 'active' ? annotation.gmLabel : need.title ?? ''

  const contributionId = await db.$transaction(async (tx) => {
    await tx.milestoneNeed.update({
      where: { id: need.id },
      data: { status: 'done', claimedByPlayerId: player.id },
    })

    const contribution = await tx.milestoneContribution.create({
      data: {
        milestoneId: need.milestoneId,
        playerId: player.id,
        value: need.value,
        note: need.title ?? null,
      },
      select: { id: true },
    })

    await tx.campaignMilestone.update({
      where: { id: need.milestoneId },
      data: { currentValue: { increment: need.value } },
    })

    await tx.contributionRecord.upsert({
      where: {
        campaignRef_playerId_sourceType_sourceId: {
          campaignRef: need.campaignRef,
          playerId: player.id,
          sourceType: 'milestone',
          sourceId: need.milestoneId,
        },
      },
      create: {
        campaignRef: need.campaignRef,
        playerId: player.id,
        sourceType: 'milestone',
        sourceId: need.milestoneId,
        gmLabel,
      },
      update: { gmLabel },
    })

    return contribution.id
  })

  return { ok: true, contributionId }
}

export type ReleaseMilestoneNeedResult = { ok: true } | { ok: false; error: string }

/** Return a need the current player claimed back to `open`. */
export async function releaseMilestoneNeed(raw: unknown): Promise<ReleaseMilestoneNeedResult> {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const need = await db.milestoneNeed.findUnique({
    where: { id: parsed.data.needId },
    select: { id: true, status: true, claimedByPlayerId: true },
  })
  if (!need) return { ok: false, error: 'Need not found.' }
  if (need.status === 'done') return { ok: false, error: 'Already complete.' }
  if (need.claimedByPlayerId && need.claimedByPlayerId !== player.id) {
    return { ok: false, error: 'Not yours to release.' }
  }

  await db.milestoneNeed.update({ where: { id: need.id }, data: { status: 'open', claimedByPlayerId: null } })
  return { ok: true }
}
