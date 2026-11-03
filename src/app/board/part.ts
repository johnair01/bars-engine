/** The Council Board's parts: data the page fetches when a tab first opens, so the page carries only what its open tabs
 * draw (six-faces-council council/callsheets/board-store-size.md, "Load only what is brought up"; Wendell, 2026-11-03:
 * "We should only be pulling what each page needs when it's brought up not the whole page all the time"). The council's
 * board/build_board.py writes each part beside the page and board/push_content.py pushes both in one manifest write, so
 * a page and its parts swap together. The page names a part with `?v=<first 16 hex of the part's hash>`; a request whose
 * v matches the pushed file is cached by the browser for good, any other answers fresh. Served to the owner only. */
import { NextResponse } from 'next/server'
import { readFile } from '@/lib/board/content-store'

/** Part name -> repo path. Only these are served. */
export const PARTS: Record<string, string> = {
  decided: 'board/council-board-decided.json',
}

export async function servePart(name: string, v: string | null): Promise<NextResponse> {
  const path = PARTS[name]
  if (!path) return NextResponse.json({ error: 'No such part of the board.' }, { status: 404 })
  const f = await readFile(path)
  if (!f) return NextResponse.json({ error: 'That part of the board has not been pushed here yet.' }, { status: 503 })
  const pinned = !!v && !!f.sha && /^[0-9a-f]{16}$/.test(v) && f.sha.startsWith(v)
  return new NextResponse(f.body, {
    headers: { 'Content-Type': 'application/json', 'Referrer-Policy': 'same-origin',
               'Cache-Control': pinned ? 'private, max-age=31536000, immutable' : 'private, no-store' },
  })
}
