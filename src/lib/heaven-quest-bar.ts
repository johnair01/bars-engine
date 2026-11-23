/** Shared constants for the Heaven quest BAR (server action and route). Plain module: a "use server" file may export only async functions. */
export const QUEST_SOURCE = 'heaven-quest'
export const ENDINGS = ['tried', 'smaller', 'chose-not', 'nothing-changed'] as const
export type QuestEnding = (typeof ENDINGS)[number]
export const MAX_SENTENCE = 280
/** One line as typed: one line, trimmed, capped. Pure. */
export const oneLine = (t: unknown, max: number): string => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** The seal strokes the card draws: [[x, y]...][] in 0..1, at most 12 strokes of 240 points. Same rule as cleanSeal in
 *  public/between/bar-card-data.js (a test holds the two together); the server keeps only what passes. Pure. */
export const MAX_STROKES = 12
export const MAX_POINTS = 240
export function cleanSealStrokes(strokes: unknown): number[][][] {
  if (!Array.isArray(strokes)) return []
  const out: number[][][] = []
  for (const s of strokes.slice(0, MAX_STROKES)) {
    if (!Array.isArray(s)) continue
    const pts = s.slice(0, MAX_POINTS)
      .filter((p): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map((p) => [Math.min(1, Math.max(0, +p[0].toFixed(3))), Math.min(1, Math.max(0, +p[1].toFixed(3)))])
    if (pts.length) out.push(pts)
  }
  return out
}
