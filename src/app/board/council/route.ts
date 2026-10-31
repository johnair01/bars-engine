/**
 * @route GET /board/council
 * @entity SYSTEM
 * @description The Council Board, pushed from six-faces-council main and saving to bars-engine as board=council
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest } from 'next/server'
import { serveBoard } from '../serve'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return serveBoard(req, 'council')
}
