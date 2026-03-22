/**
 * Campaign / Kotter phase resolution for BAR → Quest proposals (FM T4.1).
 * @see .specify/specs/bar-quest-generation-engine/spec.md — Phase 4 optional
 */

import { db } from '@/lib/db'
import { KOTTER_STAGES } from '@/lib/kotter'

/**
 * Resolve Kotter stage (1–8) for a BAR's campaign ref by matching `Instance.slug` or `Instance.campaignRef`.
 * Personal BARs (no ref) default to stage **1** (opening momentum / urgency).
 * Unknown ref → **1** (safe default for move resolution).
 */
export async function getKotterStageForCampaignRef(
  campaignRef: string | null | undefined
): Promise<number> {
  const ref = (campaignRef || '').trim()
  if (!ref) return 1

  const instance = await db.instance.findFirst({
    where: {
      OR: [{ slug: ref }, { campaignRef: ref }],
    },
    select: { kotterStage: true },
  })

  if (!instance) return 1

  const k = instance.kotterStage
  if (typeof k !== 'number' || !Number.isFinite(k)) return 1
  return Math.max(1, Math.min(8, Math.round(k)))
}

/**
 * Stable key for admin / proposal JSON. Stage 1 = campaign-map “opening momentum” + Kotter urgency.
 */
export function kotterStageToCampaignPhaseKey(stage: number): string {
  const s = Math.max(1, Math.min(8, Math.round(stage)))
  if (s === 1) return 'phase_1_opening_momentum'
  const info = KOTTER_STAGES[s as keyof typeof KOTTER_STAGES]
  const nameSlug = (info?.name ?? `stage_${s}`).replace(/\s+/g, '_').toLowerCase()
  return `kotter_stage_${s}_${nameSlug}`
}
