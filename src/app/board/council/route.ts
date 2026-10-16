/**
 * @route GET /board/council
 * @entity SYSTEM
 * @description The Council Board, served from six-faces-council main and saving to bars-engine (board=council)
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { PAGE_HEADERS, pageLoader, wrapBoardPage } from '@/lib/board/page'
import { patchCouncilPage } from '@/lib/board/council-page'

export const dynamic = 'force-dynamic'
const PAGE_URL = process.env.BOARD_COUNCIL_PAGE_URL
  || 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/council-board.html'
const page = pageLoader(PAGE_URL, patchCouncilPage)

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.redirect(new URL('/login?returnTo=/board/council', req.url))
  const html = await page()
  if (!html) return new NextResponse('The board page could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(wrapBoardPage(html, 'council', '/board/council'), { headers: PAGE_HEADERS })
}
