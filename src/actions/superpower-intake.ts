'use server'

/**
 * Superpower discovery intake — server action (campaign Phase 2/3, FR6 + T3.5a).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *       .specify/specs/superpower-quiz-design/spec.md
 *
 * Scores the discovery quiz (deterministic, offline — no AI), returns routing +
 * reveal copy, and — best-effort — persists the result PER CAMPAIGN on the
 * player's CampaignMembership (creating a MEMBER membership if needed). NO email
 * gate. Persistence never blocks the reveal: a logged-out player or an unknown
 * campaignRef simply gets the result with `persisted: false`.
 */
import { z } from 'zod'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveSuperpowerIntake, type SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'

const answerSchema = z.object({
  itemId: z.string().min(1),
  optionId: z.string().min(1),
})

const submitSchema = z.object({
  answers: z.array(answerSchema).min(1, 'Answer at least one question.'),
  orientation: z.enum(['internal', 'external']).nullish(),
  /** Per-campaign context for persisting the result on CampaignMembership. */
  campaignRef: z.string().trim().min(1).max(64).optional(),
})

export type SubmitSuperpowerIntakeResult =
  | { ok: true; outcome: SuperpowerIntakeOutcome; persisted: boolean }
  | { ok: false; error: string }

/**
 * Best-effort: store the result on the player's per-campaign membership.
 * Returns whether anything was written. Never throws (logs + returns false).
 */
async function persistResult(
  campaignRef: string | undefined,
  playerId: string,
  outcome: SuperpowerIntakeOutcome,
): Promise<boolean> {
  if (!campaignRef) return false
  try {
    const campaign = await db.campaign.findFirst({ where: { slug: campaignRef }, select: { id: true } })
    if (!campaign) return false
    await db.campaignMembership.upsert({
      where: { campaignId_playerId: { campaignId: campaign.id, playerId } },
      update: {
        superpower: outcome.routing.superpower,
        superpowerOrientation: outcome.routing.orientation,
      },
      create: {
        campaignId: campaign.id,
        playerId,
        role: 'MEMBER',
        superpower: outcome.routing.superpower,
        superpowerOrientation: outcome.routing.orientation,
      },
    })
    return true
  } catch (e) {
    console.error('[submitSuperpowerIntake] persist failed', e)
    return false
  }
}

export async function submitSuperpowerIntake(raw: unknown): Promise<SubmitSuperpowerIntakeResult> {
  const parsed = submitSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().formErrors.join('; ') || 'Invalid intake submission.',
    }
  }

  const { answers, orientation, campaignRef } = parsed.data
  const outcome = resolveSuperpowerIntake(answers, orientation ?? null)

  const player = await getCurrentPlayer()
  const persisted = player ? await persistResult(campaignRef, player.id, outcome) : false

  return { ok: true, outcome, persisted }
}
