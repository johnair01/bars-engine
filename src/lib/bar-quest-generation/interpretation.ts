/**
 * BAR interpretation layer for quest generation
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 2
 */

import type { BarInterpretation, QuestType } from './types'

/** Domain → default quest type (phase_1_opening_momentum bias) */
const DOMAIN_QUEST_TYPE: Record<string, QuestType> = {
  GATHERING_RESOURCES: 'resource',
  SKILLFUL_ORGANIZING: 'coordination',
  RAISE_AWARENESS: 'awareness',
  DIRECT_ACTION: 'action',
}

/** Keywords that suggest a quest type (override domain default when present) */
const QUEST_TYPE_KEYWORDS: Record<QuestType, string[]> = {
  resource: ['fund', 'donate', 'support', 'contribute', 'patron', 'residency', 'job lead', 'material'],
  coordination: ['connect', 'collaborate', 'organize', 'skill', 'schedule', 'meet', 'pair'],
  awareness: ['share', 'invite', 'post', 'signal', 'story', 'reflect', 'public'],
  action: ['test', 'run', 'complete', 'challenge', 'session', 'do', 'execute'],
  reflection: ['clarify', 'refine', 'deepen', 'meaning', 'interpret', 'intention'],
}

export interface InterpretBarInput {
  id: string
  title: string
  description: string
  allyshipDomain: string | null
  campaignRef: string | null
  type?: string
  moveType?: string | null
  /** From Instance.kotterStage when campaign-linked; default 1. */
  kotterStage?: number
  /** Stable phase key from `kotterStageToCampaignPhaseKey` (campaign-phase.ts). */
  campaignPhaseKey?: string
}

/**
 * Interpret a BAR into a structured quest-generation proposal.
 * Derives quest type from domain (with keyword hints), suggested title/prompt, and tags.
 */
export function interpretBarForQuestGeneration(bar: InterpretBarInput): BarInterpretation {
  const domain = (bar.allyshipDomain || '').trim().toUpperCase() || 'GATHERING_RESOURCES'
  const title = (bar.title || '').trim()
  const description = (bar.description || '').trim()
  const combined = `${title} ${description}`.toLowerCase()

  // Quest type: keyword hint overrides domain default
  let questType = DOMAIN_QUEST_TYPE[domain] ?? 'resource'
  for (const [type, keywords] of Object.entries(QUEST_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      questType = type as QuestType
      break
    }
  }

  // Tags from domain + BAR type
  const sourceContextTags: string[] = [domain]
  if (bar.type) sourceContextTags.push(bar.type)
  if (bar.moveType) sourceContextTags.push(bar.moveType)

  const desiredOutcomeTags: string[] = [questType, `domain:${domain}`]

  const kotterStage =
    bar.kotterStage != null && Number.isFinite(bar.kotterStage)
      ? Math.max(1, Math.min(8, Math.round(bar.kotterStage)))
      : undefined
  const campaignPhaseKey = bar.campaignPhaseKey

  if (kotterStage != null) {
    sourceContextTags.push(`kotter:${kotterStage}`)
    desiredOutcomeTags.push(`kotter_stage:${kotterStage}`)
  }
  if (campaignPhaseKey) {
    sourceContextTags.push(`phase:${campaignPhaseKey}`)
    desiredOutcomeTags.push(`phase:${campaignPhaseKey}`)
  }

  // Suggested title: use BAR title, cleaned
  const suggestedTitle = title || 'Generated Quest'

  // Suggested prompt: BAR description as quest prompt
  const suggestedPrompt = description || title

  // Confidence: base 0.7, +0.1 if domain valid, +0.1 if content substantial
  let confidenceScore = 0.7
  if (DOMAIN_QUEST_TYPE[domain]) confidenceScore += 0.1
  if (description.length >= 50) confidenceScore += 0.1
  confidenceScore = Math.min(confidenceScore, 1)

  const reviewNotes: string[] = []
  if (!bar.allyshipDomain) reviewNotes.push('Domain inferred from defaults')
  if (description.length < 30) reviewNotes.push('Short description; consider expanding')
  if (kotterStage != null && campaignPhaseKey) {
    reviewNotes.push(`Campaign phase: ${campaignPhaseKey} (Kotter stage ${kotterStage})`)
  }

  return {
    barId: bar.id,
    questGenerationCandidate: true,
    domain,
    questType,
    sourceContextTags,
    desiredOutcomeTags,
    suggestedTitle,
    suggestedPrompt,
    confidenceScore,
    reviewNotes,
    ...(kotterStage != null ? { campaignKotterStage: kotterStage } : {}),
    ...(campaignPhaseKey ? { campaignPhaseKey } : {}),
  }
}
