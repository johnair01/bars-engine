/**
 * @route GET /api/board/picture
 * @entity SYSTEM
 * @description One picture from a board document, fetched only when the page draws it (pictures on demand,
 *   six-faces-council council/callsheets/board-store-size.md step 4). The page's store reads carry a link here in place
 *   of each large data:image string; the picture itself stays in the document in the database.
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID), or COUNCIL_MENU_TOKEN for a session
 * @example GET /api/board/picture?board=council&c=steps&id=pod9-thumb-look-1&p=still&h=0123456789abcdef
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { parseBoard } from '@/lib/board/save'
import { latestDoc } from '@/lib/board/store'
import { decodePicture, pictureIn } from '@/lib/board/pictures'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const q = req.nextUrl.searchParams
  const board = parseBoard(q.get('board')), c = q.get('c') ?? '', id = q.get('id') ?? '', p = q.get('p') ?? '', h = q.get('h') ?? ''
  if (!board || !c || !id || !p || !/^[0-9a-f]{16}$/.test(h))
    return NextResponse.json({ error: 'board, c, id, p and h name a picture' }, { status: 400 })
  const uri = pictureIn(await latestDoc(board, c, id), p, h)
  const pic = uri && decodePicture(uri)
  if (!pic) return NextResponse.json({ error: 'That picture is no longer in the document' }, { status: 404 })
  // The hash names the picture, so a link always means the same bytes: the browser keeps it and never asks twice.
  return new NextResponse(new Uint8Array(pic.bytes), {
    headers: { 'Content-Type': pic.type, 'Content-Length': String(pic.bytes.length),
               'Cache-Control': 'private, max-age=31536000, immutable' },
  })
}
