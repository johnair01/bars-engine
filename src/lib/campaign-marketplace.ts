/** Campaign marketplace (mall stalls) — constants. @see .specify/specs/campaign-marketplace-slots/spec.md */
export const MARKETPLACE_BASE_SLOTS = 8

/** Escalating vibeulon cost for each additional stall after the first 8. */
export function vibeulonCostForNextSlot(paidExtensions: number): number {
  const n = paidExtensions + 1
  return 500 * n
}
