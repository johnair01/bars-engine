/**
 * Bruised Banana / active-instance milestone throughput (BBMT).
 * @see .specify/specs/bruised-banana-milestone-throughput/spec.md
 */

export type MilestoneSnapshot = {
  campaignRef: string
  instanceName: string | null
  kotterStage: number
  kotterStageName: string
  kotterEmoji: string
  /** Domain × Kotter action line when domain is known */
  stageActionLine: string | null
  goalAmountCents: number | null
  currentAmountCents: number
  /** 0–1 */
  progress01: number
  /** Short fundraising line, e.g. "$120 of $3,000" */
  fundraisingLine: string | null
  /** Optional campaign window */
  dateLine: string | null
  /** True when slug/ref is the Bruised Banana residency (copy tuning) */
  isBruisedBananaCampaign: boolean
}

export type GuidedActionKind =
  | 'onboarding'
  | 'vault'
  | 'gameboard'
  | 'hub'
  | 'event'
  | 'market'
  | 'campaign'

export type GuidedAction = {
  kind: GuidedActionKind
  label: string
  href: string
  /** Secondary line for vault / onboarding */
  hint?: string
}

export type GuidanceContext = {
  campaignRef: string
  onboardingComplete: boolean
  vaultDraftsAtCap: boolean
  vaultUnplacedAtCap: boolean
  hasGameboardParticipation: boolean
  isEventMode: boolean
}

export type CampaignMilestoneGuidance = {
  snapshot: MilestoneSnapshot
  /** Primary-first; max 3 */
  guidedActions: GuidedAction[]
}
