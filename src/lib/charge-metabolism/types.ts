import type { AllyshipDomain } from '@/lib/allyship-deck/types'
import type { AlchemyPracticeRoute, AlchemyRouteMode } from '@/lib/alchemy/move-planner'
import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type {
  ShowUpCardContext,
  ShowUpOrientation,
  ShowUpRecommendation,
  ShowUpSubject,
} from '@/lib/alchemy/show-up-primitives'
import type {
  VectorMoveMechanicOperation,
  VectorMovePracticeLens,
  VectorMovePracticeVariant,
} from '@/lib/alchemy/vector-move-families'
import type { Superpower } from '@/lib/superpowers/types'

export type MoveAttemptSource =
  | 'allyship_deck'
  | 'daily_charge'
  | 'bar_capture'
  | 'bar_tune'
  | 'shadow_321'
  | 'quest_completion'
  | 'alchemy_engine'
  | 'campaign_support'
  | 'admin_generated'

export type MoveAttemptStatus =
  | 'recommended'
  | 'chosen'
  | 'practiced'
  | 'reflected'
  | 'completed'
  | 'skipped'
  | 'abandoned'
  | 'needs_followup'

export type MoveAttemptVectorStatus = 'none' | 'partial' | 'full'
export type MoveRecommendationRole = 'metabolize' | 'translate' | 'transcend' | 'satisfaction' | 'single'

export type MoveAttemptMissingField =
  | 'present'
  | 'desired'
  | 'blocker'

export type ChargeStateInput = AlchemyState | string | null | undefined

export interface MoveAttemptContext {
  sourceSurface: MoveAttemptSource
  playerId?: string
  campaignRef?: string
  stewardId?: string
  barId?: string
  questId?: string
  deckCardId?: string
  shadow321SessionId?: string
  alchemyArcId?: string
}

export interface MoveRecommendationServiceInput extends MoveAttemptContext {
  present?: ChargeStateInput
  desired?: ChargeStateInput
  blocker?: string
  orientation?: ShowUpOrientation
  subject?: ShowUpSubject
  superpower?: Superpower
  domain?: AllyshipDomain
  cardContext?: ShowUpCardContext
  mode?: AlchemyRouteMode
  maxAlternates?: number
}

export interface MoveAttemptDraft {
  sourceSurface: MoveAttemptSource
  status: MoveAttemptStatus
  context: MoveAttemptContext
  vectorStatus: MoveAttemptVectorStatus
  vectorSnapshot?: {
    present: AlchemyState
    desired: AlchemyState
    blocker: string
  }
  routeSnapshot?: AlchemyPracticeRoute
  recommendationRole?: MoveRecommendationRole
  recommendedPrimitiveIds: string[]
  chosenPrimitiveId?: string
  translationSnapshot?: ShowUpRecommendation['move']
  mechanicOperationSnapshot?: VectorMoveMechanicOperation
  selectedPracticeLens?: VectorMovePracticeLens
  selectedPracticeVariant?: VectorMovePracticeVariant
  artifactText?: string
  reflectionText?: string
  outcome?: string
}

export type MoveAttemptLifecycleEvent =
  | 'choose'
  | 'skip'
  | 'practice'
  | 'reflect'
  | 'complete'
  | 'abandon'
  | 'needs_followup'

export interface MoveAttemptLifecyclePatch {
  chosenPrimitiveId?: string
  artifactText?: string
  reflectionText?: string
  outcome?: string
}

export type MoveAttemptLifecycleResult =
  | { success: true; attempt: MoveAttemptDraft }
  | { success: false; reason: string }

export interface MoveRecommendationServiceResult {
  vectorStatus: MoveAttemptVectorStatus
  missingFields: MoveAttemptMissingField[]
  nextQuestion: string | null
  presentState: AlchemyState | null
  desiredState: AlchemyState | null
  routes: AlchemyPracticeRoute[]
  routeHandRecommendations: ShowUpRecommendation[]
  routeHandAttemptDrafts: MoveAttemptDraft[]
  metabolizeRecommendation: ShowUpRecommendation | null
  satisfactionRecommendation: ShowUpRecommendation | null
  primaryRecommendation: ShowUpRecommendation | null
  alternateRecommendations: ShowUpRecommendation[]
  metabolizeAttemptDraft: MoveAttemptDraft | null
  satisfactionAttemptDraft: MoveAttemptDraft | null
  attemptDraft: MoveAttemptDraft | null
}
