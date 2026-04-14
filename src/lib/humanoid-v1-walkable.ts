/**
 * Normative constants + metadata schema for `humanoid_v1` walkable sheets.
 * @see docs/conclave/construc-conclave-9/humanoid_v1_spec.md
 * @see .specify/specs/humanoid-v1-walkable-contract/spec.md
 */
import { z } from 'zod'

export const HUMANOID_V1_WALKABLE_MODEL = 'humanoid_v1' as const

export const HUMANOID_V1_FRAME = { width: 64, height: 64 } as const
export const HUMANOID_V1_SHEET = { width: 512, height: 64 } as const
export const HUMANOID_V1_ANCHOR = { x: 32, y: 56 } as const

/** Pixi anchor fractions (0–1) for body root / foot plant in frame space. */
export const HUMANOID_V1_ANCHOR_NORMALIZED = {
  x: HUMANOID_V1_ANCHOR.x / HUMANOID_V1_FRAME.width,
  y: HUMANOID_V1_ANCHOR.y / HUMANOID_V1_FRAME.height,
} as const

export const HUMANOID_V1_LAYOUT = [
  'north_idle',
  'north_walk',
  'south_idle',
  'south_walk',
  'east_idle',
  'east_walk',
  'west_idle',
  'west_walk',
] as const

export type HumanoidV1LayoutFrame = (typeof HUMANOID_V1_LAYOUT)[number]

const layoutTuple = z.tuple([
  z.literal('north_idle'),
  z.literal('north_walk'),
  z.literal('south_idle'),
  z.literal('south_walk'),
  z.literal('east_idle'),
  z.literal('east_walk'),
  z.literal('west_idle'),
  z.literal('west_walk'),
])

export const humanoidV1WalkableMetadataSchema = z.object({
  model: z.literal(HUMANOID_V1_WALKABLE_MODEL),
  frameWidth: z.literal(64),
  frameHeight: z.literal(64),
  anchor: z.object({
    x: z.literal(32),
    y: z.literal(56),
  }),
  layout: layoutTuple,
  identity: z
    .object({
      nation: z.string().min(1),
      archetype: z.string().min(1),
    })
    .optional(),
  palette: z.string().min(1).optional(),
  provenance: z.enum(['draft', 'steward_approved']).optional(),
})

export type HumanoidV1WalkableMetadata = z.infer<typeof humanoidV1WalkableMetadataSchema>
