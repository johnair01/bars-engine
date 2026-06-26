import type { Metadata } from 'next'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DeckPreviewGallery } from '@/components/deck/DeckPreviewGallery'

export const metadata: Metadata = {
  title: 'The Allyship Deck — Sample Cards',
  description: 'A sample of the Allyship Deck, viewable without an account. Unlock all 120 cards with the deck purchase.',
}

/**
 * @route /deck/preview
 * @page /deck/preview
 * @entity SYSTEM
 * @description Unauthenticated sample gallery — a representative teaser of the Allyship
 *   Deck (the high-fidelity card primitive), not all 120 cards. Reads the public
 *   `allyship-deck.json` and samples it; the full deck unlocks with the `deck-digital`
 *   entitlement at /deck.
 * @permissions public
 * @energyCost 0 (read-only)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:funnel, ENERGY:N/A
 * @agentDiscoverable true
 * @example /deck/preview
 */
export default function DeckPreviewPage() {
  return (
    <main style={{ minHeight: '100vh', background: SURFACE_TOKENS.bgBase }}>
      <DeckPreviewGallery />
    </main>
  )
}
