export const FRICTION_TYPES = ['confusion', 'fear', 'overwhelm', 'avoidance', 'other'] as const
export type FrictionType = (typeof FRICTION_TYPES)[number]
