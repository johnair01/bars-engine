/**
 * @route GET /board/callsheet/[name]
 * @entity SYSTEM
 * @description A council callsheet in full (council/callsheets/<name>.md, top level only), opened from a card that cites it. The text comes from the content store, which six-faces-council pushes; it is shown as escaped plain text, never as markup
 * @permissions owner (BOARD_OWNER_PLAYER_ID) or COUNCIL_MENU_TOKEN; others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { allowedPath, readText } from '@/lib/board/content-store'
import { councilCaller } from '@/lib/work/lanes'

export const dynamic = 'force-dynamic'

/** One file name, never a path: `council/callsheets/<name>` must also pass the content store's own list, so the two
 *  rules cannot drift apart (his B on waker-faces-xhl3h9d4, 2026-11-21). */
const NAME = /^[A-Za-z0-9._-]+\.md$/i

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function callsheetPage(name: string, text: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)}</title>
<style>body{margin:0;padding:16px;background:#14110f;color:#ece4d6;font:15px/1.55 ui-monospace,Menlo,Consolas,monospace}
main{max-width:84ch;margin:0 auto}h1{font:600 14px/1.4 system-ui,sans-serif;opacity:.7}
pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}</style></head>
<body><main><h1>council/callsheets/${esc(name)}</h1><pre>${esc(text)}</pre></main></body></html>`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  let name = ''
  try { name = decodeURIComponent((await params).name) } catch { return new NextResponse('Not a callsheet.', { status: 404 }) }
  const path = 'council/callsheets/' + name
  if (!NAME.test(name) || name.includes('..') || !allowedPath(path)) return new NextResponse('Not a callsheet.', { status: 404 })
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.redirect(new URL('/login?returnTo=' + encodeURIComponent('/board/callsheet/' + encodeURIComponent(name)), req.url))
  const text = await readText(path).catch(() => null)
  if (text === null) return new NextResponse('That callsheet has not been pushed.', { status: 404 })
  return new NextResponse(callsheetPage(name, text), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
               'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" },
  })
}
