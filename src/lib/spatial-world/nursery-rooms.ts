/**
 * Nursery Room Builders — spoke introduction room + 4 nursery rooms.
 *
 * Each spoke has:
 *   1 introduction room (campaign-scoped, 6 face NPCs, 4 nursery portals)
 *   4 nursery rooms (Wake Up, Clean Up, Grow Up, Show Up)
 *
 * Rooms use the same tile/anchor format as the octagon campaign hub.
 * See: octagon-campaign-hub.ts for the reference pattern.
 */

import type { OctagonTile, OctagonAnchorSeed } from './octagon-campaign-hub'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { getNpcByFace } from '@/lib/npc/named-guides'

// ─── Types ──────────────────────────────────────────────────────────────────

export type NurseryType = 'wake-up' | 'clean-up' | 'grow-up' | 'show-up'

export const NURSERY_TYPES: readonly NurseryType[] = [
  'wake-up',
  'clean-up',
  'grow-up',
  'show-up',
] as const

export const NURSERY_LABELS: Record<NurseryType, string> = {
  'wake-up': 'Wake Up Nursery',
  'clean-up': 'Clean Up Nursery',
  'grow-up': 'Grow Up Nursery',
  'show-up': 'Show Up Nursery',
}

const FACE_ORDER: readonly GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

// ─── Tile Helpers ───────────────────────────────────────────────────────────

function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Build a simple rectangular walkable room with 1-tile impassable border. */
function buildRectTilemap(
  width: number,
  height: number
): Record<string, OctagonTile> {
  const tiles: Record<string, OctagonTile> = {}
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1
      tiles[tileKey(x, y)] = isBorder
        ? { floor: 'default', impassable: true }
        : { floor: 'default' }
    }
  }
  return tiles
}

// ─── Spoke Introduction Room ────────────────────────────────────────────────

/**
 * Build the spoke introduction room.
 *
 * Layout (21×17):
 *   - Hub return portal at top center
 *   - 6 face NPC anchors in a semicircle across the middle
 *   - 4 nursery portals along the bottom
 *
 * ```
 *   ┌───────────────────┐
 *   │     [Hub Portal]  │  y=1
 *   │                   │
 *   │  S  Ch  Re  Ar    │  y=6  (face NPCs row 1)
 *   │     Di  Sa        │  y=8  (face NPCs row 2)
 *   │                   │
 *   │ [WU] [CU] [GU] [SU] │  y=14 (nursery portals)
 *   └───────────────────┘
 * ```
 */
export function buildSpokeIntroRoom(
  campaignRef: string,
  spokeIndex: number
): { tilemap: Record<string, OctagonTile>; anchors: OctagonAnchorSeed[] } {
  const W = 21
  const H = 17
  const tilemap = buildRectTilemap(W, H)
  const cx = Math.floor(W / 2) // 10

  const anchors: OctagonAnchorSeed[] = []

  // Welcome text anchor — center of room
  anchors.push({
    anchorType: 'welcome_text',
    tileX: cx,
    tileY: 4,
    label: 'Welcome',
    config: JSON.stringify({ campaignRef, spokeIndex }),
  })

  // Hub return portal — top center
  anchors.push({
    anchorType: 'portal',
    tileX: cx,
    tileY: 1,
    label: 'Return to Campaign Hub',
    config: JSON.stringify({
      externalPath: `/campaign/hub?ref=${campaignRef}`,
    }),
  })

  // 6 Named NPC anchors — two rows
  // Row 1 (y=6): Kaelen(shaman), Ignis(challenger), Aurelius(regent), Vorm(architect)
  const row1Faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect']
  const row1Xs = [4, 8, 12, 16]
  for (let i = 0; i < row1Faces.length; i++) {
    const npc = getNpcByFace(row1Faces[i])
    anchors.push({
      anchorType: 'face_npc',
      tileX: row1Xs[i],
      tileY: 6,
      label: npc?.name ?? row1Faces[i],
      config: JSON.stringify({
        face: row1Faces[i],
        spokeIndex,
        campaignRef,
      }),
    })
  }

  // Row 2 (y=8): Sola(diplomat), Witness(sage)
  const row2Faces: GameMasterFace[] = ['diplomat', 'sage']
  const row2Xs = [7, 13]
  for (let i = 0; i < row2Faces.length; i++) {
    const npc = getNpcByFace(row2Faces[i])
    anchors.push({
      anchorType: 'face_npc',
      tileX: row2Xs[i],
      tileY: 8,
      label: npc?.name ?? row2Faces[i],
      config: JSON.stringify({
        face: row2Faces[i],
        spokeIndex,
        campaignRef,
      }),
    })
  }

  // 4 Nursery portals — bottom row (y=14), evenly spaced
  const nurseryXs = [3, 7, 13, 17]
  for (let i = 0; i < NURSERY_TYPES.length; i++) {
    const nurseryType = NURSERY_TYPES[i]
    anchors.push({
      anchorType: 'portal',
      tileX: nurseryXs[i],
      tileY: 14,
      label: NURSERY_LABELS[nurseryType],
      config: JSON.stringify({
        targetSlug: `spoke-${spokeIndex}-${nurseryType}`,
      }),
    })
  }

  return { tilemap, anchors }
}

// ─── Nursery Room ───────────────────────────────────────────────────────────

/**
 * Build a single nursery room.
 *
 * Layout (15×13):
 *   - Exit portal at top center (back to intro room)
 *   - Activity anchor at center (launches ritual)
 *
 * ```
 *   ┌─────────────┐
 *   │  [Exit]     │  y=1
 *   │             │
 *   │   [Activity]│  y=6  (center)
 *   │             │
 *   └─────────────┘
 * ```
 */
export function buildNurseryRoom(
  nurseryType: NurseryType,
  spokeIndex: number,
  campaignRef: string
): { tilemap: Record<string, OctagonTile>; anchors: OctagonAnchorSeed[] } {
  const W = 15
  const H = 13
  const tilemap = buildRectTilemap(W, H)
  const cx = Math.floor(W / 2) // 7
  const cy = Math.floor(H / 2) // 6

  const anchors: OctagonAnchorSeed[] = []

  // Exit portal — back to introduction room
  anchors.push({
    anchorType: 'portal',
    tileX: cx,
    tileY: 1,
    label: 'Back to Spoke Clearing',
    config: JSON.stringify({
      targetSlug: `spoke-${spokeIndex}-intro`,
    }),
  })

  // Activity anchor — center of room, launches ritual
  anchors.push({
    anchorType: 'nursery_activity',
    tileX: cx,
    tileY: cy,
    label: NURSERY_LABELS[nurseryType],
    config: JSON.stringify({
      nurseryType,
      spokeIndex,
      campaignRef,
    }),
  })

  return { tilemap, anchors }
}

// ─── Full Spoke Builder ─────────────────────────────────────────────────────

export type NurseryRoomSet = {
  intro: { tilemap: Record<string, OctagonTile>; anchors: OctagonAnchorSeed[] }
  nurseries: Record<NurseryType, { tilemap: Record<string, OctagonTile>; anchors: OctagonAnchorSeed[] }>
}

/**
 * Build all 5 rooms for a spoke (1 intro + 4 nurseries).
 */
export function buildSpokeNurseryRooms(
  campaignRef: string,
  spokeIndex: number
): NurseryRoomSet {
  return {
    intro: buildSpokeIntroRoom(campaignRef, spokeIndex),
    nurseries: {
      'wake-up': buildNurseryRoom('wake-up', spokeIndex, campaignRef),
      'clean-up': buildNurseryRoom('clean-up', spokeIndex, campaignRef),
      'grow-up': buildNurseryRoom('grow-up', spokeIndex, campaignRef),
      'show-up': buildNurseryRoom('show-up', spokeIndex, campaignRef),
    },
  }
}

/** Generate the slug for a nursery room. */
export function nurseryRoomSlug(spokeIndex: number, nurseryType: NurseryType): string {
  return `spoke-${spokeIndex}-${nurseryType}`
}

/** Generate the slug for a spoke introduction room. */
export function spokeIntroSlug(spokeIndex: number): string {
  return `spoke-${spokeIndex}-intro`
}
