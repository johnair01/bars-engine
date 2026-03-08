/**
 * Onboarding CYOA Generator
 *
 * Campaign Owner unpacking → Donate/Sign Up CYOA.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

export { generateOnboardingCYOA } from './generateOnboardingCYOA'
export { generateRandomTestInput } from './generateRandomTestInput'
export { validateQuestGrammar } from './validateQuestGrammar'
export type {
  OnboardingCYOAInput,
  OnboardingOutcome,
  RandomTestInput,
  ValidationReport,
  ValidationFailure,
} from './types'
