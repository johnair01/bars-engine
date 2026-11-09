/** How old the board content bars-engine serves is, said once for the status route and for any page that asks it.
 *
 * The board is API-first: six-faces-council pushes its built pages and the files they read to /api/board/content,
 * which keeps them in a private Vercel Blob store, and /board and /board/council serve what that store last received
 * (src/lib/board/content-store.ts). Nothing on this side may read the six-faces repo, so the honest question is not
 * "is this main?" but "how long since a push landed?" The manifest's `at` is the moment of the last write, and a
 * manifest that stops moving is a board that has quietly stopped changing — which is what a person reading it cannot
 * see. This turns that into one number.
 */
import { backend, PAGE_PATHS, type Manifest } from './content-store'

export type PageFreshness = { sha: string; bytes: number }

export type Freshness = {
  configured: boolean
  at: string | null
  ageMinutes: number | null
  stale: boolean
  staleAfterMinutes: number
  files: number
  pages: Record<string, PageFreshness | null>
}

/** A board rebuilt on every push to main should not sit an hour and a half behind it. */
export const DEFAULT_STALE_MINUTES = 90

/** BOARD_CONTENT_STALE_MINUTES, for a season when the council is quiet on purpose. */
export function staleAfterMinutes(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.BOARD_CONTENT_STALE_MINUTES)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_STALE_MINUTES
}

/** The two pages, so the status names the build being served without the board having to be opened. */
const PAGES = Object.values(PAGE_PATHS)

export function freshness(m: Manifest, now = Date.now(), limit = DEFAULT_STALE_MINUTES): Freshness {
  const at = m.at || null
  const atMs = at ? Date.parse(at) : NaN
  // No `at` means nothing was ever pushed. That is not "zero minutes old": it is the one case with no board to age.
  const ageMinutes = Number.isFinite(atMs) ? Math.max(0, Math.round((now - atMs) / 60_000)) : null
  const pages: Record<string, PageFreshness | null> = {}
  for (const p of PAGES) {
    const e = m.files[p]
    pages[p] = e ? { sha: e.sha, bytes: e.size } : null
  }
  return {
    configured: !!backend(),
    at,
    ageMinutes,
    stale: ageMinutes === null || ageMinutes > limit,
    staleAfterMinutes: limit,
    files: Object.keys(m.files).length,
    pages,
  }
}
