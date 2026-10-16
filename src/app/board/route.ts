/**
 * @route GET /board
 * @entity SYSTEM
 * @description The Nonprofit Board, served from six-faces-council main and saving to bars-engine
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest } from 'next/server'
import { serveBoard } from './serve'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return serveBoard(req, 'nonprofit')
}
