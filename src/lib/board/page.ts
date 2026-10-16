import { boardShim, type BoardName } from '@/app/board/shim'

const FIVE_MINUTES = 5 * 60_000

/**
 * Loads a board page as six-faces-council main last built it, so a row that lands on main is on the board within five
 * minutes with no republish. The last good copy is kept in memory when GitHub cannot be reached.
 */
export function pageLoader(url: string, patch: (html: string) => string = h => h) {
  let cache: { html: string; at: number } | null = null
  return async function page(): Promise<string | null> {
    if (cache && Date.now() - cache.at < FIVE_MINUTES) return cache.html
    try {
      const r = await fetch(url, { cache: 'no-store' })
      if (r.ok) { cache = { html: patch(await r.text()), at: Date.now() }; return cache.html }
    } catch { /* keep the last good copy */ }
    return cache?.html ?? null
  }
}

/** The built page is a fragment (claude.ai supplies the document around it): no doctype, head, charset or viewport.
 * Served raw it would render in quirks mode, so it gets the document shell here, with the store shim first. */
export function wrapBoardPage(html: string, board: BoardName, path: string): string {
  const shim = boardShim(board, path)
  if (/<!doctype/i.test(html)) return html.replace(/<head[^>]*>/i, m => `${m}\n${shim}`)
  return `<!doctype html>\n<html lang="en"><head>\n<meta charset="utf-8">\n`
    + `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${shim}\n${html}`
}

export const PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
} as const
