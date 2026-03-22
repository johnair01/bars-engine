/**
 * BAR → Quest Generation Engine
 * @see .specify/specs/bar-quest-generation-engine/spec.md
 */

export {
  checkBarEligibilityForQuestGeneration,
  checkBarEligibility,
} from './eligibility'

export { interpretBarForQuestGeneration } from './interpretation'
export type { InterpretBarInput } from './interpretation'

export {
  resolveEmotionalAlchemyForBar,
  resolveEmotionalAlchemyForPlayerContext,
  buildWizardEmotionalAlchemyCompletionPayload,
} from './emotional-alchemy'
export type { WizardEmotionalAlchemyCompletionPayload } from './emotional-alchemy'

export { buildQuestProposalFromInterpretation } from './proposal-builder'
export type { BuildProposalInput } from './proposal-builder'

export { generateQuestProposalFromBar } from './generate'
export { publishQuestProposal } from './publish'

export {
  getKotterStageForCampaignRef,
  kotterStageToCampaignPhaseKey,
} from './campaign-phase'

export type {
  BarEligibilityInput,
  BarInterpretation,
  EmotionalAlchemyResult,
  EligibilityResult,
  QuestProposalReviewStatus,
  QuestType,
} from './types'
