import type { Metadata } from 'next'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { DECK_SOCIAL_PROOF } from '@/lib/launch/deck-sales-copy'
import {
  LAUNCH_OFFERS,
  formatPrice,
  isOfferLive,
  isSuperpowerPackKey,
  offerByKey,
  offerHref,
} from '@/lib/launch/offers'
import { DeckSalesExperience, type SalesPack } from '@/components/deck/DeckSalesExperience'

export const metadata: Metadata = {
  title: 'The Allyship Deck - moves for the moment it counts',
  description:
    'A 120-card physical and digital oracle deck that hands you one concrete allyship move in the moment.',
}

const isMove = (c: { kind: string }): c is MoveCard => c.kind === 'move'

export default function DeckSalesPage() {
  const moves = assembleDeck().cards.filter(isMove)

  // Pre-format the expansion packs on the server so the client component never
  // pulls in the offers registry. This page is the packs' only storefront.
  const packs: SalesPack[] = LAUNCH_OFFERS.filter((o) => isSuperpowerPackKey(o.key)).map((o) => ({
    key: o.key,
    name: o.name,
    blurb: o.blurb,
    priceLabel: formatPrice(o.priceCents),
    accent: o.accent,
    gumroadUrl: isOfferLive(o) ? o.gumroadUrl : undefined,
    live: isOfferLive(o),
  }))
  const packLead =
    packs.length > 0
      ? `Add your superpowers to the deck — 60 move-cards each, inner and outer. ${packs[0]!.priceLabel} a pack.`
      : undefined

  // Real deck pricing from the launch registry (was "pending" in the design handoff).
  const digital = offerByKey('deck-digital')
  const physical = offerByKey('deck-physical')
  // "Get the deck" goes straight to the digital deck's Gumroad product (the
  // low-friction, instant-access entry point). offerHref falls back to
  // /launch#deck-digital if the Gumroad URL isn't wired yet — honest, never dead.
  const ctaHref = offerHref('deck-digital')
  const priceLine =
    digital && physical
      ? `Digital ${formatPrice(digital.priceCents)} · Physical ${formatPrice(physical.priceCents)} — preorder now, ships after the print run.`
      : undefined
  const ctaPrice =
    digital && physical
      ? `digital ${formatPrice(digital.priceCents)} · physical ${formatPrice(physical.priceCents)} preorder`
      : undefined

  return (
    <DeckSalesExperience
      cards={moves}
      packs={packs}
      packLead={packLead}
      socialProof={DECK_SOCIAL_PROOF}
      priceLine={priceLine}
      ctaPrice={ctaPrice}
      ctaHref={ctaHref}
    />
  )
}
