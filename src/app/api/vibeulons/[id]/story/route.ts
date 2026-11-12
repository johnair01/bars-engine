/**
 * @route GET /api/vibeulons/[id]/story
 * @entity VIBULON
 * @description A coin's story in plain lines, oldest first: who minted it, where it rested, who it was given to. No card words.
 * @permissions Signed-in player who holds the coin or appears in one of its marks
 * @relationships VIBULON (VibulonMark)
 * @example GET /api/vibeulons/v_123/story
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer } from '@/lib/between/store'
import { coinStory, energyFeel, energyPhrase } from '@/lib/economy/coin-marks'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await currentPlayer()
  if (!me) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const { id } = await ctx.params
  const [coin, marks] = await Promise.all([
    db.vibulon.findUnique({ where: { id }, select: { ownerId: true, energy: true } }),
    db.vibulonMark.findMany({ where: { vibulonId: id }, select: { playerId: true, toId: true, energy: true } }),
  ])
  if (!coin && marks.length === 0) return NextResponse.json({ error: 'No such coin.' }, { status: 404 })
  const mine = coin?.ownerId === me.id || marks.some((m) => m.playerId === me.id || m.toId === me.id)
  if (!mine) return NextResponse.json({ error: 'That coin is not yours to read.' }, { status: 403 })
  const energy = coin?.energy ?? marks.find((m) => m.energy != null)?.energy ?? null
  return NextResponse.json({ story: await coinStory(db, id, me.id), energy: energyPhrase(energy), feel: energyFeel(energy) })
}
