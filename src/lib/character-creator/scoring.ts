// ---------------------------------------------------------------------------
// Resonance scoring utilities — pure functions, no side effects
// ---------------------------------------------------------------------------

export function accumulateWeights(
  current: Record<string, number>,
  weights: Partial<Record<string, number>>
): Record<string, number> {
  const next = { ...current }
  for (const [key, delta] of Object.entries(weights)) {
    if (delta) next[key] = (next[key] ?? 0) + delta
  }
  return next
}

export function rankByScore(scores: Record<string, number>): Array<{ key: string; score: number }> {
  return Object.entries(scores)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score)
}

export function topKey(scores: Record<string, number>): string | null {
  const ranked = rankByScore(scores)
  return ranked.length > 0 && ranked[0].score > 0 ? ranked[0].key : null
}

export function resonancePercent(key: string, scores: Record<string, number>): number {
  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  return Math.round(((scores[key] ?? 0) / total) * 100)
}
