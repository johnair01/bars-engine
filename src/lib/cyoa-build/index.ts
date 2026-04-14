/**
 * CYOA Build Contract — public API
 *
 * @see ./types.ts for full type definitions
 * @see ./schemas.ts for Zod validation schemas
 */

export type {
  CyoaBuild,
  CyoaBuildDraft,
  CyoaBuildInput,
  CyoaBuildLedgerEntry,
  CyoaBuildValidationError,
  CyoaBuildValidationResult,
  CampaignSnapshot,
  WaveMoveSpine,
} from './types'

export {
  createCyoaBuild,
  freezeCyoaBuild,
  isCyoaBuildComplete,
  validateCyoaBuildInput,
} from './types'

// -- Zod schemas for runtime validation at serialization boundaries -----------

export {
  // Primitive schemas (reusable)
  emotionalChannelSchema,
  alchemyAltitudeSchema,
  emotionalVectorSchema,
  personalMoveTypeSchema,

  // Composite schemas
  waveMoveSpineSchema,
  campaignSnapshotSchema,
  cyoaBuildInputSchema,
  cyoaBuildSchema,
  cyoaBuildDraftSchema,
  cyoaBuildLedgerEntrySchema,

  // Build-contract schemas
  narrativeTemplateRefSchema,
  cyoaBuildStateSchema,
  cyoaBuildReceiptSchema,
  cyoaBuildCheckpointSchema,

  // Parse helpers
  parseCyoaBuild,
  parseCyoaBuildInput,
  parseCyoaBuildDraft,
  parseCyoaBuildLedgerEntry,
  parseCyoaBuildLedgerEntries,
  parseCyoaBuildState,
  parseCyoaBuildReceipt,
  parseCyoaBuildCheckpoint,
} from './schemas'

export type {
  CyoaBuildInputParsed,
  CyoaBuildParsed,
  CyoaBuildDraftParsed,
  CyoaBuildLedgerEntryParsed,
  CyoaBuildStateParsed,
  CyoaBuildReceiptParsed,
  CyoaBuildCheckpointParsed,
} from './schemas'
