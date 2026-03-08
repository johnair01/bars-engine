/**
 * Onboarding CYOA Generator — Types
 *
 * API contracts for generating onboarding CYOA from Campaign Owner unpacking.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

import type { UnpackingAnswers } from '@/lib/quest-grammar'
import type { IChingContext } from '@/lib/quest-grammar'

export type OnboardingOutcome = 'donate' | 'signup'

export interface OnboardingCYOAInput {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  segment: 'player' | 'sponsor'
  campaignRef: string
  outcomes: OnboardingOutcome[]
}

export interface RandomTestInput {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  ichingContext: IChingContext
  nationId: string | null
  playbookId: string | null
}

export interface ValidationFailure {
  iteration: number
  error: string
  input?: Partial<RandomTestInput>
}

export interface ValidationReport {
  pass: boolean
  iterations: number
  failures: ValidationFailure[]
}
