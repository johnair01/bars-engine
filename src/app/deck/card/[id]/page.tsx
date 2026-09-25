import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { assembleDeck, getMoveCardById } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { DeckCardLanding } from '@/components/deck/DeckCardLanding'

/**
 * @route /deck/card/[id]
 * @page /deck/card/:id
 * @entity SYSTEM
 * @description Public, ungated landing page for one Allyship Deck card — the destination
 *   for card-specific marketing links (e.g. `/deck/card/WAKE-RA-SAGE`). Looks the card up
 *   in the assembled deck by its canonical `MOVE-DOMAIN-OPERATION` id, renders the question
 *   side plus a fixed CTA back to `/deck/sales`, and emits per-card Open Graph tags so the
 *   social preview matches the card the post was about. Unknown ids redirect to `/deck/sales`.
 * @permissions public
 * @energyCost 0 (read-only)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:funnel, ENERGY:N/A
 * @agentDiscoverable true
 * @example /deck/card/WAKE-RA-SAGE
 */

type Props = { params: Promise<{ id: string }> }

/** Normalize a URL slug to the canonical card id (ids are upper-case, e.g. WAKE-RA-SAGE). */
function normalizeId(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase()
}

/** Pre-render every move card as a static page (HTML only; fast, SEO-friendly). */
export function generateStaticParams(): { id: string }[] {
  return assembleDeck()
    .cards.filter((c): c is MoveCard => c.kind === 'move')
    .map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const card = getMoveCardById(normalizeId(id))

  if (!card) {
    return { title: 'The Allyship Deck' }
  }

  const description = card.primaryQuestion
  const title = `${card.title} — The Allyship Deck`

  return {
    title,
    description,
    // og/twitter images come from the co-located `opengraph-image` route so each
    // card link previews as itself. Titles/description are set here.
    openGraph: {
      title: card.title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: card.title,
      description,
    },
  }
}

export default async function DeckCardPage({ params }: Props) {
  const { id } = await params
  const card = getMoveCardById(normalizeId(id))

  // Unknown id → send them somewhere useful (the deck storefront) rather than a dead end.
  if (!card) {
    redirect('/deck/sales')
  }

  return <DeckCardLanding card={card} />
}
