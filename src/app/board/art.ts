/** Look pictures for the Council Board (Wendell, 2026-10-30: "we need a solution for me to see these screenshots in
 * the council board and on bars-engine without breaking the bank on storage"). six-faces-council is private, so its
 * board Actions push the pictures to the content store (src/lib/board/content-store.ts) and this host serves them from
 * there; the CDN holds each picture after its first request. /board/stills/<path> is the picture; /board/look is a page to
 * inspect a look's pictures at full size. Only image files under the two stills folders are passed, never the repo. */
import { NextResponse } from 'next/server'
import { readFile } from '@/lib/board/content-store'

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }

/** The repo path a /board/stills/ request names, or null. A bare `<hash>.<ext>` is a board still (board/stills/,
 * named by its content, so it never changes); a longer path must sit under council/callsheets/stills/. */
export function artPath(parts: string[]): string | null {
  let p: string
  try { p = parts.map(decodeURIComponent).join('/') } catch { return null }
  if (!/\.(jpe?g|png|gif|webp)$/i.test(p) || p.includes('..') || p.includes('//') || /[^A-Za-z0-9._\/ -]/.test(p)) return null
  if (/^[0-9a-f]{16}\.[a-z]+$/.test(p)) return 'board/stills/' + p
  return p.startsWith('council/callsheets/stills/') ? p : null
}

export async function serveArt(parts: string[]): Promise<NextResponse> {
  const p = artPath(parts)
  if (!p) return new NextResponse('Not a look picture.', { status: 404 })
  const f = await readFile(p)
  if (!f) return new NextResponse('That picture has not been pushed from six-faces-council main.', { status: 404 })
  const hashed = p.startsWith('board/stills/')
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title || 'A look')}</title><style>
:root{--bg:#f6f5f1;--fg:#1d1f1e;--muted:#5d625f;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#17191a;--fg:#ece9e1;--muted:#a4a8a3;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;padding:16px}
h1{font-size:1.25rem;margin:0 0 4px}p{color:var(--muted);margin:0 0 16px;font-size:.9rem}
figure{margin:0 0 24px}figure img{display:block;width:100%;height:auto;cursor:zoom-in;border-radius:6px;background:#fff}
figure.big{overflow:auto}figure.big img{width:auto;max-width:none;cursor:zoom-out}
figcaption{font-size:.8rem;color:var(--muted);margin-top:4px}
</style></head><body><h1>${esc(title || 'A look')}</h1>
<p>${pics.length ? 'Tap a picture to see it at full size and pan around it; tap again to fit. Answer on the Council Board.' : 'This link names no pictures.'}</p>
${figs}<script>
document.addEventListener('click', e => { const i = e.target.closest('figure img'); if (!i) return; e.preventDefault(); i.closest('figure').classList.toggle('big') })
</script></body></html>`
}
