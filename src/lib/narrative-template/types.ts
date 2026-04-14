/**
 * NarrativeTemplate — TypeScript Types
 *
 * Shared spine + kind-specific config type definitions for the unified
 * NarrativeTemplate registry. Each template kind (EPIPHANY, KOTTER,
 * ORIENTATION, CUSTOM) has a discriminated config shape validated at the
 * TypeScript boundary, not the DB level.
 *
 * Follows existing patterns:
 * @see prisma/schema.prisma — NarrativeTemplate model + NarrativeTemplateKind enum
 * @see src/lib/quest-grammar/types.ts — EpiphanyBeatType, KotterBeatType, GameMasterFace
 * @see src/lib/cyoa-build/schemas.ts — Zod schema companion pattern
 */

import type {
  EpiphanyBeatType,
  GameMasterFace,
  KotterBeatType,
  PersonalMoveType,
  QuestModel,
  SegmentVariant,
} from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// NarrativeTemplateKind — mirrors Prisma enum
// ---------------------------------------------------------------------------

/**
 * Template kinds — discriminator for configBlob shape.
 * Mirrors the Prisma NarrativeTemplateKind enum.
 */
export type NarrativeTemplateKind = 'EPIPHANY' | 'KOTTER' | 'ORIENTATION' | 'CUSTOM'

export const NARRATIVE_TEMPLATE_KINDS: NarrativeTemplateKind[] = [
  'EPIPHANY',
  'KOTTER',
  'ORIENTATION',
  'CUSTOM',
]

// ---------------------------------------------------------------------------
// Kind-specific config types
// ---------------------------------------------------------------------------

/**
 * EPIPHANY config — Personal quest arc (6 beats).
 * Drives Epiphany Bridge quest compilation.
 */
export interface EpiphanyConfig {
  /** Ordered beat sequence. Default: all 6 Epiphany beats in canonical order. */
  beats: EpiphanyBeatType[]
  /** Default segment variant for quest compilation. */
  defaultSegment: SegmentVariant
  /** Spine length — short (4 beats) or full (6 beats). Default: 'full'. */
  spineLength?: 'short' | 'full'
  /** Optional move type override for quest compilation. */
  moveType?: PersonalMoveType
  /** Whether lore gates are enabled for depth branches. */
  loreGatesEnabled?: boolean
  /** Optional per-beat node overrides (beat index → partial config). */
  beatOverrides?: Record<string, BeatOverride>
}

/**
 * KOTTER config — Communal quest arc (8 beats/stages).
 * Drives Kotter change model quest compilation.
 */
export interface KotterConfig {
  /** Ordered beat sequence. Default: all 8 Kotter stages in canonical order. */
  beats: KotterBeatType[]
  /** Default segment variant for quest compilation. */
  defaultSegment: SegmentVariant
  /** Optional move type override for quest compilation. */
  moveType?: PersonalMoveType
  /** Whether lore gates are enabled for depth branches. */
  loreGatesEnabled?: boolean
  /** Optional per-beat node overrides (beat index → partial config). */
  beatOverrides?: Record<string, BeatOverride>
}

/**
 * ORIENTATION config — Face-discovery orientation flow.
 * Used for onboarding/threshold encounters that introduce GM faces.
 */
export interface OrientationConfig {
  /** Faces surfaced in this orientation (subset of all 6). */
  faces: GameMasterFace[]
  /** Ordered sub-packets — one per orientation step. */
  subPackets: OrientationSubPacket[]
  /** Whether to show face lore during orientation. */
  showFaceLore?: boolean
  /** Optional intro passage shown before face discovery begins. */
  introPassageKey?: string
}

/**
 * CUSTOM config — GM-defined freeform template.
 * Validated only at the key-existence level; inner shape is opaque.
 */
export interface CustomConfig {
  /** Freeform key-value pairs defined by the GM. */
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Shared sub-types used by kind configs
// ---------------------------------------------------------------------------

/** Per-beat override — partial adjustments to a single beat's compilation. */
export interface BeatOverride {
  /** Override choice type for this beat. */
  choiceType?: 'altitudinal' | 'horizontal'
  /** Restrict which GM faces appear in choices at this beat. */
  enabledFaces?: GameMasterFace[]
  /** Restrict which WAVE moves appear in horizontal choices. */
  enabledHorizontal?: PersonalMoveType[]
}

/** A single sub-packet in an Orientation flow. */
export interface OrientationSubPacket {
  /** Which GM face this sub-packet introduces. */
  face: GameMasterFace
  /** Display label for this step. */
  label: string
  /** Passage key or content reference for orientation content. */
  passageKey?: string
  /** Optional prompt/question for the player at this step. */
  prompt?: string
}

// ---------------------------------------------------------------------------
// Discriminated union — NarrativeTemplateConfig
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all kind-specific configs.
 * The `kind` field is the discriminator, matching the Prisma enum.
 *
 * Used at deserialization boundaries to type-narrow configBlob.
 */
export type NarrativeTemplateConfig =
  | { kind: 'EPIPHANY'; config: EpiphanyConfig }
  | { kind: 'KOTTER'; config: KotterConfig }
  | { kind: 'ORIENTATION'; config: OrientationConfig }
  | { kind: 'CUSTOM'; config: CustomConfig }

// ---------------------------------------------------------------------------
// NarrativeTemplate row type (app-layer shape)
// ---------------------------------------------------------------------------

/**
 * Full NarrativeTemplate row — shared spine fields.
 * configBlob is stored as Json in Prisma; typed at app layer.
 */
export interface NarrativeTemplateRow {
  id: string
  key: string
  name: string
  description: string | null
  kind: NarrativeTemplateKind
  stepCount: number
  /** Parsed face affinities — GameMasterFace[]. Empty = face-neutral. */
  faceAffinities: GameMasterFace[]
  questModel: QuestModel
  /** Raw configBlob — parse with narrowConfigBlob() for typed access. */
  configBlob: unknown
  status: 'active' | 'archived'
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Typed NarrativeTemplate — shared spine + narrowed config.
 * Use narrowNarrativeTemplate() to produce this from a NarrativeTemplateRow.
 */
export type TypedNarrativeTemplate =
  | (Omit<NarrativeTemplateRow, 'configBlob'> & { kind: 'EPIPHANY'; configBlob: EpiphanyConfig })
  | (Omit<NarrativeTemplateRow, 'configBlob'> & { kind: 'KOTTER'; configBlob: KotterConfig })
  | (Omit<NarrativeTemplateRow, 'configBlob'> & { kind: 'ORIENTATION'; configBlob: OrientationConfig })
  | (Omit<NarrativeTemplateRow, 'configBlob'> & { kind: 'CUSTOM'; configBlob: CustomConfig })

// ---------------------------------------------------------------------------
// Template summary — lightweight projection for lists/selectors
// ---------------------------------------------------------------------------

/** Lightweight projection for template lists and composer selectors. */
export interface NarrativeTemplateSummary {
  id: string
  key: string
  name: string
  kind: NarrativeTemplateKind
  faceAffinities: GameMasterFace[]
  questModel: QuestModel
  stepCount: number
  status: 'active' | 'archived'
}

// ---------------------------------------------------------------------------
// Admin / mutation DTOs
// ---------------------------------------------------------------------------

/** Input for creating a new NarrativeTemplate. */
export interface CreateNarrativeTemplateInput {
  key: string
  name: string
  description?: string
  kind: NarrativeTemplateKind
  stepCount: number
  faceAffinities: GameMasterFace[]
  questModel: QuestModel
  configBlob: EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig
  status?: 'active' | 'archived'
  sortOrder?: number
}

/** Input for updating an existing NarrativeTemplate. */
export interface UpdateNarrativeTemplateInput {
  name?: string
  description?: string | null
  stepCount?: number
  faceAffinities?: GameMasterFace[]
  questModel?: QuestModel
  configBlob?: EpiphanyConfig | KotterConfig | OrientationConfig | CustomConfig
  status?: 'active' | 'archived'
  sortOrder?: number
}
