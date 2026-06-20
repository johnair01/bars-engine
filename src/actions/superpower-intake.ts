'use server'

/**
 * Superpower discovery intake — server action (campaign Phase 2, FR6).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *       .specify/specs/superpower-quiz-design/spec.md
 *
 * Scores the discovery quiz and returns the routing result + reveal copy. The
 * scoring is deterministic and offline (no AI). NO email gate, no DB write here:
 * per-campaign persistence of the result lands in Phase 4 on
 * `CampaignMembership.superpower` / `.superpowerOrientation` (additive migration).
 * Until then this is a stateless scoring endpoint the reveal UI consumes.
 */
import { z } from 'zod'
import { resolveSuperpowerIntake, type SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'

const answerSchema = z.object({
  itemId: z.string().min(1),
  optionId: z.string().min(1),
})

const submitSchema = z.object({
  answers: z.array(answerSchema).min(1, 'Answer at least one question.'),
  orientation: z.enum(['internal', 'external']).nullish(),
  /** Per-campaign context; reserved for Phase 4 persistence. */
  campaignRef: z.string().trim().min(1).max(64).optional(),
})

export type SubmitSuperpowerIntakeResult =
  | { ok: true; outcome: SuperpowerIntakeOutcome }
  | { ok: false; error: string }

export async function submitSuperpowerIntake(raw: unknown): Promise<SubmitSuperpowerIntakeResult> {
  const parsed = submitSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().formErrors.join('; ') || 'Invalid intake submission.',
    }
  }

  const { answers, orientation } = parsed.data
  const outcome = resolveSuperpowerIntake(answers, orientation ?? null)

  // Phase 4: persist `outcome.routing` on CampaignMembership for `campaignRef`
  // (additive migration). Intentionally not written yet — see file header.
  return { ok: true, outcome }
}
