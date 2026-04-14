/**
 * NarrativeTemplate — Unified Template Registry
 *
 * Shared spine + kind-specific JSON config for the NarrativeTemplate model.
 * Replaces scattered template patterns with a single registry of narrative
 * templates (quest, adventure, event, threshold, onboarding).
 *
 * @module narrative-template
 */

// Types
export type {
  NarrativeTemplateKind,
  EpiphanyConfig,
  KotterConfig,
  OrientationConfig,
  CustomConfig,
  BeatOverride,
  OrientationSubPacket,
  NarrativeTemplateConfig,
  NarrativeTemplateRow,
  TypedNarrativeTemplate,
  NarrativeTemplateSummary,
  CreateNarrativeTemplateInput,
  UpdateNarrativeTemplateInput,
} from './types'

export { NARRATIVE_TEMPLATE_KINDS } from './types'

// Schemas
export {
  narrativeTemplateKindSchema,
  segmentVariantSchema,
  questModelSchema,
  templateStatusSchema,
  epiphanyBeatTypeSchema,
  kotterBeatTypeSchema,
  beatOverrideSchema,
  orientationSubPacketSchema,
  epiphanyConfigSchema,
  kotterConfigSchema,
  orientationConfigSchema,
  customConfigSchema,
  parseConfigBlob,
  narrativeTemplateSpineSchema,
  narrativeTemplateSummarySchema,
  createNarrativeTemplateInputSchema,
  updateNarrativeTemplateInputSchema,
  parseNarrativeTemplateSpine,
  parseNarrativeTemplateSummary,
  parseNarrativeTemplateWithConfig,
  parseCreateInput,
} from './schemas'

// Narrowing utilities (type-safe boundary validation)
export {
  narrowConfigBlob,
  narrowConfigBlobOrThrow,
  narrowNarrativeTemplate,
  narrowNarrativeTemplateOrThrow,
  isEpiphanyConfig,
  isKotterConfig,
  isOrientationConfig,
  isCustomConfig,
  isValidConfigForKind,
} from './narrow'

// Backwards-compatibility adapters (QuestTemplate / AdventureTemplate → NarrativeTemplate)
export {
  toAdventureTemplateView,
  toAdventureTemplateViews,
  toQuestTemplateSeedView,
  toQuestTemplateSeedViews,
  toQuestWizardTemplate,
  toQuestWizardTemplates,
  extractComposerStepOverrides,
  isMigratedFromQuestTemplate,
  isMigratedFromAdventureTemplate,
  stripMigrationPrefix,
} from './compat'

export type {
  LegacyAdventureTemplate,
  LegacyQuestTemplateSeed,
  LegacyQuestTemplate,
  LegacyQuestInputConfig,
} from './compat'

// Preview types + Wuxing palette mapping
export type {
  WuxingPalette,
  TemplatePreviewPalette,
  NarrativeTemplatePreview,
} from './preview'

export {
  resolveWuxingPalette,
  resolveTemplatePreviewPalette,
  buildNarrativeTemplatePreview,
  resolveWuxingPaletteFromLowercase,
} from './preview'

// Inferred types from schemas
export type {
  NarrativeTemplateKindParsed,
  EpiphanyConfigParsed,
  KotterConfigParsed,
  OrientationConfigParsed,
  CustomConfigParsed,
  NarrativeTemplateSpineParsed,
  NarrativeTemplateSummaryParsed,
  CreateNarrativeTemplateInputParsed,
  UpdateNarrativeTemplateInputParsed,
} from './schemas'
