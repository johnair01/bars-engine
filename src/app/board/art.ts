/** Look pictures for the Council Board (Wendell, 2026-10-30: "we need a solution for me to see these screenshots in
 * the council board and on bars-engine without breaking the bank on storage"). six-faces-council is private, so its
 * board Actions push the pictures to the content store (src/lib/board/content-store.ts) and this host serves them from
 * there; the CDN holds each picture after its first request. /board/stills/<path> is the picture; /board/look is a page to
 * inspect a look's pictures at full size. Only image files under the two stills folders are passed, never the repo. */
import { NextResponse } from 'next/server'
import { readFile, readObject } from '@/lib/board/content-store'
import { UI_TOKENS } from '@/lib/ui/tokens-link'

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }

/** The repo path a /board/stills/ request names, or null. A bare `<hash>.<ext>` is a board still (board/stills/,
 * named by its content, so it never changes); `sha/<sha256>.<ext>` is a stored object by its full hash, pushed by
 * board/post_rows.py from any branch before its row (the seal); a longer path must sit under council/callsheets/stills/. */
export function artPath(parts: string[]): string | null {
  let p: string
  try { p = parts.map(decodeURIComponent).join('/') } catch { return null }
  if (!/\.(jpe?g|png|gif|webp)$/i.test(p) || p.includes('..') || p.includes('//') || /[^A-Za-z0-9._\/ -]/.test(p)) return null
  if (/^[0-9a-f]{16}\.[a-z]+$/.test(p)) return 'board/stills/' + p
  if (p.startsWith('sha/')) return /^sha\/[0-9a-f]{64}\.[a-z]+$/.test(p) ? p : null
  return p.startsWith('council/callsheets/stills/') ? p : null
}

export async function serveArt(parts: string[]): Promise<NextResponse> {
  const p = artPath(parts)
  if (!p) return new NextResponse('Not a look picture.', { status: 404 })
  const byHash = p.startsWith('sha/')
  const f = byHash ? await readObject(p.slice(4, 68)) : await readFile(p)
  if (!f) return new NextResponse(byHash ? 'That picture is not in the content store.'
    : 'That picture has not been pushed from six-faces-council main.', { status: 404 })
  const hashed = byHash || p.startsWith('board/stills/')
  return new NextResponse(f.body, {
    headers: {
      'Content-Type': TYPES[p.split('.').pop()!.toLowerCase()],
      // A board still is named by its content: cache it for good. A callsheet frame can be redrawn under its name.
      'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** /board/look?t=<title>&i=<path>&i=<path>: each picture fills the width; a tap shows it at full size to pan, and a
 * phone pinches as usual. The board's Open it on an image look leads here (build_board.py writes the link). */
export function lookPage(title: string, paths: string[]): string {
  const pics = paths.map(p => artPath(p.replace(/^board\/stills\//, '').split('/'))).filter((p): p is string => !!p).slice(0, 24)
  const src = (p: string) => '/board/stills/' + (p.startsWith('board/stills/') ? p.slice(13) : p)
  const figs = pics.map(p => `<figure><a href="${esc(src(p))}" target="_blank" rel="noopener"><img src="${esc(src(p))}" alt="${esc(p.split('/').pop()!)}"></a><figcaption>${esc(p.split('/').pop()!)} · tap to zoom, or open it alone</figcaption></figure>`).join('')
  return `<!doctype html><html lang="en" data-theme="auto"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title || 'A look')}</title>
${UI_TOKENS}<style>
/* --ui-* from /ui/tokens.css (data-theme="auto" follows the device); each fallback is the value it had before */
:root{--bg:var(--ui-bg,#f6f5f1);--fg:var(--ui-ink,#1d1f1e);--muted:var(--ui-muted,#5d625f)}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 var(--ui-body,-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif);padding:16px}
h1{font:400 1.5rem/1.2 var(--ui-display,Georgia,serif);margin:0 0 6px;text-wrap:balance}p{color:var(--muted);margin:0 0 16px;font-size:.9rem}
figure{margin:0 0 24px}figure img{display:block;width:100%;height:auto;cursor:zoom-in;border-radius:6px;background:#fff}
figure.big{overflow:auto}figure.big img{width:auto;max-width:none;cursor:zoom-out}
figcaption{font-size:.875rem;color:var(--muted);margin-top:4px}
</style></head><body><h1>${esc(title || 'A look')}</h1>
<p>${pics.length ? 'Tap a picture to see it at full size and pan around it; tap again to fit. Answer on the Council Board.' : 'This link names no pictures.'}</p>
${figs}<script>
document.addEventListener('click', e => { const i = e.target.closest('figure img'); if (!i) return; e.preventDefault(); i.closest('figure').classList.toggle('big') })
</script></body></html>`
}
