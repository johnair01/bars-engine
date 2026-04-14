/**
 * CYOA Ceremony Styling Components
 *
 * Ceremony layer for build receipt visualization in the hub ledger.
 * All components use cultivation-cards.css tokens and three-channel encoding.
 *
 * Components:
 *   CompletionGlow     — flash + sustained glow wrapper for receipt completion
 *   ReceiptContainer   — ledger-style container for one or more receipts
 *   ReturnWitnessCard  — ceremony-styled receipt card with glow/shimmer/stamp
 *
 * @see cultivation-cards.css — ceremony-* CSS classes
 * @see card-tokens.ts — ELEMENT_TOKENS, SURFACE_TOKENS, elementCssVars
 * @see ReturnWitness — base receipt display component (campaign-hub)
 */

export { CompletionGlow } from './CompletionGlow'
export type { CompletionGlowProps } from './CompletionGlow'

export { ReceiptContainer } from './ReceiptContainer'
export type { ReceiptContainerProps } from './ReceiptContainer'

export { ReturnWitnessCard } from './ReturnWitnessCard'
export type { ReturnWitnessCardProps } from './ReturnWitnessCard'
