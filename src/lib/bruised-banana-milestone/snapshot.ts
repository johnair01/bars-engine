import { KOTTER_STAGES } from '@/lib/kotter'
import { getStageAction, type AllyshipDomain } from '@/lib/kotter'
import type { MilestoneSnapshot } from './types'

const DEFAULT_REF = 'bruised-banana'

export type InstanceLikeForSnapshot = {
  name: string
  slug?: string
  campaignRef: string | null
  kotterStage: number
  goalAmountCents: number | null
  currentAmountCents: number
  startDate: Date | null
  endDate: Date | null
  allyshipDomain: string | null
  /** When true, event-mode instance may show fundraising strip outside BB ref. */
  isEventMode?: boolean
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function formatUsdCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Pure: build milestone snapshot from instance row fields.
 */
export function buildMilestoneSnapshot(
  instance: InstanceLikeForSnapshot | null,
  options?: { campaignRefOverride?: string }
): MilestoneSnapshot | null {
  if (!instance) return null

  const campaignRef =
    options?.campaignRefOverride ?? instance.campaignRef ?? DEFAULT_REF
  const stage = Math.max(1, Math.min(8, instance.kotterStage || 1)) as keyof typeof KOTTER_STAGES
  const ks = KOTTER_STAGES[stage]
  const domain = (instance.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain
  const stageActionLine = getStageAction(stage, domain)

  const goal = instance.goalAmountCents
  const current = instance.currentAmountCents ?? 0
  const progress01 =
    goal != null && goal > 0 ? clamp01(current / goal) : 0

  let fundraisingLine: string | null = null
  if (goal != null && goal > 0) {
    fundraisingLine = `${formatUsdCents(current)} of ${formatUsdCents(goal)}`
  }

  let dateLine: string | null = null
  if (instance.startDate && instance.endDate) {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    dateLine = `${fmt.format(instance.startDate)} – ${fmt.format(instance.endDate)}`
  }

  const isBruisedBananaCampaign =
    campaignRef === DEFAULT_REF ||
    instance.campaignRef === DEFAULT_REF ||
    instance.slug === DEFAULT_REF

  return {
    campaignRef,
    instanceName: instance.name,
    kotterStage: stage,
    kotterStageName: ks.name,
    kotterEmoji: ks.emoji,
    stageActionLine,
    goalAmountCents: goal,
    currentAmountCents: current,
    progress01,
    fundraisingLine,
    dateLine,
    isBruisedBananaCampaign,
  }
}
