/**
 * Alchemy Engine — barrel export
 *
 * 3-phase CYOA arc: Intake → Action → Reflection
 * Vertical slice: Challenger face + Wake Up WAVE move
 */

export type {
  ArcPhase,
  RegulationState,
  AlchemyEngineState,
  PhaseAdvanceResult,
  PhaseBarType,
  ChallengerMoveId,
} from './types'

export {
  ARC_PHASES,
  PHASE_REGULATION_MAP,
  PHASE_INDEX,
  PHASE_BAR_CHANNEL_TYPE,
  VERTICAL_SLICE,
  CHALLENGER_MOVE_IDS,
  CHALLENGER_MOVE_META,
  isArcPhase,
  isRegulationState,
  isChallengerMoveId,
  nextPhase,
  canAdvancePhase,
  regulationAfterPhase,
} from './types'

export {
  getEngineState,
  initializeArc,
  completePhase,
  resetArc,
} from './player-state'

export type {
  IntakePhaseData,
  ActionPhaseData,
  ReflectionContext,
  ReflectionPrompt,
} from './reflection-aggregator'

export {
  aggregateReflectionContext,
  buildReflectionContextFromData,
  deriveEpiphanyTitle,
} from './reflection-aggregator'

export type {
  BarCreateData,
  ActionBarMetadata,
  IntakeBarMetadata,
  ReflectionBarMetadata,
  ActionBarContext,
  IntakeBarContext,
  ReflectionBarContext,
} from './bar-production'

export {
  buildActionBarData,
  buildIntakeBarData,
  buildReflectionBarData,
  persistBarInTransaction,
  parseBarAlchemyMetadata,
  isAlchemyBar,
  getActionBarChallengerMove,
  getChallengerMoveElement,
  getChallengerMoveEnergyDelta,
} from './bar-production'

export type {
  ReflectionCompletionSuggestion,
  ReflectionCompletionSet,
  AICompletionSetOutput,
} from './reflection-generation'

export {
  buildStaticCompletionSuggestions,
  generateReflectionCompletions,
  buildCompletionSystemPrompt,
  buildCompletionUserPrompt,
  aiCompletionSetSchema,
  getChannelElement,
  getChannelNeighbors,
} from './reflection-generation'

export type {
  SceneContext,
  PriorPhaseContent,
  GeneratedPassage,
  GeneratedPassageAIOutput,
  GeneratePassageOptions,
  GeneratePassageWithCacheOptions,
} from './ai-generation'

export {
  generatePassage,
  generatePassageWithCache,
  buildStaticPassage,
  buildPrompts,
  generatedPassageSchema,
  isAIGenerationAvailable,
} from './ai-generation'

export type {
  TemplateBankKey,
  TemplateBankKeyString,
  ChannelContentSlot,
  PassageChoice,
  PassageTemplate,
  TemplateBank,
  TemplateBankMetadata,
  TemplateBankQuery,
  TemplateBankLookupResult,
  ReflectionPassageExtension,
  ReflectionPassageTemplate,
  VerticalSliceSeedData,
} from './template-bank-types'

export {
  toTemplateBankKey,
  parseTemplateBankKey,
  resolveChannelContent,
  isReflectionPassage,
  isValidTemplateBankKey,
} from './template-bank-types'

export {
  CHALLENGER_WAKEUP_SEED,
  buildVerticalSliceBank,
  getVerticalSliceTemplate,
  getVerticalSliceReflectionTemplate,
} from './template-bank-data'

export type {
  TemplateBankPassage,
  ResolvedChoice,
  TemplateBankReflectionPassage,
} from './template-bank-service'

export {
  lookupTemplate,
  queryPassage,
  queryReflectionPassage,
  getVerticalSlicePassage,
  getVerticalSliceReflection,
  hasTemplate,
  validateArcCoverage,
  getPhaseRegulationRequirement,
  listTemplateKeys,
  getBankMetadata,
} from './template-bank-service'

export type {
  ContentSource,
  FallbackReason,
  ResolvedPassage,
  ResolvedReflectionCompletions,
  AIAvailabilityStatus,
  ResolvePassageOptions,
} from './passage-resolver'

export {
  resolvePassage,
  resolveReflectionCompletions,
  resolveTemplatePassage,
  resolveSlot,
  getPhaseTemplate,
  getReflectionTemplate,
  checkAIAvailability,
} from './passage-resolver'

export type {
  ValidationIssue,
  ValidationResult,
  SuggestionKey,
  SuggestionFraming,
} from './reflection-validation'

export {
  validateSuggestion,
  validateCompletionSet,
  validateSuggestionBarConformance,
  validateCompletionSetWithBarConformance,
  assertValidSuggestion,
  assertValidCompletionSet,
  sanitizeSuggestion,
  explainValidation,
  isValidChannel,
  isValidSuggestionKey,
  isValidFraming,
  reflectionSuggestionSchema,
  reflectionCompletionSetSchema,
  KEY_FRAMING_MAP,
  CHANNEL_ELEMENT_MAP,
  SHENG_NEIGHBOR,
  KE_NEIGHBOR,
  VALID_CHANNELS,
  VALID_SUGGESTION_KEYS,
  VALID_FRAMINGS,
} from './reflection-validation'
