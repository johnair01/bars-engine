import type { Metadata } from 'next'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DeckPreviewGallery } from '@/components/deck/DeckPreviewGallery'
import { DeckPurchaseCTA } from '@/components/launch/DeckPurchaseCTA'

export const metadata: Metadata = {
  title: 'The Allyship Deck — Card Gallery (Preview)',
  description: 'All 120 Allyship Deck cards, viewable without an account — for design review.',
}

/**
 * @route /deck/preview
 * @page /deck/preview
 * @entity SYSTEM
 * @description Unauthenticated gallery of all 120 Allyship Deck cards (the high-fidelity
 *   card primitive). Reads the public `allyship-deck.json` directly — no paywall — so the
 *   deck is reviewable without the `deck-digital` entitlement. The full app lives at /deck.
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
      <div className="mx-auto w-full max-w-[680px] px-5 py-10 sm:px-8">
        <DeckPurchaseCTA
          variant="card"
          blurb="You just browsed all 120 cards. Get the full deck to draw, track, and turn any move into real action — for yourself or a campaign."
        />
      </div>
    </main>
  )
}
