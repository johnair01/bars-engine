/**
 * Inner Garden — deterministic world projection.
 *
 * `projectFarm(seed, os)` turns OS truth (Lenses, BARs, campaignRefs) into a `FarmScene`
 * with NO hand-authored map and NO stored bytes. Placement is a pure function of each
 * entity's own id via `fnv32`, so:
 *   - same inputs → identical scene + layoutHash (determinism), and
 *   - adding an entity never moves existing ones (append-stability).
 *
 * `projectSharedFarm(...)` is the same IR over campaign scope, reusing the existing
 * octagon hub builder — proof that shared farms are not a separate system.
 *
 * `applyOverlay(overlay, scene)` replays the player's sparse edits (the No Man's Sky
 * deltas) on top. It can move/reskin and add decorations, but CANNOT remove a semantic
 * anchor — that's the enforcement of "the OS owns what exists."
 *
 * Design doc: docs/handoffs/2026-07-12-inner-garden-world-representation.md
 */
import { computeSpatialLayoutRevision } from '@/lib/spatial-world/spatial-room-bind'
import { buildOctagonCampaignHubRoom } from '@/lib/spatial-world/octagon-campaign-hub'
import { fnv32 } from './hash'
import {
  decodeConfig,
  encodeConfig,
  isSemanticAnchor,
  type AnchorData,
  type BiomeId,
  type Cell,
  type FarmOverlay,
  type FarmScene,
  type OsSnapshot,
  type TileMapData,
} from './scene'

// --- layout constants (a farm's fixed geometry; the renderer scales cells to viewport) ---
const MARGIN = 1 // impassable border thickness
const FIELD_SIZE = 5 // a field is FIELD_SIZE × FIELD_SIZE cells of soil
const FIELD_GAP = 1 // grass path between fields
const FIELD_COLS = 4 // field grid capacity (COLS × ROWS field slots)
const FIELD_ROWS = 4
const UNSORTED_LENS_ID = '__unsorted__' // seeds with no Lens land here

const BIOMES: BiomeId[] = ['meadow', 'wetland', 'highland', 'grove', 'ashland']

const FIELD_BLOCK = FIELD_SIZE + FIELD_GAP
const GRID_W = MARGIN + FIELD_COLS * FIELD_BLOCK + MARGIN
const GRID_H = MARGIN + FIELD_ROWS * FIELD_BLOCK + MARGIN + 2 // +2 rows for the gate strip

// --- deterministic placement (pure functions of an id) ---

/** Field-grid slot for a Lens — pure function of `lensId`, so it's append-stable. */
function fieldOrigin(lensId: string): Cell {
  const slot = fnv32(`field:${lensId}`) % (FIELD_COLS * FIELD_ROWS)
  const col = slot % FIELD_COLS
  const row = Math.floor(slot / FIELD_COLS)
  return {
    x: MARGIN + col * FIELD_BLOCK,
    y: MARGIN + row * FIELD_BLOCK,
  }
}

/** Cell for a seed within its field — pure function of `seedId` (append-stable). */
function seedCell(seedId: string, origin: Cell): Cell {
  const n = fnv32(`seed:${seedId}`)
  return {
    x: origin.x + (n % FIELD_SIZE),
    y: origin.y + (Math.floor(n / FIELD_SIZE) % FIELD_SIZE),
  }
}

function pickBiome(seed: string): BiomeId {
  return BIOMES[fnv32(`biome:${seed}`) % BIOMES.length]!
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Base terrain: grass everywhere, soil under field blocks, impassable border. */
function buildFarmTilemap(lensIds: string[]): TileMapData {
  const tiles: TileMapData = {}
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const border = x < MARGIN || y < MARGIN || x >= GRID_W - MARGIN || y >= GRID_H - MARGIN
      tiles[tileKey(x, y)] = border ? { floor: 'grass', impassable: true } : { floor: 'grass' }
    }
  }
  for (const lensId of lensIds) {
    const o = fieldOrigin(lensId)
    for (let dy = 0; dy < FIELD_SIZE; dy++) {
      for (let dx = 0; dx < FIELD_SIZE; dx++) {
        tiles[tileKey(o.x + dx, o.y + dy)] = { floor: 'soil' }
      }
    }
  }
  return tiles
}

/**
 * Project a personal farm from OS state. Pure, deterministic, no I/O, no stored map.
 */
export function projectFarm(seed: string, os: OsSnapshot): FarmScene {
  const anchors: AnchorData[] = []

  // Fields = Lenses (+ a stable unsorted plot for lens-less seeds).
  const lensIds = os.lenses.map(l => l.id)
  const hasUnsorted = os.seeds.some(s => !s.lensId)
  const allFieldIds = hasUnsorted ? [...lensIds, UNSORTED_LENS_ID] : lensIds

  for (const lens of os.lenses) {
    const o = fieldOrigin(lens.id)
    anchors.push({
      id: `field:${lens.id}`,
      anchorType: 'field',
      tileX: o.x,
      tileY: o.y,
      label: lens.title,
      linkedId: lens.id,
      linkedType: 'Lens',
      config: encodeConfig({ periodKey: lens.periodKey }),
    })
  }
  if (hasUnsorted) {
    const o = fieldOrigin(UNSORTED_LENS_ID)
    anchors.push({
      id: `field:${UNSORTED_LENS_ID}`,
      anchorType: 'field',
      tileX: o.x,
      tileY: o.y,
      label: 'Unsorted',
      linkedId: UNSORTED_LENS_ID,
      linkedType: 'Lens',
      config: encodeConfig({}),
    })
  }

  // Seeds = BARs; a blocked seed also renders a weed over the same cell.
  for (const s of os.seeds) {
    const fieldId = s.lensId && lensIds.includes(s.lensId) ? s.lensId : UNSORTED_LENS_ID
    const cell = seedCell(s.id, fieldOrigin(fieldId))
    anchors.push({
      id: `seed:${s.id}`,
      anchorType: 'seed',
      tileX: cell.x,
      tileY: cell.y,
      label: null,
      linkedId: s.id,
      linkedType: 'CustomBar',
      config: encodeConfig({ element: s.element, altitude: s.altitude, stage: s.stage }),
    })
    if (s.blocked) {
      anchors.push({
        id: `weed:${s.id}`,
        anchorType: 'weed',
        tileX: cell.x,
        tileY: cell.y,
        label: null,
        linkedId: s.id,
        linkedType: 'CustomBar',
        config: encodeConfig({}),
      })
    }
  }

  // Gates = campaignRefs, placed along the bottom strip at a deterministic x.
  const gateY = GRID_H - MARGIN - 1
  for (const ref of os.campaignRefs) {
    const gx = MARGIN + (fnv32(`gate:${ref}`) % (GRID_W - 2 * MARGIN))
    anchors.push({
      id: `gate:${ref}`,
      anchorType: 'gate',
      tileX: gx,
      tileY: gateY,
      label: 'Gate',
      linkedId: ref,
      linkedType: 'Campaign',
      config: encodeConfig({ campaignRef: ref }),
    })
  }

  // School portal = fixed anchor, top-center → the mountain.
  anchors.push({
    id: 'school_portal',
    anchorType: 'school_portal',
    tileX: Math.floor(GRID_W / 2),
    tileY: MARGIN,
    label: 'The School',
    config: encodeConfig({}),
  })

  const tilemap = buildFarmTilemap(allFieldIds)
  return {
    seed,
    biome: pickBiome(seed),
    tilemap,
    anchors,
    layoutHash: computeSpatialLayoutRevision(tilemap, anchors),
  }
}

/**
 * Project a shared farm. Campaign commons reuse the existing octagon hub builder — the
 * same `FarmScene` IR over campaign scope.
 *
 * TODO(v2): project real `SpokeMoveBed`/contribution data, and add level-of-detail
 * aggregation (density tiles) for commons with many contributors (see design doc §8).
 */
export function projectSharedFarm(campaignRef: string): FarmScene {
  const { tilemap, anchors: seeds } = buildOctagonCampaignHubRoom(campaignRef)
  const tiles: TileMapData = {}
  for (const [k, v] of Object.entries(tilemap)) {
    tiles[k] = { floor: v.floor, impassable: v.impassable }
  }
  const anchors: AnchorData[] = seeds.map((a, i) => ({
    id: `${a.anchorType}:${i}`,
    anchorType: a.anchorType,
    tileX: a.tileX,
    tileY: a.tileY,
    label: a.label,
    linkedId: a.linkedId ?? null,
    linkedType: a.linkedType ?? null,
    config: a.config ?? null,
  }))
  return {
    seed: campaignRef,
    biome: pickBiome(campaignRef),
    tilemap: tiles,
    anchors,
    layoutHash: computeSpatialLayoutRevision(tiles, anchors),
  }
}

/**
 * Replay the player's sparse overlay onto a projected scene.
 *
 * INVARIANT: overrides only move/reskin; decorations only add. A semantic anchor
 * (field/seed/weed/gate/school_portal) can never be removed — game state lives in the OS,
 * not the map. Overrides key on `linkedId` (the barId/lensId); orphaned overrides for a
 * deleted entity are simply ignored.
 */
export function applyOverlay(overlay: FarmOverlay, scene: FarmScene): FarmScene {
  const anchors: AnchorData[] = scene.anchors.map(a => {
    const ov = a.linkedId ? overlay.overrides[a.linkedId] : undefined
    if (!ov) return a
    const next: AnchorData = { ...a }
    if (ov.cell) {
      next.tileX = ov.cell.x
      next.tileY = ov.cell.y
    }
    if (ov.skin) {
      next.config = encodeConfig({ ...decodeConfig(a.config), skin: ov.skin })
    }
    return next
  })

  for (const d of overlay.decorations) {
    anchors.push({
      id: `deco:${d.id}`,
      anchorType: 'decoration',
      tileX: d.cell.x,
      tileY: d.cell.y,
      label: null,
      config: encodeConfig({ kind: d.kind }),
    })
  }

  return {
    ...scene,
    anchors,
    layoutHash: computeSpatialLayoutRevision(scene.tilemap, anchors),
  }
}

/** Count of semantic (OS-owned) anchors — used by the semantic-safety invariant test. */
export function countSemanticAnchors(scene: FarmScene): number {
  return scene.anchors.filter(isSemanticAnchor).length
}
