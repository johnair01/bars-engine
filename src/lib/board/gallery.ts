/** The asset gallery's read side (six-faces-council council/callsheets/asset-gallery.md). Two pushed files hold it:
 * council/gallery/crates.json (finished pictures, named on a round's `proof:` line) and council/gallery/holes.json
 * (planned rows of council/assets/*.yaml). They live in the content store, not the board store, which is at its limit. */
import { readText } from '@/lib/board/content-store'

export type Crate = {
  sha: string; path: string; round: string; at: string; maker: string | null; title: string; type: string
  reviewed?: { choice: string | null; at: string }
}
export type Hole = { id: string; node: string; class: string | null; name: string; pipe: string | null; price: { tokens: number; dollars: number } }
export const PAGE = 12

async function rows<T>(path: string): Promise<T[]> {
  const t = await readText(path).catch(() => null)
  if (!t) return []
  try { const j = JSON.parse(t) as { rows?: T[] }; return Array.isArray(j.rows) ? j.rows : [] } catch { return [] }
}

/** A cursor is the offset after the last card sent. A bad one starts over rather than failing. */
export function parseCursor(c: string | null): number {
  const n = Number(c)
  return Number.isInteger(n) && n > 0 ? n : 0
}

export function page<T>(all: T[], cursor: string | null) {
  const from = parseCursor(cursor), items = all.slice(from, from + PAGE)
  return { items, next: from + PAGE < all.length ? String(from + PAGE) : null }
}

/** `recent`: newest made first. `shelf` is what he reviewed lately (a look whose picture is a crate), newest review first. */
export async function recent(cursor: string | null) {
  const all = (await rows<Crate>('council/gallery/crates.json')).slice().sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  const shelf = all.filter(c => c.reviewed).sort((a, b) => (a.reviewed!.at < b.reviewed!.at ? 1 : -1)).slice(0, PAGE)
  const { items, next } = page(all, cursor)
  return { view: 'recent', cards: items.map(c => ({ ...c, picture: `/board/stills/sha/${c.sha}` })), shelf: shelf.map(c => ({ ...c, picture: `/board/stills/sha/${c.sha}` })), next }
}

/** `holes`: the planned rows, cheapest first, so a call for the next piece starts with the least spend. */
export async function holes(cursor: string | null) {
  const all = (await rows<Hole>('council/gallery/holes.json')).slice().sort((a, b) => (a.price?.tokens ?? 0) - (b.price?.tokens ?? 0) || (a.id < b.id ? -1 : 1))
  const { items, next } = page(all, cursor)
  return { view: 'holes', cards: items, next }
}
