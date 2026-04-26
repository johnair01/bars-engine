/**
 * DAOE Phase 2 FR2.2: POST /api/daoe/cast-fortune
 *
 * Triggers an I Ching cast — Fortune register invocation.
 * Wraps the existing castIChingTraditional action and returns DeltaUpdate alongside hexagram.
 *
 * Input:  POST { campaignId: string, intent?: string }
 * Output: { hexagram: HexagramResult, delta: DeltaUpdate }
 *
 * DAOE Phase 1 / Shaman: "The randomness is the feature."
 * This is the Fortune register in action — true randomness that shapes fictional outcomes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { isSuspended } from '@/lib/daoe/delta-service'
import type { HexagramResult } from '@/lib/daoe/types'

// ---------------------------------------------------------------------------
// Fortune state builder
// acquiredAt is the correct timestamp field on PlayerBar (not createdAt).
// ---------------------------------------------------------------------------

async function buildFortuneState(playerId: string): Promise<{ lastHexagram: string; lastCastAt: string; castHistory: string[] }> {
  const readings = await db.playerBar.findMany({
    where: { playerId, source: 'iching' },
    orderBy: { acquiredAt: 'desc' },
    take: 20,
    select: { barId: true, acquiredAt: true },
  })

  const hexagrams = await db.bar.findMany({
    where: { id: { in: readings.map((r) => r.barId) } },
    select: { id: true, name: true },
  })

  const nameMap = new Map(hexagrams.map((h) => [h.id, h.name]))

  return {
    lastHexagram: readings[0] ? String(nameMap.get(readings[0].barId) ?? readings[0].barId) : '',
    lastCastAt: readings[0]?.acquiredAt?.toISOString() ?? '',
    castHistory: readings.map((r) => String(nameMap.get(r.barId) ?? r.barId)),
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let json: Record<string, unknown>
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const campaignId = typeof json.campaignId === 'string' ? json.campaignId : ''

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  // Suspended check (Phase 4 FR4.2)
  if (await isSuspended(campaignId)) {
    return NextResponse.json({ error: 'Campaign is suspended' }, { status: 423 })
  }

  try {
    // Simulate 6 coin flips for I Ching
    const lines: Array<0 | 1> = Array.from({ length: 6 }, () =>
      Math.random() < 0.5 ? 0 : 1
    )
    const hexagramId = 1 + lines.reduce<number>((acc, bit, i) => acc + bit * Math.pow(2, i), 0)

    // Changing lines (1-3 random)
    const changingIndices: number[] = []
    while (changingIndices.length < Math.floor(Math.random() * 3) + 1) {
      const i = Math.floor(Math.random() * 6)
      if (!changingIndices.includes(i)) changingIndices.push(i)
    }

    const changingLines = changingIndices.map((i) => i + 1)

    // Resulting hexagram after line transformation
    const transformedLines = lines.map((b, i) => (changingIndices.includes(i) ? (1 - b) as 0 | 1 : b))
    const transformedHexagramId =
      changingIndices.length > 0
        ? 1 + transformedLines.reduce<number>((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
        : hexagramId

    // Fetch narrative from DB
    const hexagram = await db.bar.findUnique({ where: { id: hexagramId } })
    const resultHex = await db.bar.findUnique({ where: { id: transformedHexagramId } })

    const hexagramResult: HexagramResult = {
      hexagramId: String(hexagramId),
      changingLines,
      resultingHexagramId: String(transformedHexagramId),
      narrativeGuidance: resultHex?.tone ?? resultHex?.text ?? hexagram?.tone ?? '',
      registeredAt: new Date().toISOString(),
    }

    // Persist to playerBar (Fortune register write)
    await db.playerBar.create({
      data: {
        playerId,
        barId: hexagramId,
        source: 'iching',
        notes: `Fortune cast — DAOE Phase 2. Campaign: ${campaignId}`,
      },
    })

    // Build fortune state for delta
    const fortuneState = await buildFortuneState(playerId)

    return NextResponse.json(
      {
        hexagram: hexagramResult,
        delta: {
          campaignId,
          frame: 0,
          register: 'fortune',
          fortuneState,
          serverTime: Date.now(),
        },
      },
      { status: 200 },
    )
  } catch (e) {
    console.error('[daoe/cast-fortune]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
