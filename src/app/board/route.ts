/**
 * @route GET /board
 * @entity SYSTEM
 * @description The Nonprofit Board, served from six-faces-council main and saving to bars-engine
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { PAGE_HEADERS, pageLoader, wrapBoardPage } from '@/lib/board/page'

export const dynamic = 'force-dynamic'
const PAGE_URL = process.env.BOARD_PAGE_URL
  || 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/nonprofit/nonprofit-board.html'
const page = pageLoader(PAGE_URL)

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.redirect(new URL('/login?returnTo=/board', req.url))
  const html = await page()
  if (!html) return new NextResponse('The board page could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(wrapBoardPage(html, 'nonprofit', '/board'), { headers: PAGE_HEADERS })
}
