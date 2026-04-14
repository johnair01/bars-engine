/**
 * CYOA Composer — Build Contract System
 *
 * Adaptive player-facing composer that produces immutable CyoaBuild receipts.
 * Universal component with GM-overridable step ordering per campaign.
 */

// Types
export type {
  ComposerStepId,
  ComposerDataKey,
  ComposerDataBag,
  SkipCondition,
  StepDefinition,
  ComposerStepOverrideEntry,
  ComposerStepOverrides,
  ComposerStepOverridesDb,
  ResolvedStep,
} from './types'

// Step registry
export {
  getDefaultSteps,
  getDefaultStep,
  resolveStepOrder,
  getNextActiveStep,
  getRemainingStepCount,
  validateStepOverrides,
  parseComposerStepOverrides,
  serializeComposerStepOverrides,
} from './step-registry'

// Adaptive resolution engine
export type {
  PlayerComposerContext,
  AdaptiveResolution,
  PrefilledSource,
} from './adaptive-resolver'

export {
  resolveAdaptiveSteps,
  validateStepDependencies,
  canEnterStep,
  getActiveStepAtIndex,
  getActiveStepIndex,
  advanceAndResolve,
  buildStateToBag,
} from './adaptive-resolver'

// Override merge logic (multi-layer precedence resolution)
export type {
  OverrideLayer,
  MergedOverrides,
  MergedResolvedStep,
} from './merge-overrides'

export {
  mergeOverrideLayers,
  mergeCampaignOverrides,
  resolveStepOrderWithLayers,
  resolveCampaignStepOrder,
  getNextActiveStepFromLayers,
  getRemainingStepCountFromLayers,
} from './merge-overrides'

// Checkpoint persistence (auto-save on every node transition)
export type {
  CheckpointStatePatch,
  CheckpointRestoreResult,
  CheckpointNodeMeta,
} from './checkpoint-persistence'

export {
  buildCheckpointPatch,
  restoreCheckpoint,
  mergeCheckpointIntoState,
  shouldCheckpointOnTransition,
  buildCheckpointNodeMeta,
} from './checkpoint-persistence'

// Branch-visibility filtering engine
export type {
  FaceOption,
  NarrativeTemplateOption,
  WaveMoveOption,
  FilteredOptionSet,
  StepVisibilitySummary,
  BranchConstraints,
  TemplateCatalogEntry,
  CampaignBranchConfig,
  WaveMoveRestrictions,
} from './branch-visibility'

export {
  extractConstraints,
  filterFaceOptions,
  filterNarrativeTemplateOptions,
  filterWaveMoveOptions,
  computeFilteredOptions,
  getVisibleFaces,
  getVisibleTemplates,
  getVisibleMoves,
  getAutoResolvedValue,
  sortFacesByAffinity,
  FACE_MOVE_AFFINITY,
} from './branch-visibility'

// Face recommendation resolver (completedBuilds → weighted face suggestions)
export type {
  FaceRecommendation,
  ScoreBreakdown,
  FaceRecommendationResult,
} from './face-recommendation'

export {
  resolveFaceRecommendations,
  getTopFaceRecommendations,
  isTopRecommendedFace,
  getRecommendationForFace,
  getFaceExplorationProgress,
  EXPLORATION_BONUS,
  RECENCY_PENALTY,
  EMOTIONAL_AFFINITY_BONUS,
  BALANCE_BONUS,
  BASE_SCORE,
  CHANNEL_FACE_AFFINITY,
} from './face-recommendation'

// Branch-point detection (revalidation-eligible fork identification)
export type {
  BranchPointKind,
  BranchPointResult,
  RevalidationAspect,
  RevalidationCheck,
} from './branch-point-detection'

export {
  classifyNodeById,
  detectBranchPoint,
  isSelectionStep,
  shouldRevalidateOnResume,
  computeRevalidationChecks,
  isBranchPoint,
} from './branch-point-detection'
