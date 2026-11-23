/**
 * Onboarding CYOA Generator — Types
 *
 * API contracts for generating onboarding CYOA from Campaign Owner unpacking.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

import type { UnpackingAnswers } from '@/lib/quest-grammar'
import type { IChingContext } from '@/lib/quest-grammar'
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export type OnboardingOutcome = 'donate' | 'signup'

export interface OnboardingCYOAInput {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  segment: 'player' | 'sponsor'
  campaignRef: string
  outcomes: OnboardingOutcome[]
  /** The domain the player chose. Required by the compiler: nothing infers one. */
  chosenDomain: AllyshipDomainKey
}

export interface RandomTestInput {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  ichingContext: IChingContext
  nationId: string | null
  playbookId: string | null
  /** The domain the player chose. Required by the compiler: nothing infers one. */
  chosenDomain: AllyshipDomainKey
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
