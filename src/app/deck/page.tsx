import type { Metadata } from 'next'
import { OracleReader } from '@/components/oracle/OracleReader'
import { Paywall } from '@/components/launch/Paywall'
import { checkAccess } from '@/lib/entitlements/gate'

export const metadata: Metadata = {
  title: 'Your Digital Deck — Mastering Allyship',
  description: 'The Oracle deck, unlocked for backers.',
}

/**
 * /deck — the digital deck product surface, gated by the `deck-digital`
 * capability (granted directly, via the game subscription, or the Founding Ally
 * bundle; admins bypass). Distinct from /oracle, which is a public gift deck.
 */
export default async function DeckPage() {
  const access = await checkAccess('deck-digital')

  if (!access.allowed) {
    return (
      <Paywall
        title="Your Digital Deck"
        message="Digital deck access comes with the deck purchase, the game subscription, or the Founding Ally bundle."
        authed={access.authed}
      />
    )
  }

  return <OracleReader />
}
