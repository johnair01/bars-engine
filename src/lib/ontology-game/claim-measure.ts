import { CLAIM_CHANNELS, type ClaimChannel } from './claim-table'

/** What claim-measure reads from one stored claim BAR's `inputs` JSON. */
export type StoredClaim = {
  at: number
  channel: ClaimChannel
  lens: string
  named: string
  codeHash: string
  /** the cycle count in this channel from the code that carried the claim */
  cyclesInChannel: number
  /** order in which codes were carried (earlier = smaller) */
  carriedAt: number
}

export type ChannelMeasure = {
  channel: ClaimChannel
  claims: number
  namedRate: number | null
  recurrence: number
  lensAgreement: number | null
}

/** Pure, no AI. Unnamed cycles count in the denominator; there is no "redefined" outcome. */
export function measureClaims(claims: StoredClaim[]): ChannelMeasure[] {
  return CLAIM_CHANNELS.map((channel) => {
    const mine = claims.filter((c) => c.channel === channel)
    if (mine.length === 0) return { channel, claims: 0, namedRate: null, recurrence: 0, lensAgreement: null }
    const latest = mine.reduce((a, b) => (b.carriedAt >= a.carriedAt ? b : a))
    const cycles = latest.cyclesInChannel
    const distinctClaims = new Set(mine.map((c) => `${c.at}`)).size
    const recurrence = mine.filter((c) => mine.some((o) => o.codeHash !== c.codeHash && o.carriedAt > c.carriedAt)).length
    return {
      channel,
      claims: mine.length,
      namedRate: cycles > 0 ? distinctClaims / cycles : null,
      recurrence,
      lensAgreement: mine.filter((c) => c.lens === c.named).length / mine.length,
    }
  })
}
