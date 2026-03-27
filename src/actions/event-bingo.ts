'use server'
/**
 * Event bingo card server actions.
 *
 * claim   — creates EventParticipant + EventBingoCard (provisioned from corpus)
 * save    — persists square state (name, note, sentAt, completedAt)
 * prize   — records prize claim; mints vibeulons when prizeType='vibeulon'
 */
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCommunityCharacterCorpus } from '@/actions/community-character'
import { selectBingoPrompts } from '@/lib/community-character/select-prompts'
import type { BingoCardSquare, BingoPrizeConfig } from '@/lib/community-character/types'

// ─── Bingo detection ─────────────────────────────────────────────────────────

const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
]

function detectBingoLines(squares: BingoCardSquare[]): number[][] {
  return BINGO_LINES.filter((line) => line.every((i) => !!squares[i]?.completedAt))
}

// ─── Claim ───────────────────────────────────────────────────────────────────

export async function claimEventBingoCard(
  eventId: string,
): Promise<{ cardId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const event = await db.eventArtifact.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventType: true,
      targetMoves: true,
      status: true,
      instanceId: true,
      instance: { select: { id: true, campaignRef: true } },
    },
  })
  if (!event) return { error: 'Event not found' }
  if (!['scheduled', 'live'].includes(event.status)) return { error: 'Event is not open for registration' }

  // Idempotent — return existing card if already claimed
  const existing = await db.eventBingoCard.findUnique({
    where: { playerId_eventId: { playerId: player.id, eventId } },
    select: { id: true },
  })
  if (existing) return { cardId: existing.id }

  const campaignRef = event.instance?.campaignRef ?? ''
  const instanceId = event.instanceId

  // Load corpus from instance (may be null — fallback to generic prompts)
  const corpus = instanceId ? await getCommunityCharacterCorpus(instanceId) : null

  let targetMoves: string[] = []
  try {
    const parsed = JSON.parse(event.targetMoves ?? '[]')
    if (Array.isArray(parsed)) targetMoves = parsed
  } catch { /* ignore */ }

  const squares = selectBingoPrompts(corpus, { eventType: event.eventType, targetMoves })

  // Create EventParticipant + EventBingoCard in a transaction
  const card = await db.$transaction(async (tx) => {
    await tx.eventParticipant.upsert({
      where: { eventId_participantId: { eventId, participantId: player.id } },
      create: {
        eventId,
        participantId: player.id,
        participantState: 'interested',
      },
      update: {},
    })

    return tx.eventBingoCard.create({
      data: {
        playerId: player.id,
        eventId,
        campaignRef,
        squares: squares as object[],
        completedLines: [],
      },
      select: { id: true },
    })
  })

  return { cardId: card.id }
}

// ─── Save squares ─────────────────────────────────────────────────────────────

export async function saveBingoSquares(
  cardId: string,
  squares: BingoCardSquare[],
): Promise<{ ok: true; completedLines: number[][] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const card = await db.eventBingoCard.findUnique({
    where: { id: cardId },
    select: { playerId: true },
  })
  if (!card) return { error: 'Card not found' }
  if (card.playerId !== player.id) return { error: 'Forbidden' }

  const completedLines = detectBingoLines(squares)

  await db.eventBingoCard.update({
    where: { id: cardId },
    data: {
      squares: squares as object[],
      completedLines: completedLines as object[],
    },
  })

  return { ok: true, completedLines }
}

// ─── Claim prize ─────────────────────────────────────────────────────────────

export async function claimBingoPrize(
  cardId: string,
): Promise<{ ok: true; prize: BingoPrizeConfig } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const card = await db.eventBingoCard.findUnique({
    where: { id: cardId },
    include: {
      event: { select: { bingoConfig: true } },
    },
  })
  if (!card) return { error: 'Card not found' }
  if (card.playerId !== player.id) return { error: 'Forbidden' }
  if (card.prizeClaimedAt) return { error: 'Prize already claimed' }

  const squares = card.squares as unknown as BingoCardSquare[]
  const lines = detectBingoLines(squares)
  if (lines.length === 0) return { error: 'No bingo yet' }

  const prizeRaw = card.event.bingoConfig as Record<string, unknown> | null
  if (!prizeRaw) return { error: 'No prize configured for this event' }

  await db.eventBingoCard.update({
    where: { id: cardId },
    data: { prizeClaimedAt: new Date() },
  })

  // Mint vibeulons when applicable
  if (prizeRaw.prizeType === 'vibeulon' && typeof prizeRaw.vibeulonAmount === 'number') {
    await db.vibeulonLedger.create({
      data: {
        playerId: player.id,
        amount: prizeRaw.vibeulonAmount,
        type: 'MINT',
        metadata: JSON.stringify({ source: 'bingo_prize', cardId }),
      },
    })
    return { ok: true, prize: { prizeType: 'vibeulon', vibeulonAmount: prizeRaw.vibeulonAmount } }
  }

  return {
    ok: true,
    prize: { prizeType: 'custom', description: String(prizeRaw.description ?? 'Prize unlocked') },
  }
}
