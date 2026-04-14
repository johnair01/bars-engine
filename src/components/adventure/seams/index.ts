/**
 * Seam Component Registry — maps seamType to the component that handles it.
 */

export { SeamReflection321 } from './SeamReflection321'
export { SeamBarCreate } from './SeamBarCreate'
export { SeamCarryReturn } from './SeamCarryReturn'

export const SEAM_TYPES = ['321_reflection', 'bar_create', 'carry_and_return'] as const
export type SeamType = typeof SEAM_TYPES[number]
