// Deterministic measures over a player's claim BARs (spec ontology-game-bar-claim). No AI.
// Unnamed cycles are the denominator: a claim without one measures wording habits.

export type ClaimRow = {
  at: number
  channel: string
  lens: string
  named: string
  cyclesInChannel: number
  totalCycles: number
}

export type ChannelMeasure = {
  channel: string
  claims: number
  namedRate: number | null
  recurrence: number
  lensAgreement: number | null
}

export function measureClaims(rows: ClaimRow[]): ChannelMeasure[] {
  const byChannel = new Map<string, ClaimRow[]>()
  for (const r of rows) byChannel.set(r.channel, [...(byChannel.get(r.channel) ?? []), r])
  return [...byChannel.entries()].map(([channel, list]) => {
    const sorted = [...list].sort((a, b) => a.at - b.at)
    // The latest code's count is the denominator.
    const latest = sorted[sorted.length - 1]
    const cycles = latest.cyclesInChannel
    // Recurrence: claims followed by a later claim in the same channel from a later code
    // (a later cycle count). Same-cycle claims share a count and do not recur.
    let recurrence = 0
    for (let i = 0; i < sorted.length; i++) {
      if (sorted.slice(i + 1).some((n) => n.cyclesInChannel > sorted[i].cyclesInChannel)) recurrence++
    }
    const agree = sorted.filter((r) => r.lens === r.named).length
    return {
      channel,
      claims: sorted.length,
      namedRate: cycles > 0 ? sorted.length / cycles : null,
      recurrence,
      lensAgreement: sorted.length > 0 ? agree / sorted.length : null,
    }
  })
}
