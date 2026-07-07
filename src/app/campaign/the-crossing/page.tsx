import type { Metadata } from 'next'
import { TheCrossingLanding } from './TheCrossingLanding'
import {
  getCurrentPlayerIsAdmin,
  getTheCrossingPageContent,
} from '@/lib/the-crossing-page-content-server'

/**
 * @page /campaign/the-crossing
 * @entity CAMPAIGN
 * @description The Crossing — the community CYOA car-fund experience. Dedicated
 *   supporter-facing landing (hero → How To Play → domain gates + accordion role
 *   cards) that hands into the capture flow. A literal route segment that
 *   overrides the generic `/campaign/[ref]` landing for this campaign.
 * @permissions public (renders without a campaign record — static experience)
 * @relationships CustomBar (support_intake), Allyship Deck (starter cards)
 * @dimensions WHO:public supporter, WHAT:choose-a-path, WHERE:the-crossing, ENERGY:invite
 */

export const metadata: Metadata = {
  title: 'The Crossing | BARs',
  description:
    'Wendell needs a reliable car to keep showing up. Choose the path that fits what you can offer — every kind of help moves the campaign.',
  openGraph: {
    title: 'The Crossing',
    description: 'Wendell needs a reliable car to keep showing up. Choose your move.',
    type: 'website',
  },
}

export default async function TheCrossingPage() {
  const [content, isAdmin] = await Promise.all([
    getTheCrossingPageContent(),
    getCurrentPlayerIsAdmin(),
  ])

  return <TheCrossingLanding content={content} isAdmin={isAdmin} />
}
