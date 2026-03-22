/**
 * Pure helpers for prompt deck draw / discard JSON arrays (BarDeckCard ids).
 */

export function parseIdArray(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

export function stringifyIdArray(ids: string[]): string {
  return JSON.stringify(ids)
}

/** Fisher–Yates shuffle (copy). */
export function shuffleIds(ids: string[]): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function removeIdOnce(ids: string[], id: string): string[] {
  const i = ids.indexOf(id)
  if (i === -1) return ids
  return [...ids.slice(0, i), ...ids.slice(i + 1)]
}

export function appendDiscardUnique(discard: string[], id: string): string[] {
  if (discard.includes(id)) return discard
  return [...discard, id]
}

/** Pick random index in draw; returns { index, id } or null if empty. */
export function pickRandomDrawIndex(draw: string[]): { index: number; id: string } | null {
  if (draw.length === 0) return null
  const index = Math.floor(Math.random() * draw.length)
  return { index, id: draw[index]! }
}
