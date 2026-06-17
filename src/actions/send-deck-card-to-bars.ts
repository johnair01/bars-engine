'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import { buildDeckSeed } from '@/lib/allyship-deck/seed'
import type { AllyshipDeck, MoveCard } from '@/lib/allyship-deck/types'

export type SendDeckCardResult = { success: true; barId: string } | { error: string }

/** Authoritative deck, assembled deterministically (no AI/DB) and memoized per process. */
let cachedDeck: AllyshipDeck | null = null
function deck(): AllyshipDeck {
  return (cachedDeck ??= assembleDeck())
}

/**
 * "Send to BARS" — a deck card seeds a new quest (CustomBar) in the player's vault,
 * stamping the originating card into `agentMetadata` provenance. The seed *blooms* into a
 * quest where the BAR flow lives (capture charge / 3·2·1 happen on the quest, not the card).
 *
 * Card text is read from the authoritative `assembleDeck()` (not the client) so the seed is
 * trustworthy. Lands the player on `/bars/{id}`, which already wires charge + 3·2·1.
 *
 * @see .specify/specs/allyship-deck-experience/spec.md (slice 3)
 * @see src/actions/emit-bar-from-passage.ts (provenance precedent)
 */
export async function sendDeckCardToBars(input: {
  cardId: string
  subject?: 'self' | 'campaign'
}): Promise<SendDeckCardResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const card = deck().cards.find(
    (c): c is MoveCard => c.kind === 'move' && c.id === input.cardId,
  )
  if (!card) return { error: 'Card not found' }

  const subject = input.subject === 'campaign' ? 'campaign' : 'self'
  const seed = buildDeckSeed(card, subject)

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        title: seed.title,
        description: seed.description,
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: null, // unclaimed seed — appears in the vault, claimed on plant/accept
        inputs: JSON.stringify([]),
        rootId: seed.rootId,
        agentMetadata: JSON.stringify(seed.provenance),
      },
    })

    revalidatePath('/bars')
    revalidatePath('/hand')

    return { success: true, barId: bar.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send to BARS' }
  }
}
