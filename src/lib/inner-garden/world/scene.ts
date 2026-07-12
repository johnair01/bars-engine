/**
 * Inner Garden — world representation types (the `FarmScene` IR).
 *
 * Design doc: docs/handoffs/2026-07-12-inner-garden-world-representation.md
 *
 * A farm is NOT a stored map. It is:
 *
 *     renderedFarm = applyOverlay(overlay, projectFarm(seed, osState))
 *                    └── stored, tiny ──┘   └──── derived, never stored ────┘
 *
 * The OS owns *what exists* (fields=Lenses, seeds=BARs, weeds=blockers — all re-projected
 * from truth). The player's overlay owns only *where it sits and how it looks*.
 *
 * This module is pure types + the config encode/decode helpers. `FarmScene` extends the
 * existing serializable space contract in `@/lib/spatial-world/pixi-room` (grid-cell
 * `tilemap` + `anchors`) — garden meaning rides entirely in `anchorType` + the JSON
 * `config` escape hatch, so there is NO Prisma/schema change.
 */
import type { AnchorData, TileMapData } from '@/lib/spatial-world/pixi-room'

export type { AnchorData, TileMapData }

// --- Garden vocabulary (reuses canonical OS enums; kept local to avoid heavy imports) ---

/** Wuxing element channel (mirrors `ElementKey` in `@/lib/ui/card-tokens`). */
export type ElementKey = 'fire' | 'water' | 'wood' | 'metal' | 'earth'

/** Emotional altitude — the BARS "glow" axis (mirrors `AlchemyAltitude`). */
export type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'

/** Crop growth stage, derived from `CustomBar.seedMetabolization` phase. */
export type GrowthStage = 'seed' | 'growing' | 'composted'

/** One biome per element family; picked deterministically by `fnv32(seed)`. */
export type BiomeId = 'meadow' | 'wetland' | 'highland' | 'grove' | 'ashland'

/** Garden anchor kinds layered on top of the generic spatial `anchorType` string. */
export type GardenAnchorType =
  | 'field' // a Lens
  | 'seed' // a BAR
  | 'weed' // a BAR with an active blocker
  | 'gate' // a campaignRef → portal to a shared farm
  | 'school_portal' // → the mountain (six faces = altitudes)
  | 'building'
  | 'decoration' // pure overlay cosmetics; no OS meaning

export interface Cell {
  x: number
  y: number
}

// --- The IR ---

export interface FarmScene {
  /** Stable layout seed: playerId | campaignRef | commonsId. */
  seed: string
  biome: BiomeId
  /** Existing `TileMapData` shape — keyed by `"x,y"`, grid cells (not pixels). */
  tilemap: TileMapData
  /** Existing `AnchorData` shape — semantics in `anchorType` + JSON `config`. */
  anchors: AnchorData[]
  /** `fnv1aHex(tiles, anchors)` via `computeSpatialLayoutRevision` — change detector. */
  layoutHash: string
}

/** Structured payload we JSON-encode into `AnchorData.config`. */
export interface GardenAnchorConfig {
  element?: ElementKey | null
  altitude?: Altitude
  stage?: GrowthStage
  face?: string | null
  campaignRef?: string | null
  /** Cosmetic reskin key applied via the overlay (never affects semantics). */
  skin?: string
  /** Free-form extras (decoration kind, spirit, hexagram, …). */
  [k: string]: unknown
}

// --- The No Man's Sky overlay (the only thing persisted) ---

export interface FarmOverlay {
  /** Keyed by semanticId (a `barId` or `lensId`). */
  overrides: Record<string, { cell?: Cell; skin?: string }>
  decorations: Array<{ id: string; kind: string; cell: Cell }>
}

export const EMPTY_OVERLAY: FarmOverlay = { overrides: {}, decorations: [] }

// --- OS snapshot: the truth a farm is projected FROM (a subset of the bridge payload) ---

export interface GardenLens {
  id: string
  /** e.g. "daily:2026-07-12" — stable across loads. */
  periodKey: string
  title: string
}

export interface GardenSeed {
  id: string
  /** Which field (Lens) it's planted in; null = the unsorted plot. */
  lensId: string | null
  element: ElementKey | null
  altitude: Altitude
  stage: GrowthStage
  /** Has an active blocker → also renders a weed over the seed. */
  blocked: boolean
}

export interface OsSnapshot {
  playerId: string
  lenses: GardenLens[]
  seeds: GardenSeed[]
  /** Each ref → a gate anchor linking to that campaign's shared farm. */
  campaignRefs: string[]
}

// --- config helpers ---

export function encodeConfig(config: GardenAnchorConfig): string {
  return JSON.stringify(config)
}

export function decodeConfig(config: string | null | undefined): GardenAnchorConfig {
  if (!config) return {}
  try {
    return JSON.parse(config) as GardenAnchorConfig
  } catch {
    return {}
  }
}

/** Type guard: is this a semantic (OS-owned) anchor the overlay must never remove? */
export function isSemanticAnchor(anchor: AnchorData): boolean {
  return (
    anchor.anchorType === 'field' ||
    anchor.anchorType === 'seed' ||
    anchor.anchorType === 'weed' ||
    anchor.anchorType === 'gate' ||
    anchor.anchorType === 'school_portal'
  )
}
