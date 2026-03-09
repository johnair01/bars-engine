/**
 * BAR → Quest Generation Engine types
 * @see .specify/specs/bar-quest-generation-engine/spec.md
 */

export type QuestProposalReviewStatus = 'pending' | 'approved' | 'rejected' | 'deferred'

export type QuestType =
  | 'resource'
  | 'coordination'
  | 'awareness'
  | 'action'
  | 'reflection'

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string }

export interface BarEligibilityInput {
  id: string
  title: string
  description: string
  status: string
  allyshipDomain: string | null
  campaignRef: string | null
  creatorId: string
}

/** Output of interpretBarForQuestGeneration (Part 2) */
export interface BarInterpretation {
  barId: string
  questGenerationCandidate: true
  domain: string
  questType: QuestType
  sourceContextTags: string[]
  desiredOutcomeTags: string[]
  suggestedTitle: string
  suggestedPrompt: string
  confidenceScore: number
  reviewNotes: string[]
}

/** Emotional alchemy resolution result for proposal */
export interface EmotionalAlchemyResult {
  status: 'resolved' | 'unresolved'
  moveId: string | null
  moveName: string | null
  prompt: string | null
  completionReflection: string | null
}
