import { clampCharge } from './constellation'
import { MAX_TEXT_LENGTH, MAX_WORD_LENGTH, type Constellation } from './types'

export const MAX_WORDS = 200
export const MAX_TRIANGLES = 200

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/**
 * Rebuilds a Constellation from untrusted JSON (a client save). Shape is enforced, not trusted: three distinct known
 * word ids per triangle, charges clamped to −3…+3, text trimmed to its limits, sizes capped. Anything malformed is
 * dropped rather than repaired, so a bad save can never put a triangle on the wall that the grammar would refuse.
 */
export function sanitizeConstellation(input: unknown): Constellation | null {
  if (!isObj(input) || typeof input.id !== 'string' || !input.id) return null
  const words = (Array.isArray(input.words) ? input.words : []).slice(0, MAX_WORDS).flatMap(w =>
    isObj(w) && typeof w.id === 'string' && str(w.label, MAX_WORD_LENGTH).trim()
      ? [{ id: w.id, label: str(w.label, MAX_WORD_LENGTH).trim(), charge: clampCharge(num(w.charge, 0)) }] : [])
  const known = new Set(words.map(w => w.id))
  const triangles: Constellation['triangles'] = []
  for (const t of (Array.isArray(input.triangles) ? input.triangles : []).slice(0, MAX_TRIANGLES)) {
    if (!isObj(t) || typeof t.id !== 'string' || !Array.isArray(t.wordIds) || t.wordIds.length !== 3) continue
    const ids = t.wordIds as unknown[]
    if (!ids.every((i): i is string => typeof i === 'string' && known.has(i)) || new Set(ids).size !== 3) continue
    const parent = typeof t.parentTriangleId === 'string' && triangles.some(p => p.id === t.parentTriangleId) ? t.parentTriangleId : undefined
    const anchor = parent && typeof t.anchorWordId === 'string' && ids.includes(t.anchorWordId) ? t.anchorWordId : undefined
    triangles.push({
      id: t.id, wordIds: [ids[0], ids[1], ids[2]] as [string, string, string], x: Math.max(0, Math.min(100, num(t.x, 50))),
      y: Math.max(0, Math.min(100, num(t.y, 50))), ...(parent && anchor ? { parentTriangleId: parent, anchorWordId: anchor } : {}),
    })
  }
  const tIds = new Set(triangles.map(t => t.id))
  const bridges = (Array.isArray(input.bridges) ? input.bridges : []).slice(0, MAX_TRIANGLES).flatMap(b =>
    isObj(b) && typeof b.id === 'string' && tIds.has(String(b.chargedTriangleId)) && tIds.has(String(b.positiveTriangleId)) && str(b.text, MAX_TEXT_LENGTH).trim()
      ? [{ id: b.id, chargedTriangleId: String(b.chargedTriangleId), positiveTriangleId: String(b.positiveTriangleId), text: str(b.text, MAX_TEXT_LENGTH).trim(), createdAt: str(b.createdAt, 40) }] : [])
  const history = (Array.isArray(input.history) ? input.history : []).slice(-500).flatMap(h =>
    isObj(h) && typeof h.id === 'string' && known.has(String(h.wordId)) && (h.kind === 'charge_shift' || h.kind === 'eighth_ray')
      ? [{ id: h.id, kind: h.kind as 'charge_shift' | 'eighth_ray', wordId: String(h.wordId), from: clampCharge(num(h.from, 0)), to: clampCharge(num(h.to, 0)), at: str(h.at, 40), ...(h.undone === true ? { undone: true } : {}) }] : [])
  return { id: input.id, words, triangles, bridges, history }
}
