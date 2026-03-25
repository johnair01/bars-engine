'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getPartyMiniGameDefinition } from '@/lib/party-mini-game/definitions'
import {
  buildPartyMiniGameCompletionEffects,
  type PartyMiniGameBarStampV1,
} from '@/lib/party-mini-game/completion-effects-party-mini-game'
import type { PartyMiniGameMomentBarInput } from '@/lib/party-mini-game/bar-create-types'
import { assertCanCreatePrivateDraft } from '@/lib/vault-limits'

const MAX_TITLE = 200
const MAX_GUEST_NAME = 120
const MAX_QUERY = 64

function truncateTitle(s: string): string {
  const t = s.trim()
  if (t.length <= MAX_TITLE) return t
  return `${t.slice(0, MAX_TITLE - 1)}…`
}

/**
 * Autocomplete for linking a moment to someone in the game (name contains).
 * Returns id + display name only — no emails.
 */
export async function searchPlayersForPartyMiniGame(
  query: string,
): Promise<{ id: string; name: string }[]> {
  const q = query.trim().slice(0, MAX_QUERY)
  if (q.length < 2) return []

  try {
    return await db.player.findMany({
      where: {
        creatorType: 'human',
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true },
      take: 12,
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

/**
 * Create a private vault BAR for one party mini-game square + person (in-game or guest name).
 */
export async function createPartyMiniGameMomentBar(
  input: PartyMiniGameMomentBarInput,
): Promise<{ success: true; barId: string } | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { error: 'Log in to save this moment to your vault.' }

  const def = getPartyMiniGameDefinition(input.miniGameId)
  if (!def) return { error: 'Unknown mini-game.' }

  const square = def.squares.find((s) => s.id === input.squareId)
  if (!square) return { error: 'Unknown square for this card.' }

  const guestTrimmed = input.guestName?.trim() ?? ''
  const hasGuest = guestTrimmed.length > 0
  const hasTagged = !!input.taggedPlayerId?.trim()

  if (hasTagged && hasGuest) {
    return { error: 'Choose either someone in the game or a guest name, not both.' }
  }
  if (!hasTagged && !hasGuest) {
    return { error: 'Add who this moment was with (search or guest name).' }
  }
  if (guestTrimmed.length > MAX_GUEST_NAME) {
    return { error: `Guest name is too long (max ${MAX_GUEST_NAME} characters).` }
  }

  let personLabel: string
  let taggedPlayerId: string | null = null
  let guestName: string | null = null

  if (hasTagged) {
    const taggedId = input.taggedPlayerId!.trim()
    const other = await db.player.findFirst({
      where: { id: taggedId, creatorType: 'human' },
      select: { id: true, name: true },
    })
    if (!other) return { error: 'That player was not found.' }
    personLabel = other.name
    taggedPlayerId = other.id
  } else {
    personLabel = guestTrimmed
    guestName = guestTrimmed
  }

  const cap = await assertCanCreatePrivateDraft(playerId)
  if (!cap.ok) return { error: cap.error }

  const title = truncateTitle(`${square.text} — with ${personLabel}`)
  const description = [
    `Event card: ${def.title}`,
    `Prompt: ${square.text}`,
    `With: ${personLabel}`,
    input.taggedPlayerId ? '(Player in the game)' : '(Guest — not linked to an account)',
  ].join('\n')

  const stamp: PartyMiniGameBarStampV1 = {
    grammar: 'party-mini-game-v1',
    miniGameId: def.id,
    eventKey: input.eventKey.trim(),
    campaignRef: def.campaignRef,
    squareId: square.id,
    taggedPlayerId,
    guestName,
    capturedAt: new Date().toISOString(),
  }

  try {
    const newBar = await db.customBar.create({
      data: {
        creatorId: playerId,
        title,
        description,
        type: 'vibe',
        reward: 1,
        inputs: '[]',
        visibility: 'private',
        status: 'active',
        storyPath: 'collective',
        storyContent: null,
        completionEffects: buildPartyMiniGameCompletionEffects(stamp),
        rootId: 'temp',
        campaignRef: def.campaignRef,
        gameMasterFace: null,
      },
    })

    await db.customBar.update({
      where: { id: newBar.id },
      data: { rootId: newBar.id },
    })

    revalidatePath('/hand')
    revalidatePath('/')
    return { success: true, barId: newBar.id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save BAR'
    console.error('[party-mini-game-bar]', msg, e)
    return { error: msg }
  }
}
