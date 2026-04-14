/**
 * Alchemy Engine — 3-phase CYOA arc components
 *
 * Vertical slice: Challenger face + Wake Up WAVE move
 * Intake (dissatisfied) → Action (neutral) → Reflection (epiphany)
 */

// Arc runner — orchestrates the full 3-phase flow
export { AlchemyArcRunner } from './AlchemyArcRunner'
export type { AlchemyArcRunnerProps } from './AlchemyArcRunner'

// Phase 1: Intake
export { IntakePhaseStep, DEFAULT_INTAKE_PROMPTS } from './IntakePhaseStep'
export type { IntakePhaseState, IntakePhaseStepProps, IntakePrompt } from './IntakePhaseStep'

// Phase 2: Action
export { ActionPhaseStep, CHALLENGER_MOVES } from './ActionPhaseStep'
export type { ActionPhaseState, ActionPhaseStepProps, ChallengerMoveChoice } from './ActionPhaseStep'

// Phase 3: Reflection
export { ReflectionPhaseStep, DEFAULT_CHALLENGER_REFLECTIONS } from './ReflectionPhaseStep'
export type {
  ReflectionPhaseState,
  ReflectionPhaseStepProps,
  ReflectionCompletion,
  ReflectionMode,
} from './ReflectionPhaseStep'

// Shared: Selectable completion options list
export { CompletionOptionsList, useCompletionSelection } from './CompletionOptionsList'
export type {
  CompletionOption,
  CompletionSelectionState,
  CompletionOptionsListProps,
} from './CompletionOptionsList'
