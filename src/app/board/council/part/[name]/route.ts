/**
 * @route GET /board/council/part/[name]
 * @entity SYSTEM
 * @description A part of the Council Board page that a tab fetches when it first opens (decided: the settled positions and the full resolved record, for the Resolved and Projects tabs), pushed from six-faces-council main beside the page
 * @permissions owner (BOARD_OWNER_PLAYER_ID)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { servePart } from '../../../part'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'The board is open to its owner only.' }, { status: 401 })
  return servePart((await params).name, req.nextUrl.searchParams.get('v'))
}
