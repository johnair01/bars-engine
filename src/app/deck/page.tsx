import type { Metadata } from 'next'
import { AllyshipDeckReader } from '@/components/deck/AllyshipDeckReader'
import { Paywall } from '@/components/launch/Paywall'
import { checkAccess } from '@/lib/entitlements/gate'
import { getDeckStats } from '@/actions/deck-journal'

export const metadata: Metadata = {
  title: 'The Allyship Deck — Mastering Allyship Moves',
  description: 'A consultable deck of allyship moves, unlocked for backers.',
}

/**
 * /deck — the digital deck product surface: **the Allyship Deck** (the
 * consultable move library — 120 cards across 5 moves × 6 operations × 4
 * domains), gated by the `deck-digital` capability (granted directly, via the
 * game subscription, or the Founding Ally bundle; admins bypass). The Oracle
 * gift deck lives at /oracle.
 */
export default async function DeckPage() {
  const access = await checkAccess('deck-digital')

  if (!access.allowed) {
    return (
      <Paywall
        title="The Allyship Deck"
        message="The Allyship Deck unlocks with the deck purchase, the game subscription, or the Founding Ally bundle."
        authed={access.authed}
        learnMoreHref="/deck/sales"
        learnMoreLabel="What's in the deck?"
        returnTo="/deck"
      />
    )
  }

  const initialStats = await getDeckStats()
  return <AllyshipDeckReader initialStats={initialStats} authed={access.authed} />
}
