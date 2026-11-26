/**
 * @route POST /api/wa/quest-payout
 * @entity VIBULON
 * @description A signed-in WorkAdventure player finished a dojo quest: pay its bounty once. Called by the dojo map script.
 * @permissions WorkAdventure room token (WA.player.userRoomToken), verified with WA_ROOM_TOKEN_SECRET
 * @relationships VIBULON, VIBULON_EVENT
 * @example POST /api/wa/quest-payout { "questId": "first-light", "userRoomToken": "<jwt>" }
 * @agentDiscoverable false
 *
 * Answers: 200 { paid: true, amount } | 200 { paid: false, already: true } | 200 { paid: false, reason: 'amount-unset' }
 * | 400 unknown quest | 401 bad token | 404 no player (a guest's token names no account) | 503 payout not configured.
 * Board look npc-bounty-1 (A): the browser remembers a guest's finish and calls this once they sign in.
 */
import type { PrismaClient } from '@prisma/client'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { WA_MAP_STORAGE_PUBLIC_URL } from '@/lib/wa/config'
import { findPlayerByIdentifier, playerNotFoundResponse } from '@/lib/wa/player-lookup'
import { bountyFor, WA_QUESTS } from '@/lib/wa/quest-table'
import { payQuestBounty } from '@/lib/wa/quest-payout'
import { userIdentifierFromRoomToken } from '@/lib/wa/room-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The map script runs on the box's origin and calls us from the browser.
const ORIGIN = new URL(WA_MAP_STORAGE_PUBLIC_URL).origin
const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors })

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { questId?: string; userRoomToken?: string } | null
  const quest = body?.questId ? WA_QUESTS[body.questId] : undefined
  if (!quest) return json({ error: 'unknown quest' }, 400)

  const who = userIdentifierFromRoomToken(body?.userRoomToken)
  if (!who.ok) return json({ error: who.error }, who.status)

  const player = await findPlayerByIdentifier(who.userIdentifier, { id: true }, 'quest-payout')
  if (!player) {
    const r = playerNotFoundResponse(who.userIdentifier)
    return new Response(r.body, { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const amount = bountyFor(quest.id)
  if (amount === null) return json({ paid: false, reason: 'amount-unset' })

  return json(await payQuestBounty(db as unknown as PrismaClient, { playerId: player.id, questId: quest.id, title: quest.title, amount }))
}
