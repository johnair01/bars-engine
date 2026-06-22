'use server'

/**
 * Milestone needs — steward authoring actions (campaign Phase 3, FR11).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 * Ruling: STRAND_CONSULT_SIX_FACES.md — unit-typed, NO per-action multiplier.
 *
 * Stewards (admin, or instance owner/steward for the ref) author the
 * superpower-typed needs a milestone decomposes into. The Six Faces invariant is
 * enforced here: a steward picks the UNIT to match the milestone's target, but may
 * not weight one action above another — `unit:'action'` is forced to `value:1`.
 */
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { playerCanListAllyshipIntakesForRef } from '@/lib/allyship-intake-permissions'

const SUPERPOWER_ENUM = ['connector', 'storyteller', 'strategist', 'disruptor', 'alchemist', 'escape_artist', 'coach'] as const

async function requireSteward(campaignRef: string) {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false as const, error: 'Sign in required.' }
  const allowed = await playerCanListAllyshipIntakesForRef(player.id, campaignRef, player.roles)
  if (!allowed) return { ok: false as const, error: 'You cannot author needs for this campaign.' }
  return { ok: true as const, player }
}

export type StewardMilestone = {
  id: string
  title: string
  targetValue: number | null
  currentValue: number
  needs: {
    id: string
    superpower: string
    orientation: string
    cardId: string
    unit: string
    value: number
    status: string
    title: string | null
  }[]
}

export type ListStewardMilestonesResult =
  | { ok: true; milestones: StewardMilestone[] }
  | { ok: false; error: string }

/** Milestones (with their needs) for a campaign, for the authoring panel. */
export async function listCampaignMilestonesForSteward(campaignRef: string): Promise<ListStewardMilestonesResult> {
  const ref = campaignRef.trim()
  const gate = await requireSteward(ref)
  if (!gate.ok) return { ok: false, error: gate.error }

  const milestones = await db.campaignMilestone.findMany({
    where: { campaignRef: ref },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      targetValue: true,
      currentValue: true,
      needs: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, superpower: true, orientation: true, cardId: true, unit: true, value: true, status: true, title: true },
      },
    },
  })
  return { ok: true, milestones }
}

const createSchema = z.object({
  campaignRef: z.string().trim().min(1).max(64),
  milestoneId: z.string().trim().min(1),
  superpower: z.enum(SUPERPOWER_ENUM),
  orientation: z.enum(['internal', 'external']),
  cardId: z.string().trim().min(1).max(64),
  unit: z.enum(['action', 'currency', 'hours']),
  value: z.number().positive().max(1_000_000).optional(),
  title: z.string().trim().max(160).optional(),
})

export type CreateMilestoneNeedResult = { ok: true; needId: string } | { ok: false; error: string }

export async function createMilestoneNeed(raw: unknown): Promise<CreateMilestoneNeedResult> {
  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid need.' }
  }
  const { campaignRef, milestoneId, superpower, orientation, cardId, unit, title } = parsed.data
  const gate = await requireSteward(campaignRef)
  if (!gate.ok) return { ok: false, error: gate.error }

  // Milestone must belong to this campaignRef.
  const milestone = await db.campaignMilestone.findFirst({
    where: { id: milestoneId, campaignRef: campaignRef.trim() },
    select: { id: true },
  })
  if (!milestone) return { ok: false, error: 'Milestone not found for this campaign.' }

  // Six Faces: actions are never weighted — one action = 1. Money/hours carry the amount.
  const value = unit === 'action' ? 1 : parsed.data.value ?? 1

  const need = await db.milestoneNeed.create({
    data: { milestoneId, campaignRef: campaignRef.trim(), superpower, orientation, cardId, unit, value, title: title || null },
    select: { id: true },
  })
  revalidatePath(`/admin/campaign/${campaignRef}/needs`)
  return { ok: true, needId: need.id }
}

const deleteSchema = z.object({ needId: z.string().trim().min(1) })

export type DeleteMilestoneNeedResult = { ok: true } | { ok: false; error: string }

export async function deleteMilestoneNeed(raw: unknown): Promise<DeleteMilestoneNeedResult> {
  const parsed = deleteSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const need = await db.milestoneNeed.findUnique({
    where: { id: parsed.data.needId },
    select: { id: true, campaignRef: true, status: true },
  })
  if (!need) return { ok: false, error: 'Need not found.' }

  const gate = await requireSteward(need.campaignRef)
  if (!gate.ok) return { ok: false, error: gate.error }
  if (need.status === 'done') return { ok: false, error: 'Cannot delete a completed need.' }

  await db.milestoneNeed.delete({ where: { id: need.id } })
  revalidatePath(`/admin/campaign/${need.campaignRef}/needs`)
  return { ok: true }
}
