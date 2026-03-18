// Daemon Move System — valid string values for DMS enum-like fields
// These mirror the @default / comment values in schema.prisma

export const WuxingElement = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'] as const
export type WuxingElement = (typeof WuxingElement)[number]

export const Altitude = ['DISSATISFIED', 'NEUTRAL', 'SATISFIED'] as const
export type Altitude = (typeof Altitude)[number]

export const MoveTier = ['EPHEMERAL', 'CUSTOM', 'CANDIDATE', 'CANONICAL'] as const
export type MoveTier = (typeof MoveTier)[number]

export const MoveOrigin = ['GM_AUTHORED', 'PLAYER_NAMED', 'AI_PROPOSED'] as const
export type MoveOrigin = (typeof MoveOrigin)[number]

export const MoveOutcome = ['ABANDONED', 'COMPLETED', 'BAR_WRITTEN', 'TAUGHT_BACK'] as const
export type MoveOutcome = (typeof MoveOutcome)[number]
